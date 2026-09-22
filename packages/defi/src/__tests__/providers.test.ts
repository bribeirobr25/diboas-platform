import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PROVIDER_FETCH_TIMEOUT_MS, SANDBOX_MARKET_TTL_MS } from '../types';
import { observedStamp } from '../testing';
import { CoinGeckoPriceProvider } from '../providers/coingecko';
import { FIXTURE_APYS } from '../fixtures';
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
    /* Not null: the fixture fallback IS eligible for APY_HISTORY today, so a
       failed chart endpoint degrades rather than refuses. The `!== null` is the
       assertion, not a convenience — a refusal here would be a real change. */
    expect(history).not.toBeNull();
    expect(history!.points).toHaveLength(30);
    expect(history!.stamp.source).toBe('fixture');
    // Flat series: every point equals the fixture APY.
    const distinct = new Set(history!.points.map((p) => p.apyPercent));
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

  /**
   * ⚑ INVERTED 2026-09-17 (`5.406`/`5.407` containment) — and the old assertion
   * is quoted rather than deleted, because it is the finding.
   *
   * This test used to read *"should fall back to highest TVL on any chain when
   * the preferred chain has no pool"* and asserted `match?.pool === 'a'` — pool
   * `a` being an **Ethereum** deployment accepted for a leg that wanted Solana,
   * purely because the project name matched and its TVL was higher. So the
   * suite positively asserted the behaviour Founder/Strategy §3 names as
   * forbidden: *"Do not silently substitute another deployment."*
   *
   * That makes it a `5.114`-class test — one encoding a DEFECT as a
   * requirement. Inverting it (rather than removing it) keeps the reason in the
   * file: the caller now degrades to the protocol's own documented fixture,
   * which is the right network with an honest `fallbackUsed` stamp.
   */
  it('should return null rather than substitute another network when the preferred chain has no pool', () => {
    const match = matchPool(pools, {
      projects: ['aave-v3'],
      symbols: ['USDC'],
      preferredChains: ['Solana'],
    });
    expect(match).toBeNull();
    // Specifically NOT the Ethereum pool it used to hand back.
    expect(match?.pool).not.toBe('a');
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
    expect(history).not.toBeNull();
    expect(history!.stamp).toEqual(observedStamp('defillama', T0));
  });

  it('should stamp cached prices with their fetch time', async () => {
    const { CoinGeckoPriceProvider: Provider } = await import('../providers/coingecko');
    const { fetchImpl, calls } = counting({ 'usd-coin': { usd: 1, brl: 5.4, eur: 0.86 } });
    const provider = new Provider(fetchImpl, undefined);
    await provider.getPrices(['USDC'], 'EUR');
    at('2026-09-11T13:00:00.000Z');
    const [usdc] = await provider.getPrices(['USDC'], 'EUR');
    expect(calls.n).toBe(1);
    expect(usdc.stamp).toEqual(observedStamp('coingecko', T0));
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
    expect(history).not.toBeNull();
    expect(history!.stamp).toEqual(observedStamp('coingecko', T0));
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
    expect(history).not.toBeNull();
    expect(history!.stamp.source).toBe('fixture');
    expect(history!.points).toHaveLength(10);
  });

  it('should serve fixture prices instead of hanging', async () => {
    const { CoinGeckoPriceProvider: Provider } = await import('../providers/coingecko');
    const [q] = await new Provider(hanging, undefined, BOUND_MS).getPrices(['USDC'], 'USD');
    expect(q.stamp.source).toBe('fixture');
  });

  it('should serve a fixture price history instead of hanging', async () => {
    const { CoinGeckoPriceProvider: Provider } = await import('../providers/coingecko');
    const h = await new Provider(hanging, undefined, BOUND_MS).getPriceHistory('jito', 10);
    expect(h).not.toBeNull();
    expect(h!.stamp.source).toBe('fixture');
  });

  it('should keep the server bound below the client abort, or the fallback is never seen', () => {
    // `apps/sandbox/src/hooks/useMarket.ts` aborts `fetchSeries` at 15 s. A
    // server bound at or above it would let the browser give up before the
    // fixture arrived — the failure this constant exists to prevent.
    expect(PROVIDER_FETCH_TIMEOUT_MS).toBeLessThan(15_000);
  });
});

/**
 * `5.406`/`5.407` §3 · the live observation must AGREE with Product identity.
 *
 * `CURRENT_CATALOG_PROTOCOL_NETWORK` is the Product-owned intended network. Before this,
 * `ProtocolApy.chain` was captured and never compared to it anywhere in app
 * code, so the invariant held by LUCK — a shift in DeFiLlama's pool set was all
 * it took. An absent chain was additionally defaulted to `'Solana'`, inventing
 * a real, named network for an unknown one.
 *
 * ⚑ ISOLATION IS LOAD-BEARING HERE, and the first version of this describe had
 * none. `poolsCache` is a module-level `let` with no exported reset, so without
 * `vi.resetModules()` + a dynamic import every test in this file re-serves the
 * FIRST feed any test fetched. Two of these three then failed against a cached
 * `apy: 5.4`, and — worse — the missing-chain case PASSED VACUOUSLY: the cached
 * list held no sanctum pool at all, so it degraded to fixture with or without
 * the fix. Cache isolation is what makes these assertions mean anything.
 */
describe('5.406/5.407 — a provider observation may not define or mutate network identity', () => {
  beforeEach(() => vi.resetModules());

  /** Fresh module state per test, or `poolsCache` answers for the last one. */
  const freshProvider = async (body: unknown) => {
    const { DefiLlamaApyProvider } = await import('../providers/defillama');
    return new DefiLlamaApyProvider(jsonFetch(body));
  };

  it('should refuse a WRONG-network observation and degrade to that protocol own fixture', async () => {
    /* aaveV3 is Arbitrum by Product identity. This feed offers ONLY a Solana
       pool under the right project+symbol with a huge TVL — exactly the
       substitution §3 forbids: *"Do not silently substitute another
       deployment."*

       Mechanism, stated precisely: aaveV3's `preferredChains` is ['Arbitrum']
       alone, so `matchPool` refuses this outright and the identity guard is
       never consulted. Both layers forbid it; this test pins the FIRST. */
    const provider = await freshProvider({
      data: [
        { pool: 'x', project: 'aave-v3', chain: 'Solana', symbol: 'USDC', apy: 99, tvlUsd: 1e9 },
      ],
    });
    const [aave] = await provider.getCurrentApys(['aaveV3']);
    expect(aave.apyPercent).toBe(FIXTURE_APYS.aaveV3.apyPercent);
    expect(aave.apyPercent).not.toBe(99);
    expect(aave.chain).toBe('Arbitrum'); // the fixture's network, never the feed's
    expect(aave.stamp.source).toBe('fixture');
  });

  it('should refuse an observation with NO chain instead of defaulting it to Solana', async () => {
    /**
     * ⛑ MY EARLIER COMMENT HERE CLAIMED THIS WAS "NON-VACUOUS BY
     * CONSTRUCTION". That was FALSE, and the P5 sabotage proved it: disabling
     * the identity guard left this test green.
     *
     * The real mechanism: `matchPool` filters `p.chain === chain` against
     * `preferredChains`, so a pool carrying NO chain matches nothing and
     * `matchPool` returns null — the caller then degrades to fixture. So this
     * asserts the OUTCOME (`?? 'Solana'` can no longer invent a network) via
     * `matchPool`'s refusal, NOT via the identity guard.
     *
     * The `!observed` half of that guard is therefore defensive and currently
     * unreachable — `LlamaPool.chain` is typed `string` and equality matching
     * cannot return a chainless pool. Stated rather than covered: the guard's
     * reachable case is the Ethereum one below.
     */
    const provider = await freshProvider({
      data: [{ pool: 'y', project: 'sanctum-infinity', symbol: 'INF', apy: 77, tvlUsd: 1e9 }],
    });
    const [sanctum] = await provider.getCurrentApys(['sanctumInf']);
    expect(sanctum.apyPercent).toBe(FIXTURE_APYS.sanctumInf.apyPercent);
    expect(sanctum.apyPercent).not.toBe(77);
    expect(sanctum.stamp.source).toBe('fixture');
  });

  it('should refuse a SECOND-PREFERENCE network that disagrees with Product identity', async () => {
    /**
     * THE CASE THAT MAKES THE IDENTITY GUARD LOAD-BEARING — found by the P5
     * sabotage, which passed until this existed.
     *
     * `skySsr`'s matcher lists `preferredChains: ['Arbitrum', 'Ethereum']`, so
     * `matchPool` legitimately accepts an ETHEREUM sky pool as second
     * preference. But `CURRENT_CATALOG_PROTOCOL_NETWORK.skySsr` is **Arbitrum** — Product
     * identity names one network, and Ethereum is not it. Only the agreement
     * check in `getCurrentApys` can refuse this; `matchPool` cannot, because
     * from its point of view the pool matched a declared preference.
     *
     * This is not hypothetical: that second preference is real shipped config,
     * and `skySsr` is a leg of ALL TEN catalogue strategies.
     */
    const provider = await freshProvider({
      data: [
        {
          pool: 'eth-sky',
          project: 'sky-lending',
          chain: 'Ethereum',
          symbol: 'USDS',
          apy: 42,
          tvlUsd: 1e9,
        },
      ],
    });
    const [sky] = await provider.getCurrentApys(['skySsr']);
    expect(sky.apyPercent).toBe(FIXTURE_APYS.skySsr.apyPercent);
    expect(sky.apyPercent).not.toBe(42);
    expect(sky.chain).toBe('Arbitrum'); // identity, never the observation's network
    expect(sky.stamp.source).toBe('fixture');
  });

  it('should accept an observation whose network AGREES (evidence may be used)', async () => {
    const provider = await freshProvider({
      data: [
        { pool: 'z', project: 'aave-v3', chain: 'Arbitrum', symbol: 'USDC', apy: 5.9, tvlUsd: 1e9 },
      ],
    });
    const [aave] = await provider.getCurrentApys(['aaveV3']);
    expect(aave.chain).toBe('Arbitrum');
    expect(aave.apyPercent).toBe(5.9);
    expect(aave.stamp.source).toBe('defillama');
  });
});
