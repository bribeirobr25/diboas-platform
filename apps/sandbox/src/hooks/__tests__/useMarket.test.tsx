// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FIXTURE_STAMP } from '@diboas/defi';
import { expectedLogs } from '@/test/expectedLogs';
import { fetchSeries, useMarket } from '../useMarket';

/**
 * REQUIREMENTS (CLAUDE.md "hooks with async behavior" must be tested; R-2: every async
 * effect carries its cancel path): the hook publishes a successful response, reports a
 * failed one as an error (never as data), never sets state after unmount, and a currency
 * change cancels the earlier request. `fetchSeries` bounds its wait and treats an absent
 * `priceHistories` as an empty list. Before this file the hook had no test at all:
 * every consumer test mocked it out.
 */
// 2026-10-19: was `usdPriceLocal: 1, usdPriceStamp: null` — an FX rate with no provenance,
// which the completed boundary now (correctly) refuses; the route sends both or neither.
const BODY = { currency: 'USD', apys: [], gas: [], usdPriceLocal: null, usdPriceStamp: null };
let fetchMock: ReturnType<typeof vi.fn>;

// Failure paths LOG (R-14): declared and required where they happen; any other console
// output fails the test (`expectedLogs`, 2026-10-19 — replaces a file-wide mute).
const logs = expectedLogs({
  strict: true,
  warn: ['market response unusable'],
  requiredIn:
    /should report a non-ok response|missing usdPriceLocal|non-object body and an unknown currency/,
});

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

describe('useMarket', () => {
  it('should publish a successful response and report no error', async () => {
    fetchMock.mockResolvedValue(ok(BODY));
    const { result } = renderHook(() => useMarket('USD'));
    await waitFor(() => expect(result.current.market).toEqual(BODY));
    expect(result.current.marketError).toBe(false);
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/market?currency=USD');
  });

  it('should report a non-ok response as an ERROR, never as data', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503, json: async () => BODY });
    const { result } = renderHook(() => useMarket('USD'));
    await waitFor(() => expect(result.current.marketError).toBe(true));
    expect(result.current.market).toBeNull();
    expect(JSON.stringify(logs.calls('warn'))).toContain('http-503');
  });

  it('should abort its request on unmount and do nothing with a late answer', async () => {
    let resolve!: (v: unknown) => void;
    fetchMock.mockReturnValue(new Promise((r) => (resolve = r)));
    const { unmount } = renderHook(() => useMarket('USD'));
    const signal = (fetchMock.mock.calls[0]![1] as { signal: AbortSignal }).signal;
    unmount();
    expect(signal.aborted).toBe(true);
    // 2026-10-19 review: `result.current` is frozen after unmount and React 18 drops a
    // late setState silently, so asserting `market === null` could never fail. A late
    // MALFORMED answer is the observable case: without the `active` guard it would reach
    // the catch and log "market response unusable". It must log nothing.
    await act(async () => {
      resolve(ok({ currency: 'USD', apys: [null] }));
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(logs.calls('warn')).toHaveLength(0);
  });

  it('should abort the earlier request when the currency changes', async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { rerender } = renderHook(({ c }) => useMarket(c), {
      initialProps: { c: 'USD' as 'USD' | 'EUR' },
    });
    const first = (fetchMock.mock.calls[0]![1] as { signal: AbortSignal }).signal;
    rerender({ c: 'EUR' });
    expect(first.aborted).toBe(true);
    expect(fetchMock.mock.calls.at(-1)![0]).toBe('/api/market?currency=EUR');
  });
});

describe('fetchSeries', () => {
  it('should bound its wait with an AbortSignal and default an absent priceHistories to []', async () => {
    // 2026-10-19: the series now carries the stamp its type requires (it had none).
    fetchMock.mockResolvedValue(
      ok({ histories: [{ protocolId: 'aaveV3', points: [], stamp: FIXTURE_STAMP }] })
    );
    const out = await fetchSeries(30);
    expect(out.priceHistories).toEqual([]);
    expect(out.histories).toHaveLength(1);
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/market/history?days=30');
    expect((fetchMock.mock.calls[0]![1] as { signal: unknown }).signal).toBeInstanceOf(AbortSignal);
  });

  it('should throw on a non-ok response (the caller decides; nothing is invented)', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });
    await expect(fetchSeries(30)).rejects.toThrow('503');
  });
});

/**
 * `5.353` — REQUIREMENT: the response is parsed, not asserted. A shape the app cannot use
 * is an ERROR state, never data with `undefined` where a number-or-null is promised.
 */
describe('5.353 · the market boundary parses its response', () => {
  it('should treat a response missing usdPriceLocal as an error, never as data', async () => {
    const { usdPriceLocal: _omit, ...malformed } = BODY;
    fetchMock.mockResolvedValue(ok(malformed));
    const { result } = renderHook(() => useMarket('USD'));
    await waitFor(() => expect(result.current.marketError).toBe(true));
    expect(result.current.market).toBeNull();
  });

  it('should treat a non-object body and an unknown currency as errors', async () => {
    for (const bad of [null, 'oops', { ...BODY, currency: 'GBP' }, { ...BODY, apys: 'x' }]) {
      fetchMock.mockResolvedValue(ok(bad));
      const { result, unmount } = renderHook(() => useMarket('USD'));
      await waitFor(() => expect(result.current.marketError).toBe(true));
      expect(result.current.market).toBeNull();
      unmount();
    }
  });

  it('should reject a history response whose histories are not a list', async () => {
    fetchMock.mockResolvedValue(ok({ histories: null }));
    await expect(fetchSeries(30)).rejects.toThrow('malformed');
  });
});
