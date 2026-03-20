/**
 * Fetch with Retry
 *
 * Retries failed requests with exponential backoff.
 * Only retries on 5xx and network errors (never 4xx).
 * Respects AbortSignal for cancellation.
 */

const MAX_RETRIES = 2;
const BACKOFF_MS = [1000, 3000];
const DEFAULT_TIMEOUT_MS = 5000;

function isRetryable(status: number): boolean {
  return status >= 500;
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit & { retries?: number; timeoutMs?: number }
): Promise<Response> {
  const maxRetries = init?.retries ?? MAX_RETRIES;
  const timeoutMs = init?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const signal = init?.signal ?? AbortSignal.timeout(timeoutMs);
      const response = await fetch(input, { ...init, signal });

      // Don't retry client errors (4xx) — only server errors (5xx)
      if (response.ok || !isRetryable(response.status)) {
        return response;
      }

      // Server error — retry if attempts remain
      if (attempt < maxRetries) {
        await delay(BACKOFF_MS[attempt] ?? BACKOFF_MS[BACKOFF_MS.length - 1], init?.signal);
        continue;
      }

      return response;
    } catch (error) {
      // Abort signals should not be retried
      if (init?.signal?.aborted) {
        throw error;
      }

      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        await delay(BACKOFF_MS[attempt] ?? BACKOFF_MS[BACKOFF_MS.length - 1], init?.signal);
        continue;
      }
    }
  }

  throw lastError ?? new Error('fetchWithRetry: all attempts failed');
}

function delay(ms: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    }, { once: true });
  });
}
