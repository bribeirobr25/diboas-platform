/**
 * The five providers — the collection stage (PENDING_ALL 5.134(c), 5.366).
 *
 * WHY THIS EXISTS. Collection was the one lifecycle stage with no tests at all:
 * four live providers, zero coverage, verified only by watching a real run
 * succeed. Its CONTROLS were guarded (the dual-source BTC divergence check and
 * the outlier bounds are both sabotage-proven in `qualityGate.test.ts`), but
 * nothing exercised the parsing itself, or what happens when a source answers
 * badly rather than not at all.
 *
 * `fetch` is stubbed throughout. These assert how a RESPONSE is turned into a
 * series, and that a malformed one is refused rather than silently parsed into
 * plausible rubbish — the failure that would put invented numbers on the page.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchFredSeries } from '../../../../scripts/market-refresh/providers/fred.mjs';
import { fetchYahooDaily } from '../../../../scripts/market-refresh/providers/yahoo.mjs';
import {
  fetchWithTimeout,
  FETCH_TIMEOUT_MS,
} from '../../../../scripts/market-refresh/lib/fetch-timeout.mjs';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

const res = (body: string | object, init: { ok?: boolean; status?: number } = {}) =>
  ({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    json: async () => (typeof body === 'string' ? JSON.parse(body) : body),
  }) as unknown as Response;

const stub = (impl: (url: string, opts?: RequestInit) => Promise<Response>) => {
  globalThis.fetch = vi.fn(impl) as unknown as typeof fetch;
};

describe('fetchWithTimeout — no source fetch may hang (5.366)', () => {
  it('should pass an AbortSignal on every request', async () => {
    let seen: RequestInit | undefined;
    stub(async (_u, o) => {
      seen = o;
      return res('observation_date,X\n2026-01-01,1\n');
    });
    await fetchWithTimeout('https://example.test/x', { label: 'probe' });
    expect(seen?.signal, 'no signal — the request could hang forever').toBeDefined();
  });

  it('should name the source and the budget when it times out', async () => {
    stub(async () => {
      const e = new Error('aborted');
      e.name = 'TimeoutError';
      throw e;
    });
    await expect(
      fetchWithTimeout('https://example.test/x', { label: 'FRED:DGS10' })
    ).rejects.toThrow(/FRED:DGS10.*timed out/);
  });

  it('should not disguise a non-timeout failure as a timeout', async () => {
    stub(async () => {
      throw new Error('ECONNREFUSED');
    });
    await expect(fetchWithTimeout('https://example.test/x', { label: 'x' })).rejects.toThrow(
      /ECONNREFUSED/
    );
  });

  it('should keep the per-attempt budget bounded and finite', () => {
    expect(FETCH_TIMEOUT_MS).toBeGreaterThan(0);
    expect(Number.isFinite(FETCH_TIMEOUT_MS)).toBe(true);
    // Three attempts (withRetry: 2 retries) must stay well inside the job's
    // 20-minute cap, or one dead source still costs the whole week.
    expect(3 * FETCH_TIMEOUT_MS).toBeLessThan(20 * 60 * 1000);
  });
});

describe('fred — CSV parsing and refusal', () => {
  it('should parse observations into [Date, number] pairs', async () => {
    stub(async () => res('observation_date,DGS10\n2026-01-02,4.10\n2026-01-03,4.25\n'));
    const { series, provenance } = await fetchFredSeries('DGS10');
    expect(series).toHaveLength(2);
    expect(series[0][0]).toBeInstanceOf(Date);
    expect(series[0][0].toISOString()).toBe('2026-01-02T00:00:00.000Z');
    expect(series[1][1]).toBe(4.25);
    expect(provenance.source).toBe('FRED:DGS10');
  });

  it("should drop FRED's '.' missing-value marker rather than parse it as a number", async () => {
    // `Number.parseFloat('.')` is NaN. A NaN close would flow into every
    // downstream average and poison it silently.
    stub(async () => res('observation_date,DGS10\n2026-01-02,.\n2026-01-03,4.25\n'));
    const { series } = await fetchFredSeries('DGS10');
    expect(series).toHaveLength(1);
    expect(series.every(([, v]: [Date, number]) => Number.isFinite(v))).toBe(true);
  });

  it('should refuse an HTML error page served with a 200', async () => {
    // The failure mode that matters: a proxy or outage page parses into zero
    // rows and would read as "the series is empty", not "the fetch failed".
    stub(async () => res('<!DOCTYPE html><html>error</html>'));
    await expect(fetchFredSeries('DGS10')).rejects.toThrow(/non-CSV/);
  });

  it('should refuse a non-OK status', async () => {
    stub(async () => res('', { ok: false, status: 503 }));
    await expect(fetchFredSeries('DGS10')).rejects.toThrow(/503/);
  });
});

describe('yahoo — chart parsing and refusal', () => {
  const chart = (ts: number[], closes: (number | null)[]) => ({
    chart: { result: [{ timestamp: ts, indicators: { quote: [{ close: closes }] } }] },
  });

  it('should pair timestamps with closes and convert from epoch seconds', async () => {
    stub(async () => res(chart([1767225600, 1767312000], [90000, 91000])));
    const { series, provenance } = await fetchYahooDaily('BTC-USD');
    expect(series).toHaveLength(2);
    expect(series[0][0].toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(series[0][1]).toBe(90000);
    expect(provenance.source).toBe('Yahoo:BTC-USD');
  });

  it('should drop null closes rather than emit them as gaps', async () => {
    // Yahoo returns null for non-trading slots; a null reaching an EMA makes
    // every subsequent value NaN.
    stub(async () => res(chart([1767225600, 1767312000, 1767398400], [90000, null, 91000])));
    const { series } = await fetchYahooDaily('BTC-USD');
    expect(series).toHaveLength(2);
    expect(series.every(([, v]: [Date, number]) => v != null)).toBe(true);
  });

  it('should refuse a response with no result block', async () => {
    stub(async () => res({ chart: { result: [] } }));
    await expect(fetchYahooDaily('BTC-USD')).rejects.toThrow(/bad response/);
  });

  it('should refuse a non-OK status', async () => {
    stub(async () => res('', { ok: false, status: 429 }));
    await expect(fetchYahooDaily('BTC-USD')).rejects.toThrow(/429/);
  });
});

describe('every provider goes through the timeout wrapper (structural)', () => {
  const FILES = ['fred.mjs', 'yahoo.mjs', 'coingecko.mjs', 'polygon.mjs'];
  it.each(FILES)('%s should not call bare fetch()', async (name) => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const src = readFileSync(
      join(__dirname, '../../../../scripts/market-refresh/providers', name),
      'utf8'
    );
    expect(src, `${name} calls fetch() directly — it can hang`).not.toMatch(/await fetch\(/);
    expect(src, `${name} does not use fetchWithTimeout`).toMatch(/fetchWithTimeout\(/);
  });
});
