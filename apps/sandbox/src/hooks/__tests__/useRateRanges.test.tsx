// @vitest-environment happy-dom
/**
 * PR 2 · the rate-ranges hook (P3 §2; R-1, R-2, R-8, R-13; 7th audit): it calls THE route; no
 * fetch while disabled; transient failures are retried (2, with backoff), refusals are not; a
 * failed, malformed or stalled answer becomes 'error' (Case U) and is LOGGED with a bounded
 * reason; the 15 s timer aborts and is cleared on settle and in cleanup; an unmount aborts and
 * stays silent even if the answer lands after it; re-enabling shows "loading", never the old answer.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FETCH_RETRIES } from '@/lib/fetchWithRetry';
import { expectedLogs } from '@/test/expectedLogs';
import { RATE_RANGES_TIMEOUT_MS, RATE_RANGES_URL, useRateRanges } from '../useRateRanges';

const PAYLOAD = {
  strategies: [{ strategyId: 'safeHarbor', available: false, reason: 'STALE' }],
  aggregate: { available: false },
};

const logs = expectedLogs({
  warn: ['rate ranges unavailable'],
  requiredIn: /becomes 'error'|at the timeout/,
  strict: true,
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe('PR 2 · useRateRanges', () => {
  it('should pin the 15 s limit, the 2 retries and the route it reads', () => {
    expect(RATE_RANGES_TIMEOUT_MS).toBe(15_000);
    expect(FETCH_RETRIES).toBe(2);
    expect(RATE_RANGES_URL).toBe('/api/market/rate-ranges');
  });

  it('should not fetch while disabled, and report nothing', () => {
    const fetchMock = vi.fn(async () => reply(PAYLOAD));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useRateRanges(false));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it('should call the rate-ranges route, hand back a valid answer and clear its timer', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchMock = vi.fn(async (_url: string) => reply(PAYLOAD));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useRateRanges(true));
    expect(result.current).toBeNull(); // loading
    await waitFor(() => expect(result.current).toEqual(PAYLOAD));
    expect(fetchMock.mock.calls[0][0]).toBe('/api/market/rate-ranges');
    expect(vi.getTimerCount()).toBe(0); // cleared on settle
  });

  it("should retry a 503 twice with backoff, then log and becomes 'error'", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => reply({ error: 'rate_ranges_unavailable' }, 503));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useRateRanges(true));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1 + FETCH_RETRIES);
    expect(result.current).toBe('error');
    expect(JSON.stringify(logs.calls('warn'))).toContain('http-503');
  });

  it('should recover from one network error on retry', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn<(url: string) => Promise<Response>>()
      .mockRejectedValueOnce(new TypeError('network down'))
      .mockResolvedValue(reply(PAYLOAD));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useRateRanges(true));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual(PAYLOAD);
  });

  it.each([
    ['a 429 (a refusal is never retried)', () => reply({ error: 'rate_limited' }, 429), 'http-429'],
    [
      'a malformed body (an answer, not a transient failure)',
      () => reply({ strategies: 'nope' }),
      'malformed rate-ranges response: strategies',
    ],
  ])("should log and becomes 'error' on %s, without retrying", async (_label, response, reason) => {
    const fetchMock = vi.fn(async () => response());
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useRateRanges(true));
    await waitFor(() => expect(result.current).toBe('error'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(logs.calls('warn'))).toContain(reason);
  });

  it('should abort a stalled request at the timeout and end in error', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            signal = init?.signal ?? undefined;
            // As `fetch` does: it rejects with the signal's own reason.
            signal?.addEventListener('abort', () => reject(signal?.reason));
          })
      )
    );
    const { result } = renderHook(() => useRateRanges(true));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(RATE_RANGES_TIMEOUT_MS - 1);
    });
    expect(signal?.aborted).toBe(false);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(signal?.aborted).toBe(true);
    expect(result.current).toBe('error');
    // Logged as a timeout, never as an unexpected abort (9th audit).
    expect(JSON.stringify(logs.calls('warn'))).toContain('"reason":"timeout"');
  });

  it('should abort on unmount, clear its timer, and stay silent when the answer lands after', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    let settle: (r: Response) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        signal = init?.signal ?? undefined;
        return new Promise<Response>((resolve) => (settle = resolve));
      })
    );
    const { unmount } = renderHook(() => useRateRanges(true));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    // The answer arriving after the screen left changes nothing and logs nothing (strict logs).
    await act(async () => {
      settle(reply({ strategies: 'nope' }));
      await vi.advanceTimersByTimeAsync(10);
    });
  });

  it('should show "loading" — never the previous answer — when re-enabled', async () => {
    let call = 0;
    let release: () => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        call += 1;
        if (call > 1) await new Promise<void>((r) => (release = r));
        return reply(PAYLOAD);
      })
    );
    const { result, rerender } = renderHook(({ on }) => useRateRanges(on), {
      initialProps: { on: true },
    });
    await waitFor(() => expect(result.current).toEqual(PAYLOAD));
    rerender({ on: false });
    expect(result.current).toBeNull();
    rerender({ on: true });
    expect(result.current).toBeNull(); // the old answer is not shown for the new request
    await act(async () => release());
    await waitFor(() => expect(result.current).toEqual(PAYLOAD));
  });
});
