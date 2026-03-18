import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/server before imports
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body: unknown, opts?: { status: number }) => ({
      body,
      status: opts?.status ?? 200,
    })),
  },
}));

import { getIdempotentResponse, cacheIdempotentResponse } from '../idempotency';

describe('idempotency', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Clear the module-level cache between tests by re-importing would be complex,
    // so we use unique keys per test to avoid cross-contamination
  });

  describe('getIdempotentResponse', () => {
    it('should return null for null key', () => {
      expect(getIdempotentResponse(null)).toBeNull();
    });

    it('should return null for uncached key', () => {
      expect(getIdempotentResponse('uncached-key-' + Math.random())).toBeNull();
    });

    it('should return cached response for valid key', () => {
      const key = 'test-get-' + Date.now();
      cacheIdempotentResponse(key, 200, { success: true });

      const result = getIdempotentResponse(key);
      expect(result).not.toBeNull();
    });

    it('should return null and evict expired entries', () => {
      const key = 'test-expired-' + Date.now();

      // Cache a response
      const pastTime = Date.now() - 6 * 60 * 1000; // 6 minutes ago (beyond 5min TTL)
      vi.spyOn(Date, 'now').mockReturnValue(pastTime);
      cacheIdempotentResponse(key, 200, { data: 'old' });

      // Now check with current time — should be expired
      vi.spyOn(Date, 'now').mockReturnValue(pastTime + 6 * 60 * 1000);
      expect(getIdempotentResponse(key)).toBeNull();
    });
  });

  describe('cacheIdempotentResponse', () => {
    it('should not cache when key is null', () => {
      cacheIdempotentResponse(null, 200, { data: 'test' });
      // No error thrown — just a no-op
      expect(getIdempotentResponse(null)).toBeNull();
    });

    it('should cache and retrieve response with correct status and body', () => {
      const key = 'test-cache-' + Date.now();
      const body = { message: 'created', id: 42 };

      cacheIdempotentResponse(key, 201, body);
      const result = getIdempotentResponse(key);

      expect(result).not.toBeNull();
      // NextResponse.json was called with the cached body and status
      expect(result).toEqual(
        expect.objectContaining({
          body,
          status: 201,
        })
      );
    });

    it('should overwrite existing cache entry for same key', () => {
      const key = 'test-overwrite-' + Date.now();

      cacheIdempotentResponse(key, 200, { version: 1 });
      cacheIdempotentResponse(key, 200, { version: 2 });

      const result = getIdempotentResponse(key);
      expect(result).toEqual(
        expect.objectContaining({
          body: { version: 2 },
        })
      );
    });
  });

  describe('evictStale', () => {
    it('should evict expired entries when cache exceeds MAX_ENTRIES', () => {
      // MAX_ENTRIES is 10_000 in the source. We need to fill past that limit
      // with expired entries so evictStale actually runs and deletes them.
      const baseTime = Date.now();

      // Insert entries in the past so they are expired (TTL is 5 min)
      vi.spyOn(Date, 'now').mockReturnValue(baseTime - 10 * 60 * 1000); // 10 min ago

      // Fill cache past MAX_ENTRIES with expired entries
      for (let i = 0; i <= 10_000; i++) {
        cacheIdempotentResponse(`evict-stale-${i}`, 200, { i });
      }

      // Now restore time to "now" so all entries are expired
      vi.spyOn(Date, 'now').mockReturnValue(baseTime);

      // This call triggers evictStale() because cache.size > MAX_ENTRIES,
      // and all entries are expired so they get deleted
      const newKey = 'evict-stale-new';
      cacheIdempotentResponse(newKey, 200, { fresh: true });

      // The new entry should be retrievable
      const result = getIdempotentResponse(newKey);
      expect(result).not.toBeNull();
      expect(result).toEqual(
        expect.objectContaining({
          body: { fresh: true },
          status: 200,
        })
      );

      // An old expired entry should no longer be retrievable
      const oldResult = getIdempotentResponse('evict-stale-0');
      expect(oldResult).toBeNull();
    });
  });
});
