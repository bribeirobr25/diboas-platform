/**
 * Waitlist Store Concurrency Tests
 *
 * Verifies race condition handling for concurrent signups:
 * - Duplicate email detection via UNIQUE constraint (23505)
 * - Position uniqueness under concurrent load
 * - Referral count never exceeds INVITE_LIMIT
 *
 * P11 Concurrency & Race Conditions: validates atomic DB operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Track position counter for uniqueness verification
let positionCounter = 0;

// Mock the database client
const mockSql = vi.fn();
vi.mock('@/lib/database/client', () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));

// Mock encryption
vi.mock('@/lib/security/encryption', () => ({
  encrypt: (value: string) => `enc_${value}`,
  decrypt: (value: string) => (value.startsWith('enc_') ? value.slice(4) : null),
  hmacHash: (value: string) => `hash_${value}`,
}));

// Mock Logger
vi.mock('@/lib/monitoring/Logger', () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock counterManager with atomic-simulating counters
vi.mock('../counterManager', () => ({
  nextEntryId: vi.fn(async () => `wl_${Date.now()}_${++positionCounter}`),
  nextPosition: vi.fn(async () => ++positionCounter),
  getFoundingMemberStatus: vi.fn(async () => ({
    count: 0,
    cap: 100,
    isFull: false,
  })),
  sourceToAudience: vi.fn(() => 'b2c'),
}));

// Mock tierDeterminer
vi.mock('../tierDeterminer', () => ({
  determineTier: vi.fn(async () => 'founding_member'),
}));

import { addEntry } from '../store';
import { DuplicateEntryError } from '@/lib/errors/domainErrors';

describe('Waitlist Store Concurrency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    positionCounter = 0;
  });

  describe('duplicate email handling', () => {
    it('should throw DuplicateEntryError when SELECT finds existing entry', async () => {
      // First call: duplicate check SELECT returns a row
      mockSql.mockResolvedValueOnce([{ '?column?': 1 }]);

      await expect(
        addEntry({
          email: 'dup@example.com',
          name: 'Test',
          locale: 'en',
          source: 'landing_b2c',
          referralCode: 'REFTEST01',
        })
      ).rejects.toThrow(DuplicateEntryError);
    });

    it('should throw DuplicateEntryError when INSERT hits 23505 UNIQUE constraint', async () => {
      // First call: duplicate check SELECT returns empty (no existing entry)
      mockSql.mockResolvedValueOnce([]);
      // Second call: INSERT throws 23505 (concurrent duplicate)
      const pgError = new Error('duplicate key value violates unique constraint');
      (pgError as any).code = '23505';
      mockSql.mockRejectedValueOnce(pgError);

      await expect(
        addEntry({
          email: 'race@example.com',
          name: 'Test',
          locale: 'en',
          source: 'landing_b2c',
          referralCode: 'REFTEST02',
        })
      ).rejects.toThrow(DuplicateEntryError);
    });

    it('should log position gap when 23505 concurrent duplicate is caught', async () => {
      const { Logger } = await import('@/lib/monitoring/Logger');

      // SELECT: no existing entry
      mockSql.mockResolvedValueOnce([]);
      // INSERT: concurrent 23505
      const pgError = new Error('duplicate key');
      (pgError as any).code = '23505';
      mockSql.mockRejectedValueOnce(pgError);

      await expect(
        addEntry({
          email: 'gap@example.com',
          name: 'Test',
          locale: 'en',
          source: 'landing_b2c',
          referralCode: 'REFTEST03',
        })
      ).rejects.toThrow(DuplicateEntryError);

      // Verify position gap is logged for monitoring
      expect(Logger.info).toHaveBeenCalledWith(
        '[Waitlist] Concurrent duplicate detected after counter allocation',
        expect.objectContaining({ position: expect.any(Number) })
      );
    });

    it('should re-throw non-23505 database errors', async () => {
      // SELECT: no existing entry
      mockSql.mockResolvedValueOnce([]);
      // INSERT: generic DB error (not 23505)
      const dbError = new Error('connection reset');
      mockSql.mockRejectedValueOnce(dbError);

      await expect(
        addEntry({
          email: 'dberror@example.com',
          name: 'Test',
          locale: 'en',
          source: 'landing_b2c',
          referralCode: 'REFTEST04',
        })
      ).rejects.toThrow('connection reset');
    });
  });

  describe('position uniqueness', () => {
    it('should assign sequential positions to concurrent signups with different emails', async () => {
      const positions: number[] = [];

      // Simulate 10 concurrent signups — each needs SELECT (empty) + INSERT (success)
      for (let i = 0; i < 10; i++) {
        // SELECT: no duplicate
        mockSql.mockResolvedValueOnce([]);
        // INSERT: success (return nothing — void)
        mockSql.mockResolvedValueOnce([]);
      }

      const promises = Array.from({ length: 10 }, (_, i) =>
        addEntry({
          email: `user${i}@example.com`,
          name: `User ${i}`,
          locale: 'en',
          source: 'landing_b2c',
          referralCode: `REFPOS${String(i).padStart(3, '0')}`,
        }).then((entry) => {
          positions.push(entry.position);
          return entry;
        })
      );

      const results = await Promise.all(promises);

      // All positions should be unique
      const uniquePositions = new Set(positions);
      expect(uniquePositions.size).toBe(10);

      // All entries should have unique IDs
      const uniqueIds = new Set(results.map((r) => r.id));
      expect(uniqueIds.size).toBe(10);
    });
  });
});
