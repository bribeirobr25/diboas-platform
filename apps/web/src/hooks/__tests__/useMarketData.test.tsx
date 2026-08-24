// @vitest-environment happy-dom

/**
 * useMarketData — real-hook tests.
 *
 * REWRITTEN 2026-08-24 (audit remediation, PENDING_ALL 5.134b). The previous
 * version of this file **never imported the hook**: it re-implemented the
 * promise chain inline and asserted against its own copy, so deleting the
 * hook's `mounted` guard — or the whole hook — left the suite green. That is
 * the exact failure `engineering-gates.md` § test-integrity names, and it is
 * worse than no test, because the coverage line reads as protection.
 *
 * Every assertion below now runs against the real `useMarketData` export and
 * fails if the behaviour it names is removed:
 *   P7  never swallow errors silently → the rejection is logged, not thrown
 *   P11 no work after unmount         → the `mounted` guard is load-bearing
 *   SSR-safety                        → getSync seeds the first render
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, cleanup } from '@testing-library/react';

const mockGet = vi.fn();
const mockGetSync = vi.fn();

vi.mock('@/lib/market-data', () => ({
  marketDataService: {
    get: () => mockGet(),
    getSync: () => mockGetSync(),
  },
}));

vi.mock('@/lib/monitoring/Logger', () => ({
  Logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { useMarketData } from '../useMarketData';
import { Logger } from '@/lib/monitoring/Logger';

const FALLBACK_SNAPSHOT = {
  rates: { bankRates: {}, strategyApys: { safety: 7 } },
  exchangeRates: { rates: {} },
  metadata: { stale: true, source: 'fallback', fetchedAt: '', ttl: 0 },
};

const FRESH_SNAPSHOT = {
  rates: { bankRates: {}, strategyApys: { safety: 9 } },
  exchangeRates: { rates: {} },
  metadata: { stale: false, source: 'api', fetchedAt: '2026-08-24T00:00:00Z', ttl: 300 },
};

/** A promise whose settlement this test controls, so unmount can be interleaved. */
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useMarketData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSync.mockReturnValue(FALLBACK_SNAPSHOT);
    mockGet.mockResolvedValue(FRESH_SNAPSHOT);
  });

  afterEach(() => cleanup());

  it('should return the synchronous fallback on first render (SSR-safe, no hydration mismatch)', () => {
    mockGet.mockReturnValue(new Promise(() => {})); // never settles
    const { result } = renderHook(() => useMarketData());

    expect(result.current.data).toEqual(FALLBACK_SNAPSHOT);
    expect(result.current.isStale).toBe(true);
    expect(result.current.source).toBe('fallback');
  });

  it('should replace the fallback with fresh data once the service resolves', async () => {
    const { result } = renderHook(() => useMarketData());

    await waitFor(() => expect(result.current.source).toBe('api'));
    expect(result.current.data).toEqual(FRESH_SNAPSHOT);
    expect(result.current.isStale).toBe(false);
  });

  it('should log and keep the fallback when the service rejects (never throw, never blank)', async () => {
    const serviceError = new Error('API unavailable');
    mockGet.mockRejectedValue(serviceError);

    const { result } = renderHook(() => useMarketData());

    await waitFor(() =>
      expect(Logger.error).toHaveBeenCalledWith('Failed to fetch market data', {}, serviceError)
    );
    // the user still sees numbers, flagged stale — not an empty state
    expect(result.current.data).toEqual(FALLBACK_SNAPSHOT);
    expect(result.current.source).toBe('fallback');
  });

  it('should not log after unmount when the rejection lands late (the `mounted` guard)', async () => {
    const d = deferred<never>();
    mockGet.mockReturnValue(d.promise);

    const { unmount } = renderHook(() => useMarketData());
    unmount();
    d.reject(new Error('API unavailable'));
    await d.promise.catch(() => {});
    await Promise.resolve();

    // Deleting `if (mounted)` in the .catch() makes this fail — verified by
    // sabotage on 2026-08-24.
    //
    // NOTE: there is deliberately NO companion test for the .then() branch.
    // React 18 removed the "state update on an unmounted component" warning,
    // so a late setState is silent and such a test would pass with OR without
    // the guard — a test that cannot fail is the defect this file was rewritten
    // to remove, so it is not written. The guard still belongs in both branches.
    expect(Logger.error).not.toHaveBeenCalled();
  });
});
