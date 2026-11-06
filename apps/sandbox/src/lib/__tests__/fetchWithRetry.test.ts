import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWithRetry } from '../fetchWithRetry';

/**
 * R-8 (5.801). An abort during a backoff wait rejects as `fetch` itself would, with the signal's
 * own reason, so a timeout is logged as a timeout (8th audit: it read `unexpected:AbortError`).
 */
describe('fetchWithRetry · aborts during a backoff wait', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('should reject with TimeoutError when the timeout fires while waiting to retry', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);
    const attempt = fetchWithRetry('/x', { signal: AbortSignal.timeout(50), baseDelayMs: 500 });
    await expect(attempt).rejects.toMatchObject({ name: 'TimeoutError' });
    expect(fetchMock).toHaveBeenCalledTimes(1); // no retry after the deadline
  });

  it("should reject with the caller's own abort reason", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 503 }))
    );
    const controller = new AbortController();
    const attempt = fetchWithRetry('/x', { signal: controller.signal, baseDelayMs: 500 });
    const reason = new Error('currency switched');
    setTimeout(() => controller.abort(reason), 20);
    await expect(attempt).rejects.toBe(reason);
  });
});
