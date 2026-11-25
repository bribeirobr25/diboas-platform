/**
 * CONSENT-EVIDENCE-1 (removal half) · removing a signup's note against a real Postgres (PGlite)
 * (market clean-up W-D1, spec §3.6). One statement removes exactly the note's tags (campaign
 * values, the button label, the evidence), keyed by the email hash; a repeat changes nothing;
 * the opt-out and every other tag and person are untouched; no tag value reaches the audit log.
 *
 * Scope limit: PGlite, not Neon's HTTP driver; the statement is standard SQL.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDatabase, TEST_DATABASE_BOOT_MS, type TestDatabase } from '@/test/pglite';

const logAuditEvent = vi.fn();
vi.mock('@/lib/audit/AuditService', () => ({
  logAuditEvent: (...args: unknown[]) => logAuditEvent(...args),
}));
const emitStoreEvent = vi.fn();
vi.mock('../internals', () => ({
  emitStoreEvent: (...args: unknown[]) => emitStoreEvent(...args),
}));

import { removeSignupNote } from '../noteRemoval';

let t: TestDatabase;
const ANA = 'hash-ana';
const BOB = 'hash-bob';
const tagsOf = async (hash: string) =>
  (
    await t.exec('SELECT tags, email_opted_out FROM waitlist_entries WHERE email_hash = $1', [hash])
  )[0];

beforeAll(async () => {
  t = await createTestDatabase();
}, TEST_DATABASE_BOOT_MS);
afterAll(async () => t.close());
beforeEach(async () => {
  await t.reset();
  logAuditEvent.mockReset();
  emitStoreEvent.mockReset();
  await t.exec(
    `INSERT INTO waitlist_entries (id, email_hash, tags, email_opted_out) VALUES
      ('wl_ana', $1, ARRAY['utm_source:ig','cta_source:market','consent:note:v1:2026-11-25','other:keep'], true),
      ('wl_bob', $2, ARRAY['utm_source:mail','consent:note-campaign:v1:2026-11-25'], false)`,
    [ANA, BOB]
  );
});

describe('removeSignupNote', () => {
  it("should remove exactly the note's tags and report it", async () => {
    expect(await removeSignupNote(ANA, t.query)).toEqual({ removed: true });
    expect(await tagsOf(ANA)).toEqual({ tags: ['other:keep'], email_opted_out: true });
    expect(await tagsOf(BOB)).toEqual({
      tags: ['utm_source:mail', 'consent:note-campaign:v1:2026-11-25'],
      email_opted_out: false,
    });
  });

  it('should be a no-op the second time, with nothing audited', async () => {
    await removeSignupNote(ANA, t.query);
    logAuditEvent.mockReset();
    emitStoreEvent.mockReset();
    expect(await removeSignupNote(ANA, t.query)).toEqual({ removed: false });
    expect(await tagsOf(ANA)).toEqual({ tags: ['other:keep'], email_opted_out: true });
    expect(logAuditEvent).not.toHaveBeenCalled();
    expect(emitStoreEvent).not.toHaveBeenCalled();
  });

  it('should report nothing removed for an unknown address', async () => {
    expect(await removeSignupNote('hash-nobody', t.query)).toEqual({ removed: false });
  });

  it('should treat a prefix as text, not a pattern (no LIKE wildcard)', async () => {
    await t.exec(`UPDATE waitlist_entries SET tags = ARRAY['utmXsource:x'] WHERE email_hash = $1`, [
      BOB,
    ]);
    expect(await removeSignupNote(BOB, t.query)).toEqual({ removed: false });
    expect((await tagsOf(BOB)).tags).toEqual(['utmXsource:x']);
  });

  it('should audit the removal with no tag value, and emit the store event', async () => {
    await removeSignupNote(ANA, t.query);
    expect(logAuditEvent).toHaveBeenCalledWith({
      eventType: 'waitlist.note.removed',
      entityType: 'waitlist_entry',
      entityId: 'wl_ana',
      details: {},
    });
    expect(JSON.stringify(logAuditEvent.mock.calls)).not.toMatch(/ig|market|consent:/);
    expect(emitStoreEvent).toHaveBeenCalledWith('waitlist:noteRemoved', {
      metadata: { entryId: 'wl_ana' },
    });
  });
});
