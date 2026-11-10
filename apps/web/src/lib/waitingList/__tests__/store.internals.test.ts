/**
 * The store's internal helpers (5.866, twelfth audit): the blind index (`emailHash`), the row
 * reader (`rowToEntry`, `validateRow`), the optimistic update and the lazy event emitter. They
 * sit under every waitlist read and write, so COV-1 holds them at 100%.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSql = vi.fn();
vi.mock('@/lib/database/client', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => mockSql(strings.join('?'), values),
}));
const decrypt = vi.fn();
const hmacHash = vi.fn();
vi.mock('@/lib/security/encryption', () => ({
  decrypt: (v: string) => decrypt(v),
  hmacHash: (v: string) => hmacHash(v),
}));
const emit = vi.fn();
vi.mock('@/lib/events/ApplicationEventBus', () => ({
  applicationEventBus: { emit: (...a: unknown[]) => emit(...a) },
}));

import {
  emailHash,
  emitStoreEvent,
  executeOptimisticUpdate,
  rowToEntry,
  validateRow,
  validateRows,
} from '../store/internals';
import { ConcurrencyConflictError } from '@/lib/errors/domainErrors';
import { ApplicationEventType } from '@/lib/events/applicationEventTypes';
import type { sql } from '@/lib/database/client';

const ROW = {
  id: 'wl_1',
  email: 'enc:ana',
  email_hash: 'h1',
  name: 'enc:Ana',
  position: 7,
  original_position: 9,
  referral_code: 'REFABCD12',
  referred_by: 'REFZZZZ99',
  referral_count: 2,
  locale: 'pt-BR',
  source: 'landing',
  tags: ['a'],
  tier: 'founding',
  country: 'BR',
  version: 3,
  gdpr_accepted: true,
  created_at: '2026-11-01T00:00:00.000Z',
  updated_at: '2026-11-02T00:00:00.000Z',
};

beforeEach(() => {
  mockSql.mockReset();
  decrypt.mockReset();
  hmacHash.mockReset();
  emit.mockReset();
});

describe('emailHash', () => {
  it('should hash the lower-cased, trimmed address', () => {
    hmacHash.mockReturnValue('hash');
    expect(emailHash('  Ana@Example.COM ')).toBe('hash');
    expect(hmacHash).toHaveBeenCalledWith('ana@example.com');
  });
});

describe('rowToEntry', () => {
  it('should decrypt the email and name and map every column', () => {
    decrypt.mockImplementation((v: string) => v.replace('enc:', ''));
    expect(rowToEntry(ROW as never)).toEqual({
      id: 'wl_1',
      email: 'ana',
      name: 'Ana',
      position: 7,
      originalPosition: 9,
      referralCode: 'REFABCD12',
      referredBy: 'REFZZZZ99',
      referralCount: 2,
      locale: 'pt-BR',
      source: 'landing',
      tags: ['a'],
      tier: 'founding',
      country: 'BR',
      version: 3,
      createdAt: new Date('2026-11-01T00:00:00.000Z'),
      updatedAt: new Date('2026-11-02T00:00:00.000Z'),
    });
  });

  it('should keep a legacy unencrypted value and leave optional columns undefined', () => {
    decrypt.mockReturnValue(null);
    const entry = rowToEntry({
      ...ROW,
      email: 'legacy@example.com',
      name: null,
      referred_by: null,
      tags: null,
      country: null,
    } as never);
    expect(entry.email).toBe('legacy@example.com');
    expect(entry.name).toBeUndefined();
    expect(entry.referredBy).toBeUndefined();
    expect(entry.tags).toEqual([]);
    expect(entry.country).toBeUndefined();
  });

  it('should keep a legacy name when it cannot be decrypted', () => {
    decrypt.mockReturnValue(null);
    expect(rowToEntry(ROW as never).name).toBe('enc:Ana');
  });
});

describe('validateRow', () => {
  it('should accept a complete row and normalise Date timestamps to ISO strings', () => {
    const row = { ...ROW, created_at: new Date('2026-11-01T00:00:00Z') };
    expect(validateRow(row).created_at).toBe('2026-11-01T00:00:00.000Z');
    expect(validateRows([ROW, ROW])).toHaveLength(2);
  });

  it.each([
    ['a non-object', null, /expected an object/],
    ['a string field of the wrong type', { ...ROW, email: 1 }, /string for "email"/],
    ['a number field of the wrong type', { ...ROW, version: '3' }, /number for "version"/],
    ['tags that are not an array', { ...ROW, tags: 'a' }, /array for "tags"/],
    [
      'gdpr_accepted that is not a boolean',
      { ...ROW, gdpr_accepted: 'yes' },
      /boolean for "gdpr_accepted"/,
    ],
  ])('should throw for %s', (_l, row, message) => {
    expect(() => validateRow(row)).toThrow(message);
  });
});

describe('executeOptimisticUpdate', () => {
  const update = (rows: unknown[]) => Promise.resolve(rows) as unknown as ReturnType<typeof sql>;

  it('should return the updated row', async () => {
    await expect(
      executeOptimisticUpdate('h1', update([ROW]), undefined, 'x')
    ).resolves.toMatchObject({
      id: 'wl_1',
    });
  });

  it('should return undefined when nothing matched and no version was given', async () => {
    await expect(
      executeOptimisticUpdate('h1', update([]), undefined, 'x')
    ).resolves.toBeUndefined();
    expect(mockSql).not.toHaveBeenCalled();
  });

  it('should throw a concurrency conflict when the row exists at another version', async () => {
    mockSql.mockResolvedValueOnce([{ '?column?': 1 }]);
    await expect(executeOptimisticUpdate('h1', update([]), 3, 'stale')).rejects.toThrow(
      ConcurrencyConflictError
    );
    expect(mockSql.mock.calls[0][1]).toEqual(['h1']);
  });

  it('should return undefined when the row is gone, and use a given existence check', async () => {
    const exists = update([]);
    await expect(
      executeOptimisticUpdate('h1', update([]), 3, 'x', exists)
    ).resolves.toBeUndefined();
    expect(mockSql).not.toHaveBeenCalled();
  });
});

describe('emitStoreEvent', () => {
  it('should emit through the bus with the store envelope', async () => {
    emitStoreEvent(ApplicationEventType.WAITLIST_SIGNUP_COMPLETED, { count: 1 });
    await vi.waitFor(() => expect(emit).toHaveBeenCalled());
    expect(emit).toHaveBeenCalledWith(
      ApplicationEventType.WAITLIST_SIGNUP_COMPLETED,
      expect.objectContaining({ domain: 'waitlist', source: 'waitlist-store', count: 1 })
    );
  });

  it('should swallow a failing bus, never breaking the store call', async () => {
    emit.mockImplementation(() => {
      throw new Error('bus down');
    });
    expect(() => emitStoreEvent(ApplicationEventType.WAITLIST_SIGNUP_COMPLETED, {})).not.toThrow();
    await vi.waitFor(() => expect(emit).toHaveBeenCalled());
  });
});
