// @vitest-environment happy-dom

/**
 * useWaitlistStats — RC-1 concurrency tests
 *
 * P11 Concurrency: the real-time signup re-fetch must not setState after unmount.
 * The optimistic update is synchronous (the listener is removed on cleanup, so it
 * never runs post-unmount and needs no guard); the fresh-data re-fetch resolves on
 * a later microtask and is guarded by an AbortController.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';

vi.mock('@/config/waitlist-stats', () => ({
  getWaitlistStatsFromEnv: () => ({ count: 100, countries: 10, foundingMemberSpotsRemaining: 50 }),
  WAITLIST_STATS_FALLBACK: { foundingMemberCap: 1200, foundingMemberSpotsRemaining: 1200 },
  WAITLIST_STATS_FALLBACK_B2B: { foundingMemberCap: 24, foundingMemberSpotsRemaining: 24 },
}));

// First effect's fetch — never interferes (we also short-circuit it via a fresh cache).
vi.mock('@/lib/utils/fetchWithRetry', () => ({
  fetchWithRetry: vi.fn(() => Promise.resolve({ ok: false } as Response)),
}));

import { useWaitlistStats } from '../useWaitlistStats';
import { applicationEventBus, ApplicationEventType } from '@/lib/events/ApplicationEventBus';

const STATS_CACHE_KEY = 'diboas-waitlist-stats';

function emitSignup(position: number) {
  return applicationEventBus.emit(ApplicationEventType.WAITLIST_SIGNUP_COMPLETED, {
    domain: 'waitlist',
    source: 'waitlist',
    timestamp: Date.now(),
    metadata: { position },
  } as never);
}

describe('useWaitlistStats — RC-1 abort guard', () => {
  let deferredResolvers: Array<(value: unknown) => void>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    // Pre-seed a fresh cache so the first effect short-circuits (no network there).
    sessionStorage.setItem(
      STATS_CACHE_KEY,
      JSON.stringify({ data: { count: 100, countries: 10 }, timestamp: Date.now() })
    );
    deferredResolvers = [];
    // Deferred fetch mock — lets each test resolve the re-fetch exactly when it wants.
    fetchMock = vi.fn(
      () => new Promise((resolve) => deferredResolvers.push(resolve as (value: unknown) => void))
    );
    globalThis.fetch = fetchMock as typeof fetch;
  });

  afterEach(() => {
    cleanup(); // unmounts any still-mounted hook → effect cleanup (unsubscribe + abort)
  });

  it('should apply the optimistic update and re-fetch with an abort signal', async () => {
    const { result } = renderHook(() => useWaitlistStats());

    await act(async () => {
      await emitSignup(222);
    });

    // Optimistic (synchronous) update applied.
    expect(result.current.stats.count).toBe(222);

    // Re-fetch wired with an abort signal.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toContain('/api/waitlist/stats?fresh=1');
    expect(init).toMatchObject({ cache: 'no-store' });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect((init.signal as AbortSignal).aborted).toBe(false);
  });

  it('should abort the in-flight re-fetch on unmount', async () => {
    const { unmount } = renderHook(() => useWaitlistStats());

    await act(async () => {
      await emitSignup(222);
    });
    const signal = (fetchMock.mock.calls[0][1] as RequestInit).signal as AbortSignal;
    expect(signal.aborted).toBe(false);

    unmount();

    expect(signal.aborted).toBe(true);
  });

  it('should apply fresh server data when the re-fetch resolves while mounted', async () => {
    const { result } = renderHook(() => useWaitlistStats());

    await act(async () => {
      await emitSignup(222);
    });
    expect(result.current.stats.count).toBe(222); // optimistic value first

    // Resolve the re-fetch while still mounted → signal not aborted → data flows.
    await act(async () => {
      deferredResolvers[0]?.({
        ok: true,
        json: async () => ({ count: 999, countries: 42, foundingMemberSpotsRemaining: 1 }),
      });
      // flush the json() promise + the second .then microtask
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Fresh server data flows through the (un-aborted) guard's true branch.
    // foundingMemberCap falls back to the env constant when absent from the
    // fresh response (the cap and remaining still share that single source).
    expect(result.current.stats).toEqual({
      count: 999,
      countries: 42,
      foundingMemberSpotsRemaining: 1,
      foundingMemberCap: 1200,
    });
  });
});
