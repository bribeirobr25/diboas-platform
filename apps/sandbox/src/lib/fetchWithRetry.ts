/**
 * The Practice app's `fetchWithRetry` (robustness checklist R-8; founder 2026-11-06: built here
 * rather than waived). The marketing site has its own; the two apps share no source.
 *
 * Retries a transient failure — a network error or a 5xx answer — with exponential backoff.
 * Everything else is an answer, returned at once: a 2xx/3xx/4xx is never retried (a 429 is the
 * server refusing on purpose; asking again would only spend the quota faster). The caller's
 * `signal` bounds the whole attempt, backoff waits included, so a caller's timeout still holds.
 */
export interface RetryOptions {
  /** Retries after the first attempt (R-8: 2). */
  retries?: number;
  /** The first backoff; doubled each retry. */
  baseDelayMs?: number;
  signal?: AbortSignal;
}

export const FETCH_RETRIES = 2;
const FETCH_BASE_DELAY_MS = 500;

/** The signal's own reason (a `TimeoutError` for `AbortSignal.timeout`), as `fetch` rejects with. */
function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('The operation was aborted.', 'AbortError');
}

/** A wait the caller's signal can cut short — rejecting as `fetch` would (8th audit). */
function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortReason(signal));
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(abortReason(signal!));
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function fetchWithRetry(url: string, options: RetryOptions = {}): Promise<Response> {
  const retries = options.retries ?? FETCH_RETRIES;
  const baseDelayMs = options.baseDelayMs ?? FETCH_BASE_DELAY_MS;
  const { signal } = options;
  for (let attempt = 0; ; attempt += 1) {
    try {
      const res = await fetch(url, { signal });
      if (res.status < 500 || attempt >= retries) return res;
    } catch (error) {
      // An abort is the caller's decision, never a transient failure.
      if (signal?.aborted || attempt >= retries) throw error;
    }
    await wait(baseDelayMs * 2 ** attempt, signal);
  }
}
