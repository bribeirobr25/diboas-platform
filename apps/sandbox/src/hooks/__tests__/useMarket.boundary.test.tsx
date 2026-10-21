// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectedLogs } from '@/test/expectedLogs';
import { fetchSeries, useMarket } from '../useMarket';

/**
 * REQUIREMENTS (`5.353`, completed 2026-10-19 after the independent audit reproduced two
 * accepted malformed payloads): the market boundary checks every NESTED field a consumer
 * reads — known ids, sources and origins, finite numbers, calendar-valid dates, the
 * requested currency — and a response that fails any of it is an ERROR, never data. Valid
 * shapes the route really sends (date-only reference stamps, full timestamps, an absent or
 * null `derivedAt`, a null FX quote with a null stamp, empty lists, an absent
 * `priceHistories`) are accepted unchanged. Nothing is sorted, dropped or repaired.
 *
 * And (2026-10-19 review): data fetched for ONE currency is never exposed while the hook
 * is asked for ANOTHER — neither while the new request is pending nor after it fails.
 */

const DATE_STAMP = {
  source: 'fixture',
  origin: 'MODELLED',
  asOf: '2026-07-18',
  observedAt: '2026-07-18',
  fallbackUsed: true,
  fixtureVersion: '2026-07-18.1',
};
const LIVE_STAMP = {
  source: 'defillama',
  origin: 'OBSERVED',
  asOf: '2026-10-19T11:55:00.000Z',
  observedAt: null,
  derivedAt: null,
  fallbackUsed: false,
  fixtureVersion: null,
};
const APY = {
  protocolId: 'skySsr',
  apyPercent: 6.5,
  tvlUsd: null,
  chain: 'Arbitrum',
  stamp: LIVE_STAMP,
};
const GAS = { chain: 'Arbitrum', typicalFeeUsd: 0.03, stamp: DATE_STAMP };
const body = (over: Record<string, unknown> = {}, currency = 'USD') => ({
  currency,
  apys: [
    APY,
    { ...APY, protocolId: 'jito', chain: 'Solana', tvlUsd: 1_000_000, stamp: DATE_STAMP },
  ],
  gas: [GAS, { ...GAS, chain: 'Solana', typicalFeeUsd: 0.001 }],
  usdPriceLocal: 1,
  usdPriceStamp: DATE_STAMP,
  ...over,
});

let fetchMock: ReturnType<typeof vi.fn>;
// Every rejected response LOGS a bounded reason; required in each test that rejects one,
// and nothing else may reach the console (`expectedLogs`, 2026-10-19).
const logs = expectedLogs({
  strict: true,
  warn: ['market response unusable'],
  requiredIn:
    /as an ERROR, never as data|refuse a response for a currency|log a bounded reason|never expose USD data|KEEP same-currency data/,
});
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});
const ok = (b: unknown) => ({ ok: true, status: 200, json: async () => b });

async function published(b: unknown, currency: 'USD' | 'BRL' | 'EUR' = 'USD') {
  fetchMock.mockResolvedValue(ok(b));
  const { result } = renderHook(() => useMarket(currency));
  await waitFor(() =>
    expect(result.current.market !== null || result.current.marketError).toBe(true)
  );
  return result.current;
}

describe('the market response boundary (5.353)', () => {
  it('should accept the shapes the route really sends, unchanged', async () => {
    for (const valid of [
      body(),
      body({ apys: [], gas: [] }),
      body({ usdPriceLocal: null, usdPriceStamp: null }),
      // tvlUsd is display-only: ABSENT is accepted like null, so it cannot blank every rate.
      body({
        apys: [{ protocolId: 'skySsr', apyPercent: 6.5, chain: 'Arbitrum', stamp: LIVE_STAMP }],
      }),
      body({ apys: [{ ...APY, stamp: { ...LIVE_STAMP, derivedAt: undefined } }] }),
      body({ apys: [{ ...APY, stamp: { ...LIVE_STAMP, derivedAt: '2026-10-19T11:56:00.000Z' } }] }),
      body({
        apys: [
          { ...APY, stamp: { ...DATE_STAMP, origin: 'PROXY', proxyOf: 'x', methodology: 'm@1' } },
        ],
      }),
    ]) {
      const r = await published(valid);
      expect(r.marketError).toBe(false);
      // Unchanged — except that an ABSENT tvlUsd is stored as null (unknown), its type.
      const apys = (valid as { apys: Record<string, unknown>[] }).apys;
      expect(r.market).toStrictEqual({
        ...valid,
        apys: apys.map((a) => ({ ...a, tvlUsd: a.tvlUsd ?? null })),
      });
    }
  });

  const MALFORMED: [string, unknown][] = [
    [
      'a null APY entry (the audit reproduction)',
      body({ apys: [null], gas: [null], usdPriceStamp: [] }),
    ],
    ['an unknown protocol id', body({ apys: [{ ...APY, protocolId: 'notAProtocol' }] })],
    ['a non-numeric APY', body({ apys: [{ ...APY, apyPercent: '6.5' }] })],
    ['a non-numeric TVL', body({ apys: [{ ...APY, tvlUsd: 'big' }] })],
    ['an unknown chain', body({ apys: [{ ...APY, chain: 'Mars' }] })],
    ['a duplicated protocol id', body({ apys: [APY, APY] })],
    ['an unknown source', body({ apys: [{ ...APY, stamp: { ...LIVE_STAMP, source: 'oracle' } }] })],
    [
      'an unknown origin',
      body({ apys: [{ ...APY, stamp: { ...LIVE_STAMP, origin: 'GUESSED' } }] }),
    ],
    [
      'an impossible calendar date in asOf',
      body({ apys: [{ ...APY, stamp: { ...LIVE_STAMP, asOf: '2026-02-30' } }] }),
    ],
    [
      'an unparseable asOf',
      body({ apys: [{ ...APY, stamp: { ...LIVE_STAMP, asOf: 'yesterday' } }] }),
    ],
    [
      'a missing observedAt',
      body({ apys: [{ ...APY, stamp: { ...LIVE_STAMP, observedAt: undefined } }] }),
    ],
    [
      'an invalid derivedAt',
      body({ apys: [{ ...APY, stamp: { ...LIVE_STAMP, derivedAt: '2026-13-01' } }] }),
    ],
    [
      'a missing fallbackUsed',
      body({ apys: [{ ...APY, stamp: { ...LIVE_STAMP, fallbackUsed: undefined } }] }),
    ],
    [
      'a non-string fixtureVersion',
      body({ apys: [{ ...APY, stamp: { ...LIVE_STAMP, fixtureVersion: 1 } }] }),
    ],
    ['a non-numeric gas fee', body({ gas: [{ ...GAS, typicalFeeUsd: '0.03' }] })],
    ['a gas quote with no stamp', body({ gas: [{ chain: 'Arbitrum', typicalFeeUsd: 0.03 }] })],
    ['a duplicated gas chain', body({ gas: [GAS, GAS] })],
    ['an FX stamp that is a list', body({ usdPriceStamp: [] })],
    ['an FX stamp that is an empty object', body({ usdPriceStamp: {} })],
    ['an FX rate with no stamp', body({ usdPriceStamp: null })],
    ['an FX stamp with no rate', body({ usdPriceLocal: null })],
  ];
  it.each(MALFORMED)('should treat %s as an ERROR, never as data', async (_, b) => {
    const r = await published(b);
    expect(r.marketError).toBe(true);
    expect(r.market).toBeNull();
  });

  it('should refuse a response for a currency it did not ask for', async () => {
    const r = await published(body({}, 'EUR'), 'USD');
    expect(r.marketError).toBe(true);
    expect(r.market).toBeNull();
  });

  it('should log a bounded reason for a rejected response — never the payload', async () => {
    await published(body({ apys: [{ ...APY, protocolId: 'SECRET-MARKER-123' }] }));
    expect(logs.calls('warn')).toHaveLength(1);
    const logged = JSON.stringify(logs.calls('warn')[0]);
    expect(logged).toContain('apys[0].protocolId');
    expect(logged).not.toContain('SECRET-MARKER-123');
  });
});

describe('market data is bound to the currency asked for (2026-10-19 review)', () => {
  it('should never expose USD data while EUR is pending, nor after EUR fails', async () => {
    const usd = body();
    let failEur!: () => void;
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith('USD')) return ok(usd);
      await new Promise<void>((r) => (failEur = r));
      return { ok: false, status: 503, json: async () => ({}) };
    });
    const { result, rerender } = renderHook(({ c }) => useMarket(c), {
      initialProps: { c: 'USD' as 'USD' | 'EUR' },
    });
    await waitFor(() => expect(result.current.market).toEqual(usd));
    rerender({ c: 'EUR' });
    // Pending: the USD data is NOT the EUR answer.
    expect(result.current.market).toBeNull();
    expect(result.current.marketError).toBe(false);
    await act(async () => {
      failEur();
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.marketError).toBe(true);
    expect(result.current.market).toBeNull();
    // …and back to USD: its own data, and EUR's failure is not reported for it.
    rerender({ c: 'USD' });
    expect(result.current.marketError).toBe(false);
    await waitFor(() => expect(result.current.market).toEqual(usd));
  });

  it('should publish the new currency once its own answer arrives', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      ok(body({}, url.endsWith('EUR') ? 'EUR' : 'USD'))
    );
    const { result, rerender } = renderHook(({ c }) => useMarket(c), {
      initialProps: { c: 'USD' as 'USD' | 'EUR' },
    });
    await waitFor(() => expect(result.current.market?.currency).toBe('USD'));
    rerender({ c: 'EUR' });
    await waitFor(() => expect(result.current.market?.currency).toBe('EUR'));
  });

  it('should KEEP same-currency data through a refresh, and through a failed refresh', async () => {
    // Deliberate policy: a same-currency answer stays usable while a refresh is in flight
    // or after it fails, because every value's AGE is judged from its own stamp before any
    // new decision uses it (`isRefusedForCurrentFacingUse`) — keeping it hides nothing.
    const first = body();
    fetchMock
      .mockResolvedValueOnce(ok(first))
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) });
    const { result } = renderHook(() => useMarket('USD'));
    await waitFor(() => expect(result.current.market).toEqual(first));
    act(() => result.current.refreshMarket());
    await waitFor(() => expect(result.current.marketError).toBe(true));
    expect(result.current.market).toEqual(first);
  });
});

describe('the history boundary (5.353)', () => {
  const H = {
    protocolId: 'skySsr',
    points: [
      { date: '2026-10-17', apyPercent: 5 },
      { date: '2026-10-18', apyPercent: 5.1 },
    ],
    stamp: DATE_STAMP,
  };
  const P = {
    protocolId: 'jito',
    points: [
      { date: '2026-10-17', priceUsd: 200 },
      { date: '2026-10-18', priceUsd: 201 },
    ],
    stamp: LIVE_STAMP,
  };
  const serve = (b: unknown) => fetchMock.mockResolvedValue(ok(b));

  it('should accept valid series, an empty series, and an absent priceHistories (documented compatibility)', async () => {
    serve({
      days: 30,
      histories: [H, { ...H, protocolId: 'aaveV3', points: [] }],
      priceHistories: [P],
    });
    expect(await fetchSeries(30)).toEqual({
      histories: [H, { ...H, protocolId: 'aaveV3', points: [] }],
      priceHistories: [P],
    });
    serve({ histories: [H] });
    expect(await fetchSeries(30)).toEqual({ histories: [H], priceHistories: [] });
  });

  const BAD: [string, unknown][] = [
    ['the audit reproduction', { histories: [null], priceHistories: [{}] }],
    [
      'an impossible point date',
      { histories: [{ ...H, points: [{ date: '2026-02-30', apyPercent: 5 }] }] },
    ],
    [
      'a timestamp where a day is required',
      { histories: [{ ...H, points: [{ date: '2026-10-18T00:00:00Z', apyPercent: 5 }] }] },
    ],
    ['points out of order', { histories: [{ ...H, points: [...H.points].reverse() }] }],
    ['a repeated day', { histories: [{ ...H, points: [H.points[0], H.points[0]] }] }],
    [
      'a non-numeric APY point',
      { histories: [{ ...H, points: [{ date: '2026-10-18', apyPercent: '5' }] }] },
    ],
    ['an unknown protocol', { histories: [{ ...H, protocolId: 'x' }] }],
    ['a malformed stamp', { histories: [{ ...H, stamp: { ...DATE_STAMP, asOf: '2026-02-30' } }] }],
    [
      'a price point with no price',
      { histories: [H], priceHistories: [{ ...P, points: [{ date: '2026-10-18' }] }] },
    ],
    ['priceHistories that is not a list', { histories: [H], priceHistories: {} }],
  ];
  it.each(BAD)('should reject %s at the boundary', async (_, b) => {
    serve(b);
    await expect(fetchSeries(30)).rejects.toThrow(/malformed history response/);
  });

  it('should name the failing path in its error, never a value from the payload', async () => {
    serve({ histories: [{ ...H, protocolId: 'SECRET-MARKER-456' }] });
    const error = await fetchSeries(30).catch((e: Error) => e);
    expect(String(error)).toContain('histories[0].protocolId');
    expect(String(error)).not.toContain('SECRET-MARKER-456');
  });
});
