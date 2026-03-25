/**
 * Waitlist Store Tests
 *
 * Tests for the database-backed waitlist store with tier system.
 * Mocks the SQL client to avoid actual database calls.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the database client
const mockSql = vi.fn();
vi.mock('@/lib/database/client', () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));

// Mock the encryption module
vi.mock('@/lib/security/encryption', () => ({
  encrypt: (value: string) => `enc_${value}`,
  decrypt: (value: string) => value.startsWith('enc_') ? value.slice(4) : null,
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

import {
  addEntry,
  getByEmail,
  getById,
  getByReferralCode,
  exists,
  updateEntry,
  deleteByEmail,
  processReferral,
  clearStore,
  getAllEntries,
  getTotalCount,
  addTags,
  getCurrentPositionCounter,
  getFoundingMemberCount,
} from '../store';

// Helper to create a mock row
function mockRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'wl_123_1',
    email: 'enc_test@example.com',
    email_hash: 'hash_test@example.com',
    name: null,
    position: 1,
    original_position: 1,
    referral_code: 'REFTEST01',
    referred_by: null,
    referral_count: 0,
    locale: 'en',
    source: 'direct',
    tags: [],
    gdpr_accepted: true,
    tier: 'founding_member',
    country: null,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('Waitlist Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getByEmail', () => {
    it('should return entry when email found', async () => {
      mockSql.mockResolvedValueOnce([mockRow()]);

      const result = await getByEmail('test@example.com');

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
      expect(result?.tier).toBe('founding_member');
    });

    it('should return undefined when email not found', async () => {
      mockSql.mockResolvedValueOnce([]);

      const result = await getByEmail('nonexistent@example.com');

      expect(result).toBeUndefined();
    });

    it('should normalize email to lowercase and trim', async () => {
      mockSql.mockResolvedValueOnce([mockRow()]);

      await getByEmail('  TEST@EXAMPLE.COM  ');

      expect(mockSql).toHaveBeenCalledTimes(1);
    });
  });

  describe('getById', () => {
    it('should return entry when ID found', async () => {
      mockSql.mockResolvedValueOnce([mockRow()]);

      const result = await getById('wl_123_1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('wl_123_1');
    });

    it('should return undefined when ID not found', async () => {
      mockSql.mockResolvedValueOnce([]);

      const result = await getById('wl_nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('getByReferralCode', () => {
    it('should return entry when referral code found', async () => {
      mockSql.mockResolvedValueOnce([mockRow({ referral_code: 'REFCODE01' })]);

      const result = await getByReferralCode('REFCODE01');

      expect(result).toBeDefined();
      expect(result?.referralCode).toBe('REFCODE01');
    });

    it('should be case-insensitive', async () => {
      mockSql.mockResolvedValueOnce([mockRow({ referral_code: 'REFCODE01' })]);

      const result = await getByReferralCode('refcode01');

      expect(result).toBeDefined();
    });

    it('should return undefined when not found', async () => {
      mockSql.mockResolvedValueOnce([]);

      const result = await getByReferralCode('REFNOTFND');

      expect(result).toBeUndefined();
    });
  });

  describe('exists', () => {
    it('should return true when email exists', async () => {
      mockSql.mockResolvedValueOnce([{ '?column?': 1 }]);

      const result = await exists('exists@example.com');

      expect(result).toBe(true);
    });

    it('should return false when email does not exist', async () => {
      mockSql.mockResolvedValueOnce([]);

      const result = await exists('notexists@example.com');

      expect(result).toBe(false);
    });
  });

  describe('addEntry', () => {
    it('should create founding_member when cap not full (direct signup)', async () => {
      // Mock: duplicate check
      mockSql.mockResolvedValueOnce([]);
      // Mock: tryClaimFoundingSlot — UPDATE returns row (slot claimed)
      mockSql.mockResolvedValueOnce([{ value: 1 }]);
      // Mock: nextEntryId
      mockSql.mockResolvedValueOnce([{ value: 1 }]);
      // Mock: nextPosition
      mockSql.mockResolvedValueOnce([{ value: 1 }]);
      // Mock: INSERT
      mockSql.mockResolvedValueOnce([]);

      const entry = await addEntry({
        email: 'founder@example.com',
        name: 'Founder',
        referralCode: 'REFFNDR1',
        locale: 'en',
        source: 'landing_b2c',
        country: 'US',
      });

      expect(entry.tier).toBe('founding_member');
      expect(entry.country).toBe('US');
      expect(entry.position).toBe(1);
    });

    it('should create priority_waitlist when cap is full (direct signup)', async () => {
      // Mock: duplicate check
      mockSql.mockResolvedValueOnce([]);
      // Mock: tryClaimFoundingSlot — UPDATE returns empty (cap full)
      mockSql.mockResolvedValueOnce([]);
      // Mock: nextEntryId
      mockSql.mockResolvedValueOnce([{ value: 2 }]);
      // Mock: nextPosition
      mockSql.mockResolvedValueOnce([{ value: 1201 }]);
      // Mock: INSERT
      mockSql.mockResolvedValueOnce([]);

      const entry = await addEntry({
        email: 'latecomer@example.com',
        referralCode: 'REFLATE1',
        locale: 'en',
      });

      expect(entry.tier).toBe('priority_waitlist');
    });

    it('should create founding_member when invited by founder and cap not full', async () => {
      // Mock: duplicate check
      mockSql.mockResolvedValueOnce([]);
      // Mock: getByReferralCode (referrer lookup)
      mockSql.mockResolvedValueOnce([mockRow({
        tier: 'founding_member',
        referral_count: 2,
      })]);
      // Mock: tryClaimFoundingSlot — slot claimed
      mockSql.mockResolvedValueOnce([{ value: 50 }]);
      // Mock: nextEntryId
      mockSql.mockResolvedValueOnce([{ value: 3 }]);
      // Mock: nextPosition
      mockSql.mockResolvedValueOnce([{ value: 50 }]);
      // Mock: INSERT
      mockSql.mockResolvedValueOnce([]);

      const entry = await addEntry({
        email: 'invited@example.com',
        referralCode: 'REFINVT1',
        referredBy: 'REFTEST01',
        locale: 'en',
      });

      expect(entry.tier).toBe('founding_member');
    });

    it('should create early_member when invited by founder and cap IS full', async () => {
      // Mock: duplicate check
      mockSql.mockResolvedValueOnce([]);
      // Mock: getByReferralCode (referrer lookup)
      mockSql.mockResolvedValueOnce([mockRow({
        tier: 'founding_member',
        referral_count: 3,
      })]);
      // Mock: tryClaimFoundingSlot — cap full
      mockSql.mockResolvedValueOnce([]);
      // Mock: nextEntryId
      mockSql.mockResolvedValueOnce([{ value: 4 }]);
      // Mock: nextPosition
      mockSql.mockResolvedValueOnce([{ value: 1300 }]);
      // Mock: INSERT
      mockSql.mockResolvedValueOnce([]);

      const entry = await addEntry({
        email: 'earlybird@example.com',
        referralCode: 'REFEARLY',
        referredBy: 'REFTEST01',
        locale: 'en',
      });

      expect(entry.tier).toBe('early_member');
    });

    it('should create priority_waitlist when referrer has >= 5 invites', async () => {
      // Mock: duplicate check
      mockSql.mockResolvedValueOnce([]);
      // Mock: getByReferralCode (referrer has 5 invites used)
      mockSql.mockResolvedValueOnce([mockRow({
        tier: 'founding_member',
        referral_count: 5,
      })]);
      // No tryClaimFoundingSlot call — referrer is at limit
      // Mock: nextEntryId
      mockSql.mockResolvedValueOnce([{ value: 5 }]);
      // Mock: nextPosition
      mockSql.mockResolvedValueOnce([{ value: 1400 }]);
      // Mock: INSERT
      mockSql.mockResolvedValueOnce([]);

      const entry = await addEntry({
        email: 'overlimit@example.com',
        referralCode: 'REFOVRL1',
        referredBy: 'REFTEST01',
        locale: 'en',
      });

      expect(entry.tier).toBe('priority_waitlist');
    });

    it('should create standard when referrer is standard tier', async () => {
      // Mock: duplicate check
      mockSql.mockResolvedValueOnce([]);
      // Mock: getByReferralCode (referrer is standard)
      mockSql.mockResolvedValueOnce([mockRow({
        tier: 'standard',
        referral_count: 0,
      })]);
      // No tryClaimFoundingSlot call — standard referrer
      // Mock: nextEntryId
      mockSql.mockResolvedValueOnce([{ value: 6 }]);
      // Mock: nextPosition
      mockSql.mockResolvedValueOnce([{ value: 1500 }]);
      // Mock: INSERT
      mockSql.mockResolvedValueOnce([]);

      const entry = await addEntry({
        email: 'standardref@example.com',
        referralCode: 'REFSTD01',
        referredBy: 'REFTEST01',
        locale: 'en',
      });

      expect(entry.tier).toBe('standard');
    });

    it('should throw error for duplicate email', async () => {
      mockSql.mockResolvedValueOnce([{ '?column?': 1 }]);

      await expect(addEntry({
        email: 'duplicate@example.com',
        referralCode: 'REFDUPE01',
        locale: 'en',
      })).rejects.toThrow('Email already exists');
    });

    it('should throw "Email already exists" on concurrent INSERT race (23505)', async () => {
      // Mock: duplicate check passes
      mockSql.mockResolvedValueOnce([]);
      // Mock: tryClaimFoundingSlot
      mockSql.mockResolvedValueOnce([{ value: 10 }]);
      // Mock: nextEntryId
      mockSql.mockResolvedValueOnce([{ value: 7 }]);
      // Mock: nextPosition
      mockSql.mockResolvedValueOnce([{ value: 10 }]);
      // Mock: INSERT fails with unique violation
      const pgError = new Error('duplicate key value violates unique constraint');
      (pgError as unknown as { code: string }).code = '23505';
      mockSql.mockRejectedValueOnce(pgError);

      await expect(addEntry({
        email: 'race@example.com',
        referralCode: 'REFRACE01',
        locale: 'en',
      })).rejects.toThrow('Email already exists');
    });

    it('should re-throw non-unique-violation DB errors', async () => {
      mockSql.mockResolvedValueOnce([]);
      mockSql.mockResolvedValueOnce([{ value: 11 }]);
      mockSql.mockResolvedValueOnce([{ value: 8 }]);
      mockSql.mockResolvedValueOnce([{ value: 11 }]);
      mockSql.mockRejectedValueOnce(new Error('connection timeout'));

      await expect(addEntry({
        email: 'error@example.com',
        referralCode: 'REFERROR1',
        locale: 'en',
      })).rejects.toThrow('connection timeout');
    });

    it('should default source to "direct" if not provided', async () => {
      mockSql.mockResolvedValueOnce([]);
      mockSql.mockResolvedValueOnce([{ value: 12 }]);
      mockSql.mockResolvedValueOnce([{ value: 9 }]);
      mockSql.mockResolvedValueOnce([{ value: 12 }]);
      mockSql.mockResolvedValueOnce([]);

      const entry = await addEntry({
        email: 'default@example.com',
        referralCode: 'REFDEFLT3',
        locale: 'en',
      });

      expect(entry.source).toBe('direct');
    });
  });

  describe('updateEntry', () => {
    it('should return updated entry on success', async () => {
      mockSql.mockResolvedValueOnce([mockRow({
        name: 'enc_Updated Name',
        locale: 'pt-BR',
        updated_at: '2024-01-02T00:00:00.000Z',
      })]);

      const updated = await updateEntry('update@example.com', {
        name: 'Updated Name',
        locale: 'pt-BR',
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.locale).toBe('pt-BR');
    });

    it('should return undefined for non-existent email', async () => {
      mockSql.mockResolvedValueOnce([]);

      const updated = await updateEntry('nonexistent@example.com', { name: 'Test' });

      expect(updated).toBeUndefined();
    });
  });

  describe('processReferral', () => {
    it('should increment count for founding_member with < 5 invites', async () => {
      mockSql.mockResolvedValueOnce([mockRow({
        tier: 'founding_member',
        referral_count: 1,
      })]);

      const result = await processReferral('referrer@example.com');

      expect(result).toBeDefined();
      expect(result?.referralCount).toBe(1);
    });

    it('should increment count for early_member with < 5 invites', async () => {
      mockSql.mockResolvedValueOnce([mockRow({
        tier: 'early_member',
        referral_count: 3,
      })]);

      const result = await processReferral('earlyref@example.com');

      expect(result).toBeDefined();
      expect(result?.referralCount).toBe(3);
    });

    it('should return undefined when referrer has >= 5 invites (SQL WHERE blocks)', async () => {
      mockSql.mockResolvedValueOnce([]);

      const result = await processReferral('maxedreferrer@example.com');

      expect(result).toBeUndefined();
    });

    it('should return undefined for non-existent referrer', async () => {
      mockSql.mockResolvedValueOnce([]);

      const result = await processReferral('nonexistent@example.com');

      expect(result).toBeUndefined();
    });
  });

  describe('deleteByEmail', () => {
    it('should return true when entry deleted', async () => {
      mockSql.mockResolvedValueOnce([{ id: 'wl_123_1' }]);

      const result = await deleteByEmail('delete@example.com');

      expect(result).toBe(true);
    });

    it('should return false for non-existent email', async () => {
      mockSql.mockResolvedValueOnce([]);

      const result = await deleteByEmail('nonexistent@example.com');

      expect(result).toBe(false);
    });
  });

  describe('addTags', () => {
    it('should return updated entry with new tags', async () => {
      mockSql.mockResolvedValueOnce([mockRow({
        tags: ['initial', 'new-tag'],
      })]);

      const updated = await addTags('tags@example.com', ['new-tag']);

      expect(updated).toBeDefined();
      expect(updated?.tags).toContain('initial');
      expect(updated?.tags).toContain('new-tag');
    });

    it('should return undefined for non-existent email', async () => {
      mockSql.mockResolvedValueOnce([]);

      const result = await addTags('nonexistent@example.com', ['tag']);

      expect(result).toBeUndefined();
    });
  });

  describe('getAllEntries', () => {
    it('should return all entries', async () => {
      mockSql.mockResolvedValueOnce([
        mockRow({ email: 'enc_a@example.com' }),
        mockRow({ email: 'enc_b@example.com', position: 2 }),
      ]);

      const entries = await getAllEntries();

      expect(entries).toHaveLength(2);
    });
  });

  describe('getTotalCount', () => {
    it('should return count from database', async () => {
      mockSql.mockResolvedValueOnce([{ count: 42 }]);

      const count = await getTotalCount();

      expect(count).toBe(42);
    });
  });

  describe('getCurrentPositionCounter', () => {
    it('should return position from counters table', async () => {
      mockSql.mockResolvedValueOnce([{ value: 900 }]);

      const counter = await getCurrentPositionCounter();

      expect(counter).toBe(900);
    });

    it('should return 0 as fallback when no counter exists', async () => {
      mockSql.mockResolvedValueOnce([]);

      const counter = await getCurrentPositionCounter();

      expect(counter).toBe(0);
    });
  });

  describe('getFoundingMemberCount', () => {
    it('should return count and cap from counters', async () => {
      mockSql.mockResolvedValueOnce([
        { key: 'founding_member_count', value: 500 },
        { key: 'founding_member_cap', value: 1200 },
      ]);

      const status = await getFoundingMemberCount();

      expect(status.count).toBe(500);
      expect(status.cap).toBe(1200);
    });

    it('should default to 0/1200 when no counters exist', async () => {
      mockSql.mockResolvedValueOnce([]);

      const status = await getFoundingMemberCount();

      expect(status.count).toBe(0);
      expect(status.cap).toBe(1200);
    });
  });

  describe('clearStore', () => {
    it('should call delete and reset counters', async () => {
      mockSql.mockResolvedValueOnce([]);
      mockSql.mockResolvedValueOnce([]);
      mockSql.mockResolvedValueOnce([]);
      mockSql.mockResolvedValueOnce([]);
      mockSql.mockResolvedValueOnce([]);

      await clearStore();

      expect(mockSql).toHaveBeenCalledTimes(5);
    });
  });
});
