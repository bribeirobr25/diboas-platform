/**
 * E1 — provider request safeguards (2026-10-20): the key never leaves the
 * provider's origin, retries are bounded, and every attempt keeps its own
 * evidence. Synthetic only: a fake fetch, or two local HTTP servers for the
 * redirect case. No provider is contacted and no real key is used.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ProviderStopped,
  REQUEST_POLICY,
  createEvidenceStore,
  fetchProviderJson,
} from '../../../../scripts/market-refresh/etf-daily/request.mjs';
import { collectProvider } from '../../../../scripts/market-refresh/etf-daily/providers.mjs';

// A stand-in, deliberately not key-shaped (the secrets scan must stay quiet).
const KEY = 'x'.repeat(20);
const ORIGIN = 'https://api.example.test';
const URL_OK = `${ORIGIN}/v1/flows`;
const noSleep = async () => {};

const dirs: string[] = [];
const servers: http.Server[] = [];
afterEach(async () => {
  for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
  await Promise.all(servers.splice(0).map((s) => new Promise((r) => s.close(() => r(null)))));
});

function store() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'etf-evidence-'));
  dirs.push(dir);
  return { dir, evidence: createEvidenceStore(dir, [KEY]) };
}
const manifest = (dir: string) =>
  fs
    .readFileSync(path.join(dir, 'manifest.jsonl'), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));

type Answer = { status?: number; body?: string; throws?: string };
function fakeFetch(answers: Answer[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fn = async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const a = answers.shift();
    if (!a) throw new Error('no answer left');
    if (a.throws) throw new TypeError(a.throws);
    return new Response(a.body ?? '{}', { status: a.status ?? 200 });
  };
  return { fn: fn as unknown as typeof fetch, calls };
}

const call = (
  fetchImpl: typeof fetch,
  evidence: ReturnType<typeof createEvidenceStore>,
  url = URL_OK
) =>
  fetchProviderJson({
    provider: 'cryptoetf',
    url,
    allowedOrigin: ORIGIN,
    headers: { 'X-API-Key': KEY },
    evidence,
    secrets: [KEY],
    fetchImpl,
    sleep: noSleep,
  });

describe('origin and redirects — the key never reaches another host', () => {
  it('should refuse a URL on another origin before sending anything', async () => {
    const { evidence } = store();
    const f = fakeFetch([{ body: '{}' }]);
    await expect(call(f.fn, evidence, 'https://evil.example.test/v1/flows')).rejects.toThrow(
      /refused to send a request to another origin/
    );
    expect(f.calls).toEqual([]);
  });

  it('should ask fetch to refuse redirects and send the key only in its header', async () => {
    const { evidence } = store();
    const f = fakeFetch([{ body: '{"ok":true}' }]);
    await expect(call(f.fn, evidence)).resolves.toMatchObject({ json: { ok: true } });
    expect(f.calls[0].init).toMatchObject({ redirect: 'error', headers: { 'X-API-Key': KEY } });
    expect(f.calls[0].url).not.toContain(KEY);
  });

  it('should not send the key to the target of a real cross-origin redirect (and the control proves the danger)', async () => {
    const seenByOther: http.IncomingHttpHeaders[] = [];
    const listen = (handler: http.RequestListener) =>
      new Promise<string>((resolve) => {
        const s = http.createServer(handler);
        servers.push(s);
        s.listen(0, '127.0.0.1', () =>
          resolve(`http://127.0.0.1:${(s.address() as { port: number }).port}`)
        );
      });
    const other = await listen((req, res) => {
      seenByOther.push(req.headers);
      res.end('{}');
    });
    const provider = await listen((_req, res) => {
      res.writeHead(302, { location: `${other}/collect` });
      res.end();
    });
    const { evidence } = store();
    const request = (fetchImpl: typeof fetch) =>
      fetchProviderJson({
        provider: 'cryptoetf',
        url: `${provider}/v1/flows`,
        allowedOrigin: provider,
        headers: { 'X-API-Key': KEY },
        evidence,
        secrets: [KEY],
        fetchImpl,
        sleep: noSleep,
      });

    await expect(request(fetch)).rejects.toThrow(/request failed/);
    expect(seenByOther).toHaveLength(0);

    // Control: the same request with redirects followed hands the key over.
    const following = ((u: string, init: RequestInit) =>
      fetch(u, { ...init, redirect: 'follow' })) as typeof fetch;
    await request(following);
    expect(seenByOther[0]?.['x-api-key']).toBe(KEY);
  });
});

describe('bounded retries, one evidence file per attempt', () => {
  it('should retry a 500 once, keep both bodies, and return the 200', async () => {
    const { dir, evidence } = store();
    const f = fakeFetch([
      { status: 500, body: 'first failure' },
      { status: 200, body: '{"days":[]}' },
    ]);
    await expect(call(f.fn, evidence)).resolves.toMatchObject({ json: { days: [] } });
    const rows = manifest(dir);
    expect(rows.map((r) => [r.attempt, r.status])).toEqual([
      [1, 500],
      [2, 200],
    ]);
    expect(rows[0].saved_as).not.toBe(rows[1].saved_as);
    const first = fs.readFileSync(path.join(dir, rows[0].saved_as), 'utf8');
    expect(first).toBe('first failure');
    expect(crypto.createHash('sha256').update(first).digest('hex')).toBe(rows[0].sha256);
  });

  it('should stop after two 500s and keep both', async () => {
    const { dir, evidence } = store();
    const f = fakeFetch([{ status: 500 }, { status: 503 }]);
    await expect(call(f.fn, evidence)).rejects.toThrow(/HTTP 503/);
    expect(manifest(dir).map((r) => r.status)).toEqual([500, 503]);
    expect(f.calls).toHaveLength(REQUEST_POLICY.maxAttempts);
  });

  it('should retry a network error once and record the error without a body', async () => {
    const { dir, evidence } = store();
    const f = fakeFetch([{ throws: 'fetch failed' }, { body: '{}' }]);
    await call(f.fn, evidence);
    const [failed, ok] = manifest(dir);
    expect(failed).toMatchObject({ attempt: 1, status: null, saved_as: null });
    expect(failed.error).toContain('fetch failed');
    expect(ok).toMatchObject({ attempt: 2, status: 200 });
  });

  it.each([401, 403, 429])('should stop the provider on %i without retrying', async (status) => {
    const { dir, evidence } = store();
    const f = fakeFetch([{ status }, { body: '{}' }]);
    await expect(call(f.fn, evidence)).rejects.toBeInstanceOf(ProviderStopped);
    expect(f.calls).toHaveLength(1);
    expect(manifest(dir)).toHaveLength(1);
  });

  it('should refuse a 200 that is not JSON and name its evidence', async () => {
    const { evidence } = store();
    await expect(call(fakeFetch([{ body: '<html>' }]).fn, evidence)).rejects.toThrow(
      /not JSON \(evidence .+-cryptoetf-/
    );
  });

  it('should never overwrite an earlier body file', () => {
    const { dir, evidence } = store();
    const a = evidence.record({
      provider: 'cryptoetf',
      url: URL_OK,
      attempt: 1,
      retrievedAt: '2026-10-19T05:00:00.000Z',
      status: 200,
      body: 'A',
    });
    const b = evidence.record({
      provider: 'cryptoetf',
      url: URL_OK,
      attempt: 1,
      retrievedAt: '2026-10-19T05:00:00.000Z',
      status: 200,
      body: 'B',
    });
    expect(a.saved_as).not.toBeNull();
    expect(a.saved_as).not.toBe(b.saved_as);
    expect(fs.readFileSync(path.join(dir, String(a.saved_as)), 'utf8')).toBe('A');
  });
});

describe('secrets stay out of evidence and errors', () => {
  it('should redact a key the provider echoes in its body, and in error messages', async () => {
    const { dir, evidence } = store();
    const f = fakeFetch([{ throws: `boom ${KEY}` }, { body: `{"echo":"${KEY}"}` }]);
    await call(f.fn, evidence);
    const text = fs.readFileSync(path.join(dir, 'manifest.jsonl'), 'utf8');
    const bodies = fs
      .readdirSync(path.join(dir, 'bodies'))
      .map((n) => fs.readFileSync(path.join(dir, 'bodies', n), 'utf8'));
    expect(text).not.toContain(KEY);
    expect(bodies.join('')).not.toContain(KEY);
    expect(bodies.join('')).toContain('[REDACTED]');
  });

  it('should refuse to collect without the key, naming the variable but never a value', async () => {
    const { evidence } = store();
    await expect(collectProvider('cryptoetf', { env: {}, evidence, tickers: [] })).rejects.toThrow(
      'cryptoetf: CRYPTOETF_API_KEY is not set'
    );
  });

  it('should collect SoSoValue per fund, paced, through the same safeguards', async () => {
    const { evidence } = store();
    const urls: string[] = [];
    const paced: number[] = [];
    const fetchImpl = (async (u: string, init: RequestInit) => {
      urls.push(u);
      expect(init).toMatchObject({ redirect: 'error', headers: { 'x-soso-api-key': KEY } });
      const t = u.split('/etfs/')[1].split('/')[0];
      return new Response(
        JSON.stringify({ code: 0, data: [{ date: '2026-10-15', ticker: t, net_inflow: 1 }] })
      );
    }) as unknown as typeof fetch;
    const out = await collectProvider('sosovalue', {
      env: { SOSOVALUE_API_KEY: KEY },
      evidence,
      tickers: ['IBIT', 'FBTC'],
      fetchImpl,
      sleep: async (ms: number) => {
        paced.push(ms);
      },
    });
    expect(urls).toEqual([
      'https://openapi.sosovalue.com/openapi/v1/etfs/IBIT/history',
      'https://openapi.sosovalue.com/openapi/v1/etfs/FBTC/history',
    ]);
    expect(paced).toEqual([3_500]);
    expect(out.rows).toHaveLength(2);
  });
});
