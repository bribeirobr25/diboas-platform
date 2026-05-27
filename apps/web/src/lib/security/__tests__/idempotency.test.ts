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

// Mock DatabaseIdempotencyStore to avoid database calls in tests
vi.mock('../DatabaseIdempotencyStore', () => ({
  dbGetIdempotentResponse: vi.fn().mockResolvedValue(null),
  dbCacheIdempotentResponse: vi.fn().mockResolvedValue(undefined),
}));

import { getIdempotentResponse, cacheIdempotentResponse } from '../idempotency';

describe('idempotency', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Clear the module-level cache between tests by re-importing would be complex,
    // so we use unique keys per test to avoid cross-contamination
  });

  describe('getIdempotentResponse', () => {
    it('should return null for null key', async () => {
      expect(await getIdempotentResponse(null)).toBeNull();
    });

    it('should return null for uncached key', async () => {
      expect(await getIdempotentResponse(`uncached-key-${Math.random()}`)).toBeNull();
    });

    it('should return cached response for valid key', async () => {
      const key = `test-get-${Date.now()}`;
      await cacheIdempotentResponse(key, 200, { success: true });

      const result = await getIdempotentResponse(key);
      expect(result).not.toBeNull();
    });

    it('should return null and evict expired entries', async () => {
      const key = `test-expired-${Date.now()}`;

      // Cache a response
      const pastTime = Date.now() - 6 * 60 * 1000; // 6 minutes ago (beyond 5min TTL)
      vi.spyOn(Date, 'now').mockReturnValue(pastTime);
      await cacheIdempotentResponse(key, 200, { data: 'old' });

      // Now check with current time — should be expired
      vi.spyOn(Date, 'now').mockReturnValue(pastTime + 6 * 60 * 1000);
      expect(await getIdempotentResponse(key)).toBeNull();
    });
  });

  describe('cacheIdempotentResponse', () => {
    it('should not cache when key is null', async () => {
      await cacheIdempotentResponse(null, 200, { data: 'test' });
      // No error thrown — just a no-op
      expect(await getIdempotentResponse(null)).toBeNull();
    });

    it('should cache and retrieve response with correct status and body', async () => {
      const key = `test-cache-${Date.now()}`;
      const body = { message: 'created', id: 42 };

      await cacheIdempotentResponse(key, 201, body);
      const result = await getIdempotentResponse(key);

      expect(result).not.toBeNull();
      // NextResponse.json was called with the cached body and status
      expect(result).toEqual(
        expect.objectContaining({
          body,
          status: 201,
        })
      );
    });

    it('should overwrite existing cache entry for same key', async () => {
      const key = `test-overwrite-${Date.now()}`;

      await cacheIdempotentResponse(key, 200, { version: 1 });
      await cacheIdempotentResponse(key, 200, { version: 2 });

      const result = await getIdempotentResponse(key);
      expect(result).toEqual(
        expect.objectContaining({
          body: { version: 2 },
        })
      );
    });
  });

  describe('evictStale', () => {
    it('should evict expired entries when cache exceeds MAX_ENTRIES', async () => {
      // MAX_ENTRIES is 10_000 in the source. We need to fill past that limit
      // with expired entries so evictStale actually runs and deletes them.
      const baseTime = Date.now();

      // Insert entries in the past so they are expired (TTL is 5 min)
      vi.spyOn(Date, 'now').mockReturnValue(baseTime - 10 * 60 * 1000); // 10 min ago

      // Fill cache past MAX_ENTRIES with expired entries
      for (let i = 0; i <= 10_000; i++) {
        await cacheIdempotentResponse(`evict-stale-${i}`, 200, { i });
      }

      // Now restore time to "now" so all entries are expired
      vi.spyOn(Date, 'now').mockReturnValue(baseTime);

      // This call triggers evictStale() because cache.size > MAX_ENTRIES,
      // and all entries are expired so they get deleted
      const newKey = 'evict-stale-new';
      await cacheIdempotentResponse(newKey, 200, { fresh: true });

      // The new entry should be retrievable
      const result = await getIdempotentResponse(newKey);
      expect(result).not.toBeNull();
      expect(result).toEqual(
        expect.objectContaining({
          body: { fresh: true },
          status: 200,
        })
      );

      // An old expired entry should no longer be retrievable
      const oldResult = await getIdempotentResponse('evict-stale-0');
      expect(oldResult).toBeNull();
    });
  });
});
