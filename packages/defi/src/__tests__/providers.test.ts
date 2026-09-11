import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PROVIDER_FETCH_TIMEOUT_MS, SANDBOX_MARKET_TTL_MS } from '../types';
import { CoinGeckoPriceProvider } from '../providers/coingecko';
import { DefiLlamaApyProvider, matchPool } from '../providers/defillama';
import { FixtureGasProvider } from '../providers/gas';

/** A fetch stub that always fails — exercises the fail-open fixture path. */
const failingFetch: typeof fetch = async () => {
  throw new Error('network down');
};

/** A fetch stub returning a canned JSON body. */
function jsonFetch(body: unknown): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })) as typeof fetch;
}

describe('DefiLlamaApyProvider (fail-open contract, Principle 7)', () => {
  it('should degrade to fixture APYs with an honest fixture stamp when the network fails', async () => {
    const provider = new DefiLlamaApyProvider(failingFetch);
    const apys = await provider.getCurrentApys(['skySsr', 'jito']);
    expect(apys).toHaveLength(2);
    for (const apy of apys) {
      expect(apy.stamp.source).toBe('fixture');
      expect(apy.apyPercent).toBeGreaterThan(0);
    }
  });

  it('should return live-stamped APYs when the pools feed matches', async () => {
    const provider = new DefiLlamaApyProvider(
      jsonFetch({
        data: [
          {
            pool: 'uuid-1',
            project: 'aave-v3',
            chain: 'Arbitrum',
            symbol: 'USDC',
            apy: 5.4,
            tvlUsd: 100_000_000,
          },
        ],
      })
    );
    const [aave] = await provider.getCurrentApys(['aaveV3']);
    expect(aave.stamp.source).toBe('defillama');
    expect(aave.apyPercent).toBe(5.4);
    expect(aave.chain).toBe('Arbitrum');
  });

  it('should produce a flat fixture-stamped history series when the chart endpoint fails', async () => {
    const provider = new DefiLlamaApyProvider(failingFetch);
    const history = await provider.getApyHistory('compoundV3', 30);
    expect(history.points).toHaveLength(30);
    expect(history.stamp.source).toBe('fixture');
    // Flat series: every point equals the fixture APY.
    const distinct = new Set(history.points.map((p) => p.apyPercent));
    expect(distinct.size).toBe(1);
  });
});

describe('matchPool (preference rules)', () => {
  const pools = [
    { pool: 'a', project: 'aave-v3', chain: 'Ethereum', symbol: 'USDC', apy: 4, tvlUsd: 900 },
    { pool: 'b', project: 'aave-v3', chain: 'Arbitrum', symbol: 'USDC', apy: 5, tvlUsd: 100 },
    { pool: 'c', project: 'aave-v3', chain: 'Arbitrum', symbol: 'USDC', apy: 6, tvlUsd: 500 },
  ];

  it('should prefer the preferred chain and the highest TVL within it', () => {
    const match = matchPool(pools, {
      projects: ['aave-v3'],
      symbols: ['USDC'],
      preferredChains: ['Arbitrum'],
    });
    expect(match?.pool).toBe('c');
  });

  it('should fall back to highest TVL on any chain when the preferred chain has no pool', () => {
    const match = matchPool(pools, {
      projects: ['aave-v3'],
      symbols: ['USDC'],
      preferredChains: ['Solana'],
    });
    expect(match?.pool).toBe('a');
  });

  it('should return null when nothing matches (caller degrades to fixture)', () => {
    expect(
      matchPool(pools, { projects: ['nope'], symbols: ['USDC'], preferredChains: ['Arbitrum'] })
    ).toBeNull();
  });
});

describe('CoinGeckoPriceProvider (fail-open contract)', () => {
  it('should degrade to fixture prices with an honest stamp when the network fails', async () => {
    const provider = new CoinGeckoPriceProvider(failingFetch, undefined);
    const quotes = await provider.getPrices(['BTC', 'USDC'], 'BRL');
    expect(quotes).toHaveLength(2);
    for (const q of quotes) expect(q.stamp.source).toBe('fixture');
    // USDC fixture in BRL uses the documented fixture FX, never 1:1.
    const usdc = quotes.find((q) => q.assetId === 'USDC');
    expect(usdc?.price).toBeGreaterThan(1);
  });
});

describe('FixtureGasProvider', () => {
  it('should stamp every quote as fixture and cover all chains of the asset scope', async () => {
    const provider = new FixtureGasProvider();
    for (const chain of ['Solana', 'Arbitrum', 'Ethereum', 'Bitcoin', 'Sui'] as const) {
      const quote = await provider.getGas(chain);
      expect(quote.stamp.source).toBe('fixture');
      expect(quote.typicalFeeUsd).toBeGreaterThan(0);
    }
  });
});

describe('the ruled sandbox market TTL (founder 2026-08-19, P2BD-14 — drift guard)', () => {
  it('should hold every provider cache to the 6-hour refresh bound', () => {
    expect(SANDBOX_MARKET_TTL_MS).toBe(6 * 60 * 60 * 1000);
  });
});

/**
 * Data Vintage P-4 — "never post-date unverified data; freshness is never
 * simulated by re-stamping."
 *
 * Every provider used to mint `asOf` as `new Date()` at SERVE time, after
 * reading a cache that may be six hours old — so a stale value was stamped as
 * now. Verified live on 2026-09-11: three requests seconds apart returned three
 * different `asOf` values for the same cached pools. These tests pin the stamp
 * to the fetch, observed through an upstream call counter rather than assumed.
 *
 * Fresh module state per test (`vi.resetModules`) because the caches are
 * module-level: without it, a value cached by an earlier test would make a
 * "first fetch" silently a cache hit.
 */
describe('provenance stamps carry the FETCH time, never the serve time (Data Vintage P-4)', () => {
  const T0 = '2026-09-11T08:00:00.000Z';
  const at = (iso: string) => vi.setSystemTime(new Date(iso));

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    at(T0);
  });
  afterEach(() => vi.useRealTimers());

  /** A JSON stub that counts upstream calls, so "served from cache" is observed. */
  function counting(body: unknown) {
    const calls = { n: 0 };
    const fetchImpl = (async () => {
      calls.n += 1;
      return new Response(JSON.stringify(body), { status: 200 });
    }) as typeof fetch;
    return { fetchImpl, calls };
  }
  const aavePool = {
    pool: 'uuid-1',
    project: 'aave-v3',
    chain: 'Arbitrum',
    symbol: 'USDC',
    apy: 5.4,
    tvlUsd: 100_000_000,
  };

  it('should keep a cached APY stamped at the moment it was fetched', async () => {
    const { DefiLlamaApyProvider: Provider } = await import('../providers/defillama');
    const { fetchImpl, calls } = counting({ data: [aavePool] });
    const provider = new Provider(fetchImpl);
    const [first] = await provider.getCurrentApys(['aaveV3']);
    at('2026-09-11T10:00:00.000Z'); // two hours later — inside the six-hour TTL
    const [second] = await provider.getCurrentApys(['aaveV3']);
    expect(calls.n).toBe(1); // genuinely served from cache
    expect(first.stamp.asOf).toBe(T0);
    // The defect: this read 10:00 — a two-hour-old value stamped as now.
    expect(second.stamp.asOf).toBe(T0);
  });

  it('should re-stamp only when the data is actually re-fetched after the TTL', async () => {
    const { DefiLlamaApyProvider: Provider } = await import('../providers/defillama');
    const { fetchImpl, calls } = counting({ data: [aavePool] });
    const provider = new Provider(fetchImpl);
    await provider.getCurrentApys(['aaveV3']);
    const later = new Date(Date.parse(T0) + SANDBOX_MARKET_TTL_MS + 60_000).toISOString();
    at(later);
    const [refetched] = await provider.getCurrentApys(['aaveV3']);
    expect(calls.n).toBe(2);
    expect(refetched.stamp.asOf).toBe(later);
  });

  it('should stamp APY history with its own fetch time', async () => {
    const { DefiLlamaApyProvider: Provider } = await import('../providers/defillama');
    const chart = { data: [{ timestamp: '2026-09-10T00:00:00Z', apy: 5 }] };
    let n = 0;
    const fetchImpl = (async (url: string) => {
      n += 1;
      const body = String(url).includes('/chart/') ? chart : { data: [aavePool] };
      return new Response(JSON.stringify(body), { status: 200 });
    }) as unknown as typeof fetch;
    const provider = new Provider(fetchImpl);
    await provider.getApyHistory('aaveV3', 30);
    at('2026-09-11T11:30:00.000Z');
    const history = await provider.getApyHistory('aaveV3', 30);
    expect(n).toBe(2); // one /pools + one /chart, then both served from cache
    expect(history.stamp).toEqual({ source: 'defillama', asOf: T0 });
  });

  it('should stamp cached prices with their fetch time', async () => {
    const { CoinGeckoPriceProvider: Provider } = await import('../providers/coingecko');
    const { fetchImpl, calls } = counting({ 'usd-coin': { usd: 1, brl: 5.4, eur: 0.86 } });
    const provider = new Provider(fetchImpl, undefined);
    await provider.getPrices(['USDC'], 'EUR');
    at('2026-09-11T13:00:00.000Z');
    const [usdc] = await provider.getPrices(['USDC'], 'EUR');
    expect(calls.n).toBe(1);
    expect(usdc.stamp).toEqual({ source: 'coingecko', asOf: T0 });
  });

  it('should stamp price history with its fetch time', async () => {
    const { CoinGeckoPriceProvider: Provider } = await import('../providers/coingecko');
    const day = Date.parse('2026-09-10T00:00:00Z');
    const { fetchImpl, calls } = counting({ prices: [[day, 70.1]] });
    const provider = new Provider(fetchImpl, undefined);
    await provider.getPriceHistory('jito', 30);
    at('2026-09-11T09:45:00.000Z');
    const history = await provider.getPriceHistory('jito', 30);
    expect(calls.n).toBe(1);
    expect(history.stamp).toEqual({ source: 'coingecko', asOf: T0 });
  });
});

/**
 * Principle 7 — "never let the system crash … provide fallback strategies."
 *
 * No provider fetch had a timeout. A hung upstream therefore held the function
 * open to the platform limit, and the browser aborted first (`fetchSeries`
 * gives up at 15 s) — so the honest fixture fallback that exists for exactly
 * this case was never served. The stub below never answers unless aborted:
 * without the bound these tests hang and fail on vitest's own timeout.
 */
describe('a hung upstream fails open within the bound (Principle 7)', () => {
  const hanging: typeof fetch = (_input, init) =>
    new Promise((_, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    });
  const BOUND_MS = 30;

  beforeEach(() => vi.resetModules());

  it('should serve fixture APYs instead of hanging', async () => {
    const { DefiLlamaApyProvider: Provider } = await import('../providers/defillama');
    const [apy] = await new Provider(hanging, BOUND_MS).getCurrentApys(['skySsr']);
    expect(apy.stamp.source).toBe('fixture');
  });

  it('should serve a fixture APY history instead of hanging', async () => {
    const { DefiLlamaApyProvider: Provider } = await import('../providers/defillama');
    const history = await new Provider(hanging, BOUND_MS).getApyHistory('skySsr', 10);
    expect(history.stamp.source).toBe('fixture');
    expect(history.points).toHaveLength(10);
  });

  it('should serve fixture prices instead of hanging', async () => {
    const { CoinGeckoPriceProvider: Provider } = await import('../providers/coingecko');
    const [q] = await new Provider(hanging, undefined, BOUND_MS).getPrices(['USDC'], 'USD');
    expect(q.stamp.source).toBe('fixture');
  });

  it('should serve a fixture price history instead of hanging', async () => {
    const { CoinGeckoPriceProvider: Provider } = await import('../providers/coingecko');
    const h = await new Provider(hanging, undefined, BOUND_MS).getPriceHistory('jito', 10);
    expect(h.stamp.source).toBe('fixture');
  });

  it('should keep the server bound below the client abort, or the fallback is never seen', () => {
    // `apps/sandbox/src/hooks/useMarket.ts` aborts `fetchSeries` at 15 s. A
    // server bound at or above it would let the browser give up before the
    // fixture arrived — the failure this constant exists to prevent.
    expect(PROVIDER_FETCH_TIMEOUT_MS).toBeLessThan(15_000);
  });
});
