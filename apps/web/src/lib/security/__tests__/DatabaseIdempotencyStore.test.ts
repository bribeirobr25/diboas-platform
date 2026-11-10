/**
 * Database-backed idempotency store tests (5.70 — security utilities at 100%).
 *
 * The Neon tagged-template `sql` is mocked at the module boundary the store
 * already imports (`@/lib/database/client`); no database is ever touched.
 * Every failure path is asserted to fail SAFE: a read error degrades to
 * "no cached response" (null), a write or cleanup error never throws into
 * the request, and each is logged with the error's message.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));

vi.mock('@/lib/database/client', () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));

import {
  dbGetIdempotentResponse,
  dbCacheIdempotentResponse,
  dbCleanupIdempotencyCache,
} from '../DatabaseIdempotencyStore';
import { Logger } from '@/lib/monitoring/Logger';

/** The SQL text of the n-th call (template strings joined by `$`). */
function sqlText(callIndex = 0): string {
  const strings = mockSql.mock.calls[callIndex][0] as TemplateStringsArray;
  return strings.join('$').replace(/\s+/g, ' ');
}

/** The interpolated values of the n-th call. */
function sqlValues(callIndex = 0): unknown[] {
  return mockSql.mock.calls[callIndex].slice(1);
}

describe('DatabaseIdempotencyStore', () => {
  beforeEach(() => {
    mockSql.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('dbGetIdempotentResponse', () => {
    it('should return the stored response when an unexpired row exists', async () => {
      mockSql.mockResolvedValue([
        {
          key: 'k-1',
          response: { status: 201, body: { id: 7 } },
          created_at: '2026-11-10T00:00:00Z',
          expires_at: '2026-11-10T00:05:00Z',
        },
      ]);

      const result = await dbGetIdempotentResponse('k-1');

      expect(result).toEqual({ status: 201, body: { id: 7 } });
      // The lookup is keyed by the idempotency key and filters expired rows.
      expect(sqlValues()).toEqual(['k-1']);
      expect(sqlText()).toContain('WHERE key = $ AND expires_at > NOW()');
    });

    it('should return null when no row matches the key', async () => {
      mockSql.mockResolvedValue([]);

      expect(await dbGetIdempotentResponse('missing')).toBeNull();
      expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should fail safe to null and log the message when the query rejects with an Error', async () => {
      mockSql.mockRejectedValue(new Error('connection reset'));

      expect(await dbGetIdempotentResponse('k-err')).toBeNull();
      expect(Logger.error).toHaveBeenCalledWith('[DatabaseIdempotencyStore] Failed to read', {
        error: 'connection reset',
      });
    });

    it('should fail safe to null and log the stringified value when the query rejects with a non-Error', async () => {
      mockSql.mockRejectedValue('raw failure');

      expect(await dbGetIdempotentResponse('k-str')).toBeNull();
      expect(Logger.error).toHaveBeenCalledWith('[DatabaseIdempotencyStore] Failed to read', {
        error: 'raw failure',
      });
    });
  });

  describe('dbCacheIdempotentResponse', () => {
    it('should upsert the serialized response with the default 5-minute expiry when no TTL is given', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-10T12:00:00.000Z'));
      mockSql.mockResolvedValue([]);

      await dbCacheIdempotentResponse('k-2', 200, { ok: true });

      expect(mockSql).toHaveBeenCalledTimes(1);
      expect(sqlText()).toContain('INSERT INTO idempotency_cache (key, response, expires_at)');
      expect(sqlText()).toContain('ON CONFLICT (key) DO UPDATE');
      const response = JSON.stringify({ status: 200, body: { ok: true } });
      const expiresAt = '2026-11-10T12:05:00.000Z';
      expect(sqlValues()).toEqual(['k-2', response, expiresAt, response, expiresAt]);
    });

    it('should use the given TTL for the expiry when a TTL is passed', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-10T12:00:00.000Z'));
      mockSql.mockResolvedValue([]);

      await dbCacheIdempotentResponse('k-3', 409, null, 1_000);

      expect(sqlValues()[2]).toBe('2026-11-10T12:00:01.000Z');
    });

    it('should not throw and should log the message when the write rejects with an Error', async () => {
      mockSql.mockRejectedValue(new Error('disk full'));

      await expect(dbCacheIdempotentResponse('k-4', 200, {})).resolves.toBeUndefined();
      expect(Logger.error).toHaveBeenCalledWith('[DatabaseIdempotencyStore] Failed to write', {
        error: 'disk full',
      });
    });

    it('should not throw and should log the stringified value when the write rejects with a non-Error', async () => {
      mockSql.mockRejectedValue(42);

      await expect(dbCacheIdempotentResponse('k-5', 200, {})).resolves.toBeUndefined();
      expect(Logger.error).toHaveBeenCalledWith('[DatabaseIdempotencyStore] Failed to write', {
        error: '42',
      });
    });
  });

  describe('dbCleanupIdempotencyCache', () => {
    it('should delete only expired rows when cleanup runs', async () => {
      mockSql.mockResolvedValue([]);

      await dbCleanupIdempotencyCache();

      expect(mockSql).toHaveBeenCalledTimes(1);
      expect(sqlText()).toBe('DELETE FROM idempotency_cache WHERE expires_at <= NOW()');
      expect(sqlValues()).toEqual([]);
    });

    it('should not throw and should log the message when cleanup rejects with an Error', async () => {
      mockSql.mockRejectedValue(new Error('timeout'));

      await expect(dbCleanupIdempotencyCache()).resolves.toBeUndefined();
      expect(Logger.error).toHaveBeenCalledWith('[DatabaseIdempotencyStore] Cleanup failed', {
        error: 'timeout',
      });
    });

    it('should not throw and should log the stringified value when cleanup rejects with a non-Error', async () => {
      mockSql.mockRejectedValue(undefined);

      await expect(dbCleanupIdempotencyCache()).resolves.toBeUndefined();
      expect(Logger.error).toHaveBeenCalledWith('[DatabaseIdempotencyStore] Cleanup failed', {
        error: 'undefined',
      });
    });
  });
});
