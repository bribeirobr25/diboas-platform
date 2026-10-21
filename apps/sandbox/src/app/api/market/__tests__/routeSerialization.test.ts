import { afterEach, describe, expect, it, vi } from 'vitest';
import { PROTOCOL_IDS, legRequiresCurrentRate } from '@diboas/defi';
import { historyResponseIssue, marketResponseIssue } from '@/lib/market/responseShape';
import { marketUpstream } from '@/test/marketUpstream';

/**
 * `5.353` — REQUIREMENT: the completed browser-side checks ACCEPT what the real routes
 * really serialize, on every path a response can take:
 *
 * ```text
 * live-shaped   providers enabled, upstream answers   → OBSERVED stamps, upstream CALLED
 * fallback      providers enabled, upstream fails     → documented fallback, upstream CALLED
 * reference     sources switched off (kill switch)    → reference values, upstream NEVER called
 * ```
 *
 * Each case loads the route, the factory, the providers and their MODULE-LEVEL caches
 * afresh (`vi.resetModules` + dynamic import), with its own environment and a fixed
 * clock, so no case can be answered from another case's cache. Each asserts the upstream
 * calls it made and the provenance it got, so it proves the path it names. Only the
 * network is faked; the route, factory and provider code run for real.
 */

vi.mock('@/lib/evidence/ingest', () => ({ ingestNetworkCosts: async () => [] }));
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();
  return { ...actual, after: () => undefined };
});

const NOW = new Date('2026-10-19T12:00:00Z');
type Mode = 'answer' | 'fail' | 'offline';
async function runCase(env: Record<string, string>, mode: Mode) {
  vi.resetModules();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  const calls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown) => {
      const url = String(input);
      calls.push(url);
      if (mode === 'offline') throw new Error('this case must never reach the network');
      if (mode === 'fail') return new Response('upstream down', { status: 503 });
      return marketUpstream(url, NOW.getTime());
    })
  );
  const { NextRequest } = await import('next/server');
  const market = await import('../route');
  const history = await import('../history/route');
  const req = (path: string) =>
    new NextRequest(`http://localhost${path}`, {
      headers: { 'x-forwarded-for': `203.0.113.${calls.length % 250}` },
    });
  const m = await market.GET(req('/api/market?currency=USD'));
  const h = await history.GET(req('/api/market/history?days=30'));
  // The bytes a browser receives: serialized, then parsed — never the in-memory objects.
  return {
    mStatus: m.status,
    hStatus: h.status,
    mBody: JSON.parse(await m.text()) as Record<string, any>,
    hBody: JSON.parse(await h.text()) as Record<string, any>,
    calls,
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const ENABLED = {
  MARKET_SOURCES_DISABLED: '',
  COINGECKO_API_KEY: '',
  UPSTASH_REDIS_REST_URL: '',
  UPSTASH_REDIS_REST_TOKEN: '',
};

describe('the browser-side checks accept what the real routes serialize (5.353)', () => {
  it('live-shaped: OBSERVED stamps, upstream called, both responses accepted', async () => {
    const r = await runCase(ENABLED, 'answer');
    expect([r.mStatus, r.hStatus]).toEqual([200, 200]);
    expect(r.calls.some((u) => u.startsWith('https://yields.llama.fi/'))).toBe(true);
    expect(r.calls.some((u) => u.includes('coingecko'))).toBe(true);
    expect(r.mBody.apys.length).toBeGreaterThan(0);
    for (const a of r.mBody.apys)
      expect([a.stamp.source, a.stamp.origin, a.stamp.fallbackUsed]).toEqual([
        'defillama',
        'OBSERVED',
        false,
      ]);
    expect(r.mBody.usdPriceStamp.source).toBe('coingecko');
    expect(r.hBody.histories.length).toBeGreaterThan(0);
    expect(r.hBody.histories.some((s: any) => s.stamp.source === 'defillama')).toBe(true);
    // The live PRICE path too, not only the APY one: the three MARKET legs (whose return is
    // their price) must come from CoinGecko — a fixture there would mean the live series was
    // refused and this case proved less than its name. Lending legs carry the reference
    // price series by design.
    const priceSource = Object.fromEntries(
      r.hBody.priceHistories.map((s: any) => [s.protocolId, s.stamp.source])
    );
    // Market legs are DERIVED from the catalogue's own leg typing, never hand-listed.
    const marketLegs = PROTOCOL_IDS.filter((id) => !legRequiresCurrentRate(id));
    expect(marketLegs.length).toBeGreaterThan(0);
    expect(marketLegs.map((id) => priceSource[id])).toEqual(marketLegs.map(() => 'coingecko'));
    expect(marketResponseIssue(r.mBody, 'USD')).toBeNull();
    expect(historyResponseIssue(r.hBody)).toBeNull();
  });

  it('fallback: upstream failing, documented fallback stamps, both responses accepted', async () => {
    const r = await runCase(ENABLED, 'fail');
    expect([r.mStatus, r.hStatus]).toEqual([200, 200]);
    expect(r.calls.length).toBeGreaterThan(0); // it TRIED the sources
    expect(r.mBody.apys.length).toBeGreaterThan(0);
    for (const a of r.mBody.apys) expect(a.stamp.fallbackUsed).toBe(true);
    expect(r.mBody.apys.some((a: any) => a.stamp.source === 'defillama')).toBe(false);
    expect(r.hBody.histories.length).toBeGreaterThan(0); // an empty answer would pass trivially
    expect(marketResponseIssue(r.mBody, 'USD')).toBeNull();
    expect(historyResponseIssue(r.hBody)).toBeNull();
  });

  it('reference: sources switched off, upstream never called, day-only stamps accepted', async () => {
    const r = await runCase(
      { ...ENABLED, MARKET_SOURCES_DISABLED: 'defillama,coingecko' },
      'offline'
    );
    expect([r.mStatus, r.hStatus]).toEqual([200, 200]);
    expect(r.calls).toEqual([]);
    for (const a of r.mBody.apys) expect(a.stamp.source).toBe('fixture');
    expect(r.mBody.apys[0].stamp.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/); // the documented day-only stamp
    expect(r.hBody.histories.length).toBeGreaterThan(0);
    expect(r.hBody.priceHistories.length).toBeGreaterThan(0);
    expect(marketResponseIssue(r.mBody, 'USD')).toBeNull();
    expect(historyResponseIssue(r.hBody)).toBeNull();
  });

  it('should still refuse the same bytes for a currency that was not asked for', async () => {
    const r = await runCase(
      { ...ENABLED, MARKET_SOURCES_DISABLED: 'defillama,coingecko' },
      'offline'
    );
    expect(marketResponseIssue(r.mBody, 'EUR')).toBe('currency');
  });
});
