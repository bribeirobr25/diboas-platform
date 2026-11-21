/**
 * PrivacyPersonErasureService against the shapes a driver can return (plan P14, E3′; `5.863`).
 *
 * The SQL itself is proven on Postgres in `erasure.pg.test.ts`; this pins how the service reads
 * what comes back: no row, empty strings, NULLs, and counts as strings (Neon's HTTP driver
 * returns 64-bit counts as strings).
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/database/client', () => ({ sql: vi.fn() }));

import { PrivacyPersonErasureService } from '../PrivacyPersonErasureService';
import { checkedRetentionYears } from '@/lib/retention/emailDeliveryLogs';

const service = (rows: Record<string, unknown>[]) =>
  new PrivacyPersonErasureService(vi.fn(async () => rows));

describe('PrivacyPersonErasureService · reading driver results', () => {
  it('should return no link when the link is not live', async () => {
    expect(await service([]).findLink('t')).toBeNull();
  });

  it('should treat empty or missing fields as absent when the link row has them', async () => {
    expect(await service([{ email: '', email_hash: null }]).findLink('t')).toEqual({
      encryptedEmail: null,
      emailHash: null,
    });
    expect(await service([{ email: 42, email_hash: '' }]).findLink('t')).toEqual({
      encryptedEmail: null,
      emailHash: null,
    });
  });

  it('should read counts given as strings, as Neon returns them', async () => {
    expect(
      await service([
        { consumed: '1', entry_id: 7, deliveries: '3', other_links: '2' },
      ]).consumeAndErase('t', 'h')
    ).toEqual({ consumed: true, entryId: '7', deliveryRows: 3, otherLinks: 2 });
  });

  it('should report nothing consumed when the statement returns no row or NULL counts', async () => {
    const empty = { consumed: false, entryId: null, deliveryRows: 0, otherLinks: 0 };
    expect(await service([]).consumeAndErase('t', 'h')).toEqual(empty);
    expect(
      await service([
        { consumed: null, entry_id: null, deliveries: null, other_links: null },
      ]).consumeAndErase('t', 'h')
    ).toEqual(empty);
  });

  it('should report not erased when the check returns no row or anything but two falses', async () => {
    expect(await service([]).isErased('t', 'h')).toBe(false);
    expect(await service([{ link: false, entry: true }]).isErased('t', 'h')).toBe(false);
    expect(await service([{ link: 'f', entry: 'f' }]).isErased('t', 'h')).toBe(false);
    expect(await service([{ link: false, entry: false }]).isErased('t', 'h')).toBe(true);
  });
});

describe('the 3-year retention window', () => {
  it('should refuse a window shorter than the policy when one is configured', () => {
    expect(() => checkedRetentionYears(2)).toThrow(/below 3 years/);
    expect(() => checkedRetentionYears(Number.NaN)).toThrow();
    expect(checkedRetentionYears(3)).toBe(3);
  });
});
