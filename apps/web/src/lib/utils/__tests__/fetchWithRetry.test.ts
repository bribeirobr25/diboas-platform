import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithRetry } from '../fetchWithRetry';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Speed up tests by mocking timers
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

function createResponse(status: number, body = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('fetchWithRetry', () => {
  describe('successful requests', () => {
    it('should return response on first success', async () => {
      mockFetch.mockResolvedValueOnce(createResponse(200, { ok: true }));

      const response = await fetchWithRetry('https://example.com/api');

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should pass init options to fetch', async () => {
      mockFetch.mockResolvedValueOnce(createResponse(200));

      await fetchWithRetry('https://example.com/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('client errors (4xx)', () => {
    it('should not retry on 400 Bad Request', async () => {
      mockFetch.mockResolvedValueOnce(createResponse(400));

      const response = await fetchWithRetry('https://example.com/api');

      expect(response.status).toBe(400);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 404 Not Found', async () => {
      mockFetch.mockResolvedValueOnce(createResponse(404));

      const response = await fetchWithRetry('https://example.com/api');

      expect(response.status).toBe(404);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 429 Too Many Requests', async () => {
      mockFetch.mockResolvedValueOnce(createResponse(429));

      const response = await fetchWithRetry('https://example.com/api');

      expect(response.status).toBe(429);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('server errors (5xx) with retry', () => {
    it('should retry on 500 and succeed on second attempt', async () => {
      mockFetch
        .mockResolvedValueOnce(createResponse(500))
        .mockResolvedValueOnce(createResponse(200, { ok: true }));

      const promise = fetchWithRetry('https://example.com/api');

      // Advance past first backoff (1000ms)
      await vi.advanceTimersByTimeAsync(1100);

      const response = await promise;
      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on 503 up to max retries and return last response', async () => {
      mockFetch
        .mockResolvedValueOnce(createResponse(503))
        .mockResolvedValueOnce(createResponse(503))
        .mockResolvedValueOnce(createResponse(503));

      const promise = fetchWithRetry('https://example.com/api');

      // Advance past both backoffs
      await vi.advanceTimersByTimeAsync(1100);
      await vi.advanceTimersByTimeAsync(3100);

      const response = await promise;
      expect(response.status).toBe(503);
      expect(mockFetch).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('should use exponential backoff timing', async () => {
      mockFetch
        .mockResolvedValueOnce(createResponse(500))
        .mockResolvedValueOnce(createResponse(500))
        .mockResolvedValueOnce(createResponse(200));

      const promise = fetchWithRetry('https://example.com/api');

      // After 500ms: still waiting for first backoff (1000ms)
      await vi.advanceTimersByTimeAsync(500);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // After 1000ms: first retry fires
      await vi.advanceTimersByTimeAsync(600);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // After 3000ms more: second retry fires
      await vi.advanceTimersByTimeAsync(3100);

      const response = await promise;
      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('network errors', () => {
    it('should retry on network error and succeed', async () => {
      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(createResponse(200));

      const promise = fetchWithRetry('https://example.com/api');
      await vi.advanceTimersByTimeAsync(1100);

      const response = await promise;
      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw after exhausting all retries on network error', async () => {
      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'));

      // Start the assertion before advancing timers to ensure the rejection is caught
      const assertionPromise = expect(
        fetchWithRetry('https://example.com/api'),
      ).rejects.toThrow('Failed to fetch');

      await vi.runAllTimersAsync();
      await assertionPromise;
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('abort signal', () => {
    it('should not retry when abort signal is triggered', async () => {
      const controller = new AbortController();
      mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

      controller.abort();

      await expect(
        fetchWithRetry('https://example.com/api', { signal: controller.signal }),
      ).rejects.toThrow();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('custom retry count', () => {
    it('should respect custom retries option', async () => {
      mockFetch.mockResolvedValue(createResponse(500));

      const promise = fetchWithRetry('https://example.com/api', { retries: 0 });
      const response = await promise;

      expect(response.status).toBe(500);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
