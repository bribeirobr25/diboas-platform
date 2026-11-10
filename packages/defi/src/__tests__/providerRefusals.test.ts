/**
 * `5.70` · THE PROVIDER REFUSAL BRANCHES, EACH ONE ASSERTED.
 *
 * A refusal that no test reaches can start accepting bad data without a single
 * test going red. Coverage named these branches as never taken: the bounds
 * checks, the HTTP failures and the response-shape failures in the CoinGecko
 * and DeFiLlama adapters. Every case below asserts the OUTCOME at the seam:
 *
 * - what the adapter returned (its refusal: a fixture when one is ELIGIBLE,
 *   otherwise nothing at all),
 * - what it did NOT return (the out-of-bounds or malformed value never leaves),
 * - and what it recorded (source health, evidence events) where the code
 *   records it.
 *
 * Each case runs on FRESH module state (`vi.resetModules` + dynamic import):
 * the revalidation caches, the health map and the evidence ring are all
 * module-level, so without it one test's feed answers for the next and a
 * refusal can pass vacuously on a cached value.
 *
 * No real network: every adapter gets an injected stub, and the global `fetch`
 * is replaced by one that fails the test if anything reaches it.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/* Disabling the FIXTURE makes the fallback ineligible without editing the
   declaration table (`fallbackFor` re-asks the substitute's disposition). */
const NO_FIXTURE: ReadonlySet<string> = new Set(['fixture']);

/** Every module the assertions read, from ONE fresh module graph. */
async function load() {
  vi.resetModules();
  const [gecko, llama, health, obs, fixtures] = await Promise.all([
    import('../providers/coingecko'),
    import('../providers/defillama'),
    import('../sourceHealth'),
    import('../evidenceObservability'),
    import('../fixtures'),
  ]);
  return { ...gecko, ...llama, ...health, ...obs, ...fixtures };
}

interface Call {
  url: string;
  headers: Record<string, string>;
}

/** A routed fetch stub that records every call — the instrument for "was a request made". */
function stubFetch(route: (url: string) => Response) {
  const calls: Call[] = [];
  const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, headers: { ...((init?.headers ?? {}) as Record<string, string>) } });
    return route(url);
  }) as typeof fetch;
  return { impl, calls };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

/** Never a real request: anything that reaches the global fetch fails the test. */
const reachedNetwork = vi.fn();
beforeEach(() => {
  reachedNetwork.mockReset();
  vi.stubGlobal('fetch', (async (...args: unknown[]) => {
    reachedNetwork(...args);
    throw new Error('the real network was reached from a unit test');
  }) as typeof fetch);
});
afterEach(() => {
  vi.unstubAllGlobals();
  expect(reachedNetwork).not.toHaveBeenCalled();
});

/* ───────────────────────────── CoinGecko · current prices ───────────────────────────── */

/** Live USD prices, deliberately distinct from every fixture price. */
const LIVE_USD: Record<string, number> = {
  bitcoin: 65_432.1,
  ethereum: 3_210.5,
  solana: 151.25,
  sui: 1.23,
  'usd-coin': 0.9998,
  'tether-gold': 2_612.4,
};

/** A full `/simple/price` body; an override of `undefined` drops that coin's row. */
function priceBody(overrides: Record<string, Record<string, unknown> | undefined> = {}) {
  const body: Record<string, unknown> = {};
  for (const [id, usd] of Object.entries(LIVE_USD)) {
    body[id] = { usd, brl: usd * 5.11, eur: usd * 0.93 };
  }
  return { ...body, ...overrides };
}

describe('CoinGecko current prices — an out-of-bounds price is refused per leg, never served', () => {
  it('should omit only the out-of-bounds asset and serve the others live when one price is outside its bounds', async () => {
    for (const bad of [0, -1, 1_000_000_001, 2e12]) {
      const m = await load();
      const { impl } = stubFetch(() => json(priceBody({ bitcoin: { usd: bad, brl: 1, eur: 1 } })));
      const quotes = await new m.CoinGeckoPriceProvider(impl, undefined).getPrices(
        ['BTC', 'USDC'],
        'USD'
      );
      // The refused leg is OMITTED: no BTC quote, and the bad number appears nowhere.
      expect(
        quotes.map((q) => q.assetId),
        `bad=${bad}`
      ).toEqual(['USDC']);
      expect(quotes.some((q) => q.price === bad)).toBe(false);
      // Not zero-filled, not clamped, and not silently swapped for the fixture either.
      expect(quotes.some((q) => q.price === m.FIXTURE_PRICES_USD.BTC)).toBe(false);
      // The healthy leg is still the live observation.
      expect(quotes[0].price).toBe(LIVE_USD['usd-coin']);
      expect(quotes[0].stamp.source).toBe('coingecko');
      expect(quotes[0].stamp).not.toEqual(m.FIXTURE_STAMP);
      // The request itself succeeded; the refusal is about the value, not the source.
      expect(m.sourceHealth('coingecko').lastOutcome).toBe('SUCCESS');
    }
  });

  it('should return no quote at all rather than a fixture when every requested price is outside its bounds', async () => {
    const m = await load();
    const { impl } = stubFetch(() =>
      json(
        priceBody({ bitcoin: { usd: 0, brl: 0, eur: 0 }, ethereum: { usd: -3, brl: -3, eur: -3 } })
      )
    );
    const quotes = await new m.CoinGeckoPriceProvider(impl, undefined).getPrices(
      ['BTC', 'ETH'],
      'USD'
    );
    expect(quotes).toEqual([]);
  });

  it('should still serve a price sitting exactly on the inclusive ceiling when the bound is respected', async () => {
    /* The control for the cases above: the bound refuses what is OUTSIDE it, it
       does not refuse everything large. 1e9 is the declared inclusive maximum. */
    const m = await load();
    const { impl } = stubFetch(() =>
      json(priceBody({ bitcoin: { usd: 1_000_000_000, brl: 1, eur: 1 } }))
    );
    const [btc] = await new m.CoinGeckoPriceProvider(impl, undefined).getPrices(['BTC'], 'USD');
    expect(btc.price).toBe(1_000_000_000);
    expect(btc.stamp.source).toBe('coingecko');
  });
});

describe('CoinGecko current prices — a missing or non-numeric price fails the read', () => {
  /* Every shape here reaches the `typeof price !== 'number'` guard: a coin row
     that is absent, a currency key that is absent, a string, a null (which is
     also what `JSON.stringify` makes of NaN and Infinity). */
  const MISSING: Array<[string, Record<string, Record<string, unknown> | undefined>]> = [
    ['an absent coin row', { bitcoin: undefined }],
    ['an absent currency key', { bitcoin: { usd: 65_000, eur: 60_000 } }],
    ['a string price', { bitcoin: { usd: 65_000, brl: '330000', eur: 60_000 } }],
    ['a null price (NaN / Infinity on the wire)', { bitcoin: { usd: 65_000, brl: null, eur: 1 } }],
  ];

  it('should serve the eligible fixture for every requested asset, never the live remainder, when one price is missing', async () => {
    for (const [label, override] of MISSING) {
      const m = await load();
      const { impl, calls } = stubFetch(() => json(priceBody(override)));
      const quotes = await new m.CoinGeckoPriceProvider(impl, undefined).getPrices(
        ['BTC', 'USDC'],
        'BRL'
      );
      expect(calls, label).toHaveLength(1);
      expect(
        quotes.map((q) => q.assetId),
        label
      ).toEqual(['BTC', 'USDC']);
      for (const q of quotes) {
        expect(q.stamp, label).toEqual(m.FIXTURE_STAMP);
        expect(q.price, label).toBe(m.FIXTURE_PRICES_USD[q.assetId] * m.FIXTURE_FX_FROM_USD.BRL);
      }
      // Never a blend: the live USDC price that WAS in the payload is not served.
      expect(
        quotes.some((q) => q.price === LIVE_USD['usd-coin'] * 5.11),
        label
      ).toBe(false);
      expect(m.sourceHealth('coingecko'), label).toMatchObject({
        lastOutcome: 'FAILURE',
        consecutiveFailures: 1,
      });
    }
  });

  it('should return nothing when a price is missing and no fallback is eligible', async () => {
    for (const [label, override] of MISSING) {
      const m = await load();
      const { impl } = stubFetch(() => json(priceBody(override)));
      const quotes = await new m.CoinGeckoPriceProvider(
        impl,
        undefined,
        undefined,
        NO_FIXTURE
      ).getPrices(['BTC', 'USDC'], 'BRL');
      expect(quotes, label).toEqual([]);
      expect(m.sourceHealth('coingecko').lastOutcome, label).toBe('FAILURE');
    }
  });
});

describe('CoinGecko current prices — an HTTP failure is a recorded source failure', () => {
  for (const status of [400, 401, 429, 500, 503]) {
    it(`should serve the eligible fixture and record a failure when /simple/price answers ${status}`, async () => {
      const m = await load();
      // The body is a perfectly valid price payload: only the status may refuse it.
      const { impl, calls } = stubFetch(() => json(priceBody(), status));
      const quotes = await new m.CoinGeckoPriceProvider(impl, undefined).getPrices(['ETH'], 'EUR');
      expect(calls).toHaveLength(1);
      expect(quotes).toHaveLength(1);
      expect(quotes[0].stamp).toEqual(m.FIXTURE_STAMP);
      expect(quotes[0].price).toBe(m.FIXTURE_PRICES_USD.ETH * m.FIXTURE_FX_FROM_USD.EUR);
      expect(quotes[0].price).not.toBe(LIVE_USD.ethereum * 0.93);
      expect(m.sourceHealth('coingecko')).toMatchObject({
        lastOutcome: 'FAILURE',
        consecutiveFailures: 1,
      });
    });
  }

  it('should return nothing on an HTTP failure when no fallback is eligible', async () => {
    const m = await load();
    const { impl } = stubFetch(() => json(priceBody(), 503));
    const quotes = await new m.CoinGeckoPriceProvider(
      impl,
      undefined,
      undefined,
      NO_FIXTURE
    ).getPrices(['ETH', 'BTC'], 'USD');
    expect(quotes).toEqual([]);
    expect(m.sourceHealth('coingecko').lastOutcome).toBe('FAILURE');
  });
});

describe('CoinGecko — the Demo key travels only when it exists', () => {
  /* Not a refusal, but the other arm of a branch the coverage named: an absent
     key must not be sent as a header holding `undefined`. */
  const chartOk = () =>
    json({
      prices: [
        [Date.parse('2026-09-01T00:00:00Z'), 70],
        [Date.parse('2026-09-02T00:00:00Z'), 71],
      ],
    });

  it('should send the Demo key header on both endpoints when a key is configured', async () => {
    const m = await load();
    const { impl, calls } = stubFetch((url) =>
      url.includes('market_chart') ? chartOk() : json(priceBody())
    );
    const provider = new m.CoinGeckoPriceProvider(impl, 'demo-key-123');
    await provider.getPrices(['BTC'], 'USD');
    await provider.getPriceHistory('jito', 2);
    expect(calls).toHaveLength(2);
    for (const c of calls) expect(c.headers['x-cg-demo-api-key'], c.url).toBe('demo-key-123');
  });

  it('should send no key header at all when no key is configured', async () => {
    const m = await load();
    const { impl, calls } = stubFetch((url) =>
      url.includes('market_chart') ? chartOk() : json(priceBody())
    );
    const provider = new m.CoinGeckoPriceProvider(impl, undefined);
    await provider.getPrices(['BTC'], 'USD');
    await provider.getPriceHistory('jito', 2);
    expect(calls).toHaveLength(2);
    for (const c of calls) expect(Object.keys(c.headers), c.url).not.toContain('x-cg-demo-api-key');
  });
});

/* ───────────────────────────── CoinGecko · price history ───────────────────────────── */

const DAY_MS = 86_400_000;
const CHART_START = Date.parse('2026-08-01T00:00:00Z');
/** A `market_chart` body of consecutive daily closes. */
const chart = (prices: number[]) => ({
  prices: prices.map((p, i) => [CHART_START + i * DAY_MS, p]),
});
const LIVE_SERIES = [70.1, 70.4, 70.9, 71.2, 70.8];

describe('CoinGecko price history — a non-market leg or an unnamed asset issues no request', () => {
  it('should issue no request and serve only the eligible fixture series when the leg is not market-priced', async () => {
    for (const lending of ['skySsr', 'aaveV3', 'compoundV3'] as const) {
      const m = await load();
      const { impl, calls } = stubFetch(() => json(chart(LIVE_SERIES)));
      const history = await new m.CoinGeckoPriceProvider(impl, undefined).getPriceHistory(
        lending,
        5
      );
      expect(calls, lending).toHaveLength(0);
      expect(history, lending).not.toBeNull();
      expect(history!.stamp, lending).toEqual(m.FIXTURE_STAMP);
      expect(history!.points, lending).toEqual(m.fixturePriceSeries(lending, 5));
    }
  });

  it('should return null for a non-market leg when no fallback is eligible', async () => {
    const m = await load();
    const { impl, calls } = stubFetch(() => json(chart(LIVE_SERIES)));
    const history = await new m.CoinGeckoPriceProvider(
      impl,
      undefined,
      undefined,
      NO_FIXTURE
    ).getPriceHistory('aaveV3', 5);
    expect(calls).toHaveLength(0);
    expect(history).toBeNull();
  });

  it('should refuse the leg without a request when the source cannot name the asset', async () => {
    /* No real market asset lacks a CoinGecko id today, so the seam is reached by
       making the per-source lookup answer `null` — the documented "this source
       does not name it" result. The leg must be refused, never guessed. */
    vi.resetModules();
    vi.doMock('../domainIdentity', async (importOriginal) => ({
      ...(await importOriginal<typeof import('../domainIdentity')>()),
      sourceAssetId: () => null,
    }));
    try {
      const { CoinGeckoPriceProvider } = await import('../providers/coingecko');
      const { FIXTURE_STAMP } = await import('../fixtures');
      for (const [fallback, disabled] of [
        ['eligible', undefined],
        ['ineligible', NO_FIXTURE],
      ] as const) {
        const { impl, calls } = stubFetch(() => json(chart(LIVE_SERIES)));
        const history = await new CoinGeckoPriceProvider(
          impl,
          undefined,
          undefined,
          disabled
        ).getPriceHistory('jito', 5);
        expect(calls, fallback).toHaveLength(0);
        if (fallback === 'eligible') {
          expect(history!.stamp).toEqual(FIXTURE_STAMP);
          expect(history!.points.map((p) => p.priceUsd)).not.toEqual(LIVE_SERIES);
        } else {
          expect(history).toBeNull();
        }
      }
      /* Source health is deliberately NOT asserted on these no-request paths:
         the adapter records a FAILURE for a request it never made (reported
         with `5.70`), and a test here would pin that defect. */
    } finally {
      vi.doUnmock('../domainIdentity');
      vi.resetModules();
    }
  });
});

describe('CoinGecko price history — HTTP, shape and bounds failures refuse the whole series', () => {
  /** Each entry: a label and the response the chart endpoint gives. */
  const FAILURES: Array<[string, () => Response]> = [
    ['HTTP 429', () => json(chart(LIVE_SERIES), 429)],
    ['HTTP 500', () => json(chart(LIVE_SERIES), 500)],
    ['no prices key', () => json({ market_caps: [] })],
    ['prices is not an array', () => json({ prices: { 0: [CHART_START, 70] } })],
    ['prices is empty', () => json({ prices: [] })],
    ['a zero point', () => json(chart([70.1, 70.4, 0, 71.2, 70.8]))],
    ['a negative point', () => json(chart([70.1, -1, 70.9, 71.2, 70.8]))],
    ['a point above the ceiling', () => json(chart([70.1, 70.4, 70.9, 2e9, 70.8]))],
    [
      'a missing day (not representable)',
      () =>
        json({
          prices: [
            [CHART_START, 70.1],
            [CHART_START + DAY_MS, 70.4],
            [CHART_START + 3 * DAY_MS, 70.9],
          ],
        }),
    ],
    [
      'a repeated day (not representable)',
      () =>
        json({
          prices: [
            [CHART_START, 70.1],
            [CHART_START + DAY_MS, 70.4],
            [CHART_START + DAY_MS + 3_600_000, 70.9],
          ],
        }),
    ],
  ];

  it('should serve only the eligible fixture series, never a live point, when the chart read fails', async () => {
    for (const [label, respond] of FAILURES) {
      const m = await load();
      const { impl, calls } = stubFetch(respond);
      const history = await new m.CoinGeckoPriceProvider(impl, undefined).getPriceHistory(
        'jito',
        5
      );
      expect(calls, label).toHaveLength(1);
      expect(history, label).not.toBeNull();
      expect(history!.stamp, label).toEqual(m.FIXTURE_STAMP);
      expect(history!.points, label).toEqual(m.fixturePriceSeries('jito', 5));
      // No live sample — good or bad — leaks into the substitute.
      const served = new Set(history!.points.map((p) => p.priceUsd));
      for (const live of [...LIVE_SERIES, 0, -1, 2e9]) {
        expect(served.has(live), `${label}: ${live}`).toBe(false);
      }
      expect(m.sourceHealth('coingecko'), label).toMatchObject({
        lastOutcome: 'FAILURE',
        consecutiveFailures: 1,
      });
    }
  });

  it('should return null when the chart read fails and no fallback is eligible', async () => {
    for (const [label, respond] of FAILURES) {
      const m = await load();
      const { impl } = stubFetch(respond);
      const history = await new m.CoinGeckoPriceProvider(
        impl,
        undefined,
        undefined,
        NO_FIXTURE
      ).getPriceHistory('jito', 5);
      expect(history, label).toBeNull();
      expect(m.sourceHealth('coingecko').lastOutcome, label).toBe('FAILURE');
    }
  });

  it('should serve the live series when every point is in bounds and the calendar is whole', async () => {
    /* The control: the same stub shape with nothing wrong is served live, so the
       refusals above are refusals and not a provider that never serves. */
    const m = await load();
    const { impl } = stubFetch(() => json(chart(LIVE_SERIES)));
    const history = await new m.CoinGeckoPriceProvider(impl, undefined).getPriceHistory('jito', 5);
    expect(history!.stamp.source).toBe('coingecko');
    expect(history!.points.map((p) => p.priceUsd)).toEqual(LIVE_SERIES);
    expect(m.sourceHealth('coingecko').lastOutcome).toBe('SUCCESS');
  });
});

/* ───────────────────────────── DeFiLlama · /pools ───────────────────────────── */

const aavePool = (over: Record<string, unknown> = {}) => ({
  pool: 'aave-arb-usdc',
  project: 'aave-v3',
  chain: 'Arbitrum',
  symbol: 'USDC',
  apy: 5.9,
  apyBase: 5.9,
  apyReward: null,
  tvlUsd: 100_000_000,
  ...over,
});

describe('DeFiLlama current rates — an HTTP or shape failure on /pools degrades every leg', () => {
  const FAILURES: Array<[string, () => Response]> = [
    ['HTTP 429', () => json({ data: [aavePool()] }, 429)],
    ['HTTP 503', () => json({ data: [aavePool()] }, 503)],
    ['no data key', () => json({ status: 'success' })],
    ['data is an object', () => json({ data: { 0: aavePool() } })],
    ['data is a string', () => json({ data: 'pools' })],
    ['a null body', () => json(null)],
  ];
  const LEGS = ['aaveV3', 'skySsr'] as const;

  it('should serve each leg its own fixture and record FETCH_FAILED per leg when /pools fails', async () => {
    for (const [label, respond] of FAILURES) {
      const m = await load();
      const { impl, calls } = stubFetch(respond);
      const apys = await new m.DefiLlamaApyProvider(impl).getCurrentApys([...LEGS]);
      expect(calls, label).toHaveLength(1);
      expect(
        apys.map((a) => a.protocolId),
        label
      ).toEqual([...LEGS]);
      for (const a of apys) {
        expect(a.stamp, label).toEqual(m.FIXTURE_STAMP);
        expect(a.apyPercent, label).toBe(m.FIXTURE_APYS[a.protocolId].apyPercent);
      }
      // The live 5.9 in the (refused) payload is never served.
      expect(
        apys.some((a) => a.apyPercent === 5.9),
        label
      ).toBe(false);
      expect(m.sourceHealth('defillama'), label).toMatchObject({
        lastOutcome: 'FAILURE',
        consecutiveFailures: 1,
      });
      expect(
        m.evidenceEvents().map((e) => [e.source, e.leg, e.outcome, e.reason]),
        label
      ).toEqual(LEGS.map((leg) => ['defillama', leg, 'SERVED_FALLBACK', 'FETCH_FAILED']));
    }
  });

  it('should omit every leg and record REFUSED when /pools fails and no fallback is eligible', async () => {
    for (const [label, respond] of FAILURES) {
      const m = await load();
      const { impl } = stubFetch(respond);
      const apys = await new m.DefiLlamaApyProvider(impl, undefined, NO_FIXTURE).getCurrentApys([
        ...LEGS,
      ]);
      expect(apys, label).toEqual([]);
      expect(m.sourceHealth('defillama').lastOutcome, label).toBe('FAILURE');
      expect(
        m.evidenceEvents().map((e) => [e.leg, e.outcome, e.reason]),
        label
      ).toEqual(LEGS.map((leg) => [leg, 'REFUSED', 'FETCH_FAILED']));
    }
  });
});

describe('DeFiLlama current rates — an out-of-bounds APY is refused, never clamped', () => {
  /* `matchPool` already drops apy <= 0, so the reachable refusal is the
     ceiling: a four-digit percent is a unit or decimal defect, not a rate. */
  const ABOVE = [1000.01, 1500, 54_000];

  it('should degrade only that leg to its own fixture, with the bounds reason, when its APY is above the ceiling', async () => {
    for (const apy of ABOVE) {
      const m = await load();
      const { impl } = stubFetch(() =>
        json({
          data: [
            aavePool({ apy, apyBase: apy }),
            {
              pool: 'sky-arb',
              project: 'sky-lending',
              chain: 'Arbitrum',
              symbol: 'SUSDS',
              apy: 4.4,
              apyBase: 4.4,
              apyReward: null,
              tvlUsd: 1e9,
            },
          ],
        })
      );
      const apys = await new m.DefiLlamaApyProvider(impl).getCurrentApys(['aaveV3', 'skySsr']);
      const aave = apys.find((a) => a.protocolId === 'aaveV3')!;
      const sky = apys.find((a) => a.protocolId === 'skySsr')!;
      // The refused leg is its own documented fixture — never the bad value, never a clamp.
      expect(aave.apyPercent, `apy=${apy}`).toBe(m.FIXTURE_APYS.aaveV3.apyPercent);
      expect(aave.stamp).toEqual(m.FIXTURE_STAMP);
      expect(apys.some((a) => a.apyPercent === apy || a.apyPercent === 1000)).toBe(false);
      // The other leg is untouched by its neighbour's defect.
      expect(sky.apyPercent).toBe(4.4);
      expect(sky.stamp.source).toBe('defillama');
      // The source answered; the VALUE was refused.
      expect(m.sourceHealth('defillama').lastOutcome).toBe('SUCCESS');
      expect(m.evidenceEvents().map((e) => [e.leg, e.outcome, e.reason])).toEqual([
        ['aaveV3', 'SERVED_FALLBACK', 'ABOVE_MAXIMUM'],
        [null, 'SERVED_PRIMARY', null],
      ]);
    }
  });

  it('should omit the out-of-bounds leg and record REFUSED when no fallback is eligible', async () => {
    const m = await load();
    const { impl } = stubFetch(() => json({ data: [aavePool({ apy: 5000, apyBase: 5000 })] }));
    const apys = await new m.DefiLlamaApyProvider(impl, undefined, NO_FIXTURE).getCurrentApys([
      'aaveV3',
    ]);
    expect(apys).toEqual([]);
    expect(m.evidenceEvents().map((e) => [e.leg, e.outcome, e.reason])).toEqual([
      ['aaveV3', 'REFUSED', 'ABOVE_MAXIMUM'],
    ]);
  });

  it('should serve an APY sitting exactly on the inclusive ceiling when the bound is respected', async () => {
    const m = await load();
    const { impl } = stubFetch(() => json({ data: [aavePool({ apy: 1000, apyBase: 1000 })] }));
    const [aave] = await new m.DefiLlamaApyProvider(impl).getCurrentApys(['aaveV3']);
    expect(aave.apyPercent).toBe(1000);
    expect(aave.stamp.source).toBe('defillama');
  });
});

describe('DeFiLlama current rates — a non-lending leg is held to its exact declared symbol', () => {
  const jitoPool = (over: Record<string, unknown> = {}) => ({
    pool: 'jito-sol',
    project: 'jito-liquid-staking',
    chain: 'Solana',
    symbol: 'JITOSOL',
    apy: 6.9,
    apyBase: 6.9,
    apyReward: null,
    tvlUsd: 1e9,
    ...over,
  });

  it('should serve a non-lending observation whose symbol equals the declared one', async () => {
    /* The `kind !== 'lending'` arm of the identity check: an exact,
       case-insensitive symbol compare, not the lending collateral rule. */
    const m = await load();
    const { impl } = stubFetch(() => json({ data: [jitoPool({ symbol: 'JitoSOL' })] }));
    const [jito] = await new m.DefiLlamaApyProvider(impl).getCurrentApys(['jito']);
    expect(jito.apyPercent).toBe(6.9);
    expect(jito.stamp.source).toBe('defillama');
    expect(jito.chain).toBe('Solana');
  });

  it('should refuse a non-lending observation whose composition cannot be determined', async () => {
    const m = await load();
    const { impl } = stubFetch(() =>
      json({ data: [jitoPool({ apyBase: undefined, apyReward: undefined })] })
    );
    const [jito] = await new m.DefiLlamaApyProvider(impl).getCurrentApys(['jito']);
    expect(jito.apyPercent).toBe(m.FIXTURE_APYS.jito.apyPercent);
    expect(jito.apyPercent).not.toBe(6.9);
    expect(jito.stamp).toEqual(m.FIXTURE_STAMP);
    expect(m.evidenceEvents().map((e) => [e.leg, e.outcome, e.reason])).toEqual([
      ['jito', 'SERVED_FALLBACK', 'COMPOSITION_UNDETERMINED'],
    ]);
  });
});

/* ───────────────────────────── DeFiLlama · /chart ───────────────────────────── */

const chartRows = (apys: number[]) =>
  apys.map((apy, i) => ({
    timestamp: new Date(CHART_START + i * DAY_MS).toISOString(),
    apy,
    apyBase: apy,
    apyReward: null,
  }));
const LIVE_APYS = [5.61, 5.72, 5.83]; // none equals a fixture APY

describe('DeFiLlama APY history — an HTTP or shape failure on /pools or /chart refuses the series', () => {
  /** Each entry: a label, the /pools response and the /chart response. */
  const FAILURES: Array<[string, () => Response, () => Response]> = [
    [
      '/pools HTTP 503',
      () => json({ data: [aavePool()] }, 503),
      () => json({ data: chartRows(LIVE_APYS) }),
    ],
    ['/pools no data', () => json({}), () => json({ data: chartRows(LIVE_APYS) })],
    [
      '/chart HTTP 429',
      () => json({ data: [aavePool()] }),
      () => json({ data: chartRows(LIVE_APYS) }, 429),
    ],
    [
      '/chart HTTP 500',
      () => json({ data: [aavePool()] }),
      () => json({ data: chartRows(LIVE_APYS) }, 500),
    ],
    ['/chart no data key', () => json({ data: [aavePool()] }), () => json({ status: 'error' })],
    [
      '/chart data is an object',
      () => json({ data: [aavePool()] }),
      () => json({ data: { 0: chartRows(LIVE_APYS)[0] } }),
    ],
    ['/chart data is a string', () => json({ data: [aavePool()] }), () => json({ data: 'chart' })],
  ];
  const route = (pools: () => Response, chartRes: () => Response) => (url: string) =>
    url.includes('/chart/') ? chartRes() : pools();

  it('should serve only the flat eligible fixture series, never a live point, when the read fails', async () => {
    for (const [label, pools, chartRes] of FAILURES) {
      const m = await load();
      const { impl } = stubFetch(route(pools, chartRes));
      const history = await new m.DefiLlamaApyProvider(impl).getApyHistory('aaveV3', 3);
      expect(history, label).not.toBeNull();
      expect(history!.stamp, label).toEqual(m.FIXTURE_STAMP);
      expect(
        history!.points.map((p) => p.date),
        label
      ).toEqual(m.fixtureDateSeries(3));
      expect(new Set(history!.points.map((p) => p.apyPercent)), label).toEqual(
        new Set([m.FIXTURE_APYS.aaveV3.apyPercent])
      );
      for (const live of LIVE_APYS) {
        expect(
          history!.points.some((p) => p.apyPercent === live),
          `${label}: ${live}`
        ).toBe(false);
      }
      expect(m.sourceHealth('defillama').lastOutcome, label).toBe('FAILURE');
    }
  });

  it('should return null when the read fails and no fallback is eligible', async () => {
    for (const [label, pools, chartRes] of FAILURES) {
      const m = await load();
      const { impl } = stubFetch(route(pools, chartRes));
      const history = await new m.DefiLlamaApyProvider(impl, undefined, NO_FIXTURE).getApyHistory(
        'aaveV3',
        3
      );
      expect(history, label).toBeNull();
      expect(m.sourceHealth('defillama').lastOutcome, label).toBe('FAILURE');
    }
  });

  it('should request /chart only for the accepted pool and serve it live when nothing is wrong', async () => {
    /* The control: with a good /pools and a good /chart the series is live, so
       the refusals above are refusals and not an adapter that never serves. */
    const m = await load();
    const { impl, calls } = stubFetch(
      route(
        () => json({ data: [aavePool()] }),
        () => json({ data: chartRows(LIVE_APYS) })
      )
    );
    const history = await new m.DefiLlamaApyProvider(impl).getApyHistory('aaveV3', 3);
    expect(calls.map((c) => c.url)).toEqual([
      'https://yields.llama.fi/pools',
      'https://yields.llama.fi/chart/aave-arb-usdc',
    ]);
    expect(history!.stamp.source).toBe('defillama');
    expect(history!.points.map((p) => p.apyPercent)).toEqual(LIVE_APYS);
    expect(m.sourceHealth('defillama').lastOutcome).toBe('SUCCESS');
  });
});
