// @vitest-environment happy-dom
/**
 * PR 2 · the rate-ranges hook (P3 §2; R-1, R-2, R-8, R-13): no fetch while disabled; a valid
 * answer becomes data; a failed, malformed or stalled answer becomes 'error' (Case U) and is
 * LOGGED with a bounded reason; the 15 s timer aborts the request and is cleared on cleanup;
 * an unmount aborts and sets nothing.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectedLogs } from '@/test/expectedLogs';
import { RATE_RANGES_TIMEOUT_MS, useRateRanges } from '../useRateRanges';

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

const respond = (body: unknown, status = 200) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe('PR 2 · useRateRanges', () => {
  it('should not fetch while disabled, and report nothing', () => {
    const fetchMock = respond(PAYLOAD);
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useRateRanges(false));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it('should hand back a valid answer', async () => {
    vi.stubGlobal('fetch', respond(PAYLOAD));
    const { result } = renderHook(() => useRateRanges(true));
    expect(result.current).toBeNull(); // loading
    await waitFor(() => expect(result.current).toEqual(PAYLOAD));
  });

  it.each([
    ['a 503', respond({ error: 'rate_ranges_unavailable' }, 503), 'http-503'],
    [
      'a malformed body',
      respond({ strategies: 'nope' }),
      'malformed rate-ranges response: strategies',
    ],
  ])("should log and becomes 'error' on %s", async (_label, fetchMock, reason) => {
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useRateRanges(true));
    await waitFor(() => expect(result.current).toBe('error'));
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
            signal?.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError'))
            );
          })
      )
    );
    const { result } = renderHook(() => useRateRanges(true));
    await act(async () => {
      vi.advanceTimersByTime(RATE_RANGES_TIMEOUT_MS - 1);
    });
    expect(signal?.aborted).toBe(false);
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(signal?.aborted).toBe(true);
    expect(result.current).toBe('error');
  });

  it('should abort on unmount, clear its timer and set nothing', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        signal = init?.signal ?? undefined;
        return new Promise<Response>(() => {});
      })
    );
    const { unmount } = renderHook(() => useRateRanges(true));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
