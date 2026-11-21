/**
 * ⛑ RETENTION-1 guard 4 · a person's erasure against a real Postgres (plan P14, E3′; `5.863`).
 *
 * The one statement consumes the clicked link and erases the person's other links, delivery rows
 * and waitlist entry, keyed on the link's stored hash. Atomicity is proven with a test-only
 * `BEFORE DELETE` trigger that makes the entry's deletion fail: the statement under test is
 * never edited, and nothing (not even the clicked link) may change.
 *
 * Scope limit: PGlite, not Neon's HTTP driver; the statement is standard SQL.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrivacyPersonErasureService } from '../PrivacyPersonErasureService';
import { createTestDatabase, TEST_DATABASE_BOOT_MS, type TestDatabase } from '@/test/pglite';

let t: TestDatabase;
let erasure: PrivacyPersonErasureService;

const ANA = 'hash-ana';
const BOB = 'hash-bob';

async function seed() {
  await t.exec(
    `INSERT INTO waitlist_entries (id, email_hash) VALUES ('wl_ana', $1), ('wl_bob', $2)`,
    [ANA, BOB]
  );
  await t.exec(
    `INSERT INTO email_delivery_logs (id, recipient_hash, template, status) VALUES
      ('d1', $1, 'welcome', 'sent'), ('d2', $1, 'deletion-confirmation', 'sent'),
      ('d4', $1, 'referral-success', 'sent'), ('d3', $2, 'welcome', 'sent')`,
    [ANA, BOB]
  );
  await t.exec(
    `INSERT INTO deletion_tokens (token_hash, email, email_hash, expires_at) VALUES
      ('t-click', 'enc-ana', $1, NOW() + interval '1 hour'),
      ('t-other', 'enc-ana', $1, NOW() + interval '1 hour'),
      ('t-bob', 'enc-bob', $2, NOW() + interval '1 hour'),
      ('t-null', 'enc-x', NULL, NOW() + interval '1 hour'),
      ('t-expired', 'enc-ana', $1, NOW() - interval '1 minute')`,
    [ANA, BOB]
  );
}

const ids = async (table: string, col: string) =>
  (await t.exec(`SELECT ${col} AS v FROM ${table} ORDER BY 1`)).map((r) => r.v);

/* PGlite boots a WASM Postgres; give the suite its own budget (COV-1, 5.1023). */
describe('RETENTION-1 guard 4 · erasure on Postgres', { timeout: 30_000 }, () => {
  beforeAll(async () => {
    t = await createTestDatabase();
    erasure = new PrivacyPersonErasureService(t.query);
  }, TEST_DATABASE_BOOT_MS);
  afterAll(async () => {
    await t.close();
  });
  beforeEach(async () => {
    await t.exec('DROP TRIGGER IF EXISTS fail_entry_delete ON waitlist_entries');
    await t.reset();
    await seed();
  });

  it('should read a live link without consuming it', async () => {
    expect(await erasure.findLink('t-click')).toEqual({
      encryptedEmail: 'enc-ana',
      emailHash: ANA,
    });
    expect(await erasure.findLink('t-expired')).toBeNull();
    expect(await ids('deletion_tokens', 'token_hash')).toContain('t-click');
  });

  it("should erase the person's entry, delivery rows and every link, and nobody else's, when the link is consumed", async () => {
    const result = await erasure.consumeAndErase('t-click', 'unused-fallback', {
      correlationId: 'req-1',
    });
    // three delivery rows and two other links: a swapped count column cannot pass
    expect(result).toEqual({ consumed: true, entryId: 'wl_ana', deliveryRows: 3, otherLinks: 2 });
    // the GDPR record is written by the same statement, once
    expect(
      await t.exec('SELECT entity_type, deleted_by, reason, correlation_id FROM gdpr_deletion_logs')
    ).toEqual([
      {
        entity_type: 'waitlist_entry',
        deleted_by: 'user_request',
        reason: 'gdpr_article_17',
        correlation_id: 'req-1',
      },
    ]);
    expect(await ids('waitlist_entries', 'id')).toEqual(['wl_bob']);
    expect(await ids('email_delivery_logs', 'id')).toEqual(['d3']);
    // the person's other links (live and expired) are gone; the NULL-hash link is untouched
    expect(await ids('deletion_tokens', 'token_hash')).toEqual(['t-bob', 't-null']);
    expect(await erasure.isErased('t-click', ANA)).toBe(true);
  });

  it('should erase nothing and report not consumed when the link has expired', async () => {
    const result = await erasure.consumeAndErase('t-expired', ANA);
    expect(result).toEqual({ consumed: false, entryId: null, deliveryRows: 0, otherLinks: 0 });
    expect(await ids('waitlist_entries', 'id')).toEqual(['wl_ana', 'wl_bob']);
    expect(await ids('email_delivery_logs', 'id')).toEqual(['d1', 'd2', 'd3', 'd4']);
    expect(await ids('gdpr_deletion_logs', 'id')).toEqual([]);
  });

  it('should write no GDPR record when the person had no entry', async () => {
    await t.exec(`DELETE FROM waitlist_entries WHERE id = 'wl_ana'`);
    const result = await erasure.consumeAndErase('t-click', ANA);
    expect(result).toMatchObject({ consumed: true, entryId: null });
    expect(await ids('gdpr_deletion_logs', 'id')).toEqual([]);
  });

  it("should never erase another person's rows when the link's stored hash is empty", async () => {
    // rows written before 5.824 under an empty blind index belong to nobody in particular
    await t.exec(`INSERT INTO waitlist_entries (id, email_hash) VALUES ('wl_legacy', '')`);
    await t.exec(
      `INSERT INTO email_delivery_logs (id, recipient_hash, template, status) VALUES ('d-legacy', '', 'welcome', 'sent')`
    );
    await t.exec(`UPDATE deletion_tokens SET email_hash = '' WHERE token_hash = 't-click'`);
    const result = await erasure.consumeAndErase('t-click', ANA);
    // keyed on the fallback (Ana's real hash), never on ''
    expect(result).toMatchObject({ consumed: true, entryId: 'wl_ana' });
    expect(await ids('waitlist_entries', 'id')).toEqual(['wl_bob', 'wl_legacy']);
    expect(await ids('email_delivery_logs', 'id')).toContain('d-legacy');
  });

  it('should consume nothing when neither the link nor the caller gives a hash', async () => {
    await t.exec(`UPDATE deletion_tokens SET email_hash = '' WHERE token_hash = 't-click'`);
    const result = await erasure.consumeAndErase('t-click', '');
    expect(result).toEqual({ consumed: false, entryId: null, deliveryRows: 0, otherLinks: 0 });
    expect(await ids('deletion_tokens', 'token_hash')).toContain('t-click');
  });

  it('should erase by the fallback hash when the link was written before its stored hash', async () => {
    await t.exec(`UPDATE deletion_tokens SET email_hash = NULL WHERE token_hash = 't-click'`);
    const result = await erasure.consumeAndErase('t-click', ANA);
    expect(result).toMatchObject({ consumed: true, entryId: 'wl_ana', deliveryRows: 3 });
  });

  it('should change nothing, the link still usable, when any part of the statement fails', async () => {
    await t.db.exec(`
      CREATE OR REPLACE FUNCTION fail_delete() RETURNS trigger AS $$
      BEGIN RAISE EXCEPTION 'injected failure'; END; $$ LANGUAGE plpgsql;
      CREATE TRIGGER fail_entry_delete BEFORE DELETE ON waitlist_entries
        FOR EACH ROW EXECUTE FUNCTION fail_delete();
    `);
    await expect(erasure.consumeAndErase('t-click', ANA)).rejects.toThrow(/injected failure/);
    expect(await ids('waitlist_entries', 'id')).toEqual(['wl_ana', 'wl_bob']);
    expect(await ids('email_delivery_logs', 'id')).toEqual(['d1', 'd2', 'd3', 'd4']);
    expect(await ids('gdpr_deletion_logs', 'id')).toEqual([]);
    expect(await ids('deletion_tokens', 'token_hash')).toContain('t-click');
    expect(await ids('deletion_tokens', 'token_hash')).toContain('t-other');
    expect(await erasure.isErased('t-click', ANA)).toBe(false);
  });

  it('should report not erased while the link or the entry is still there', async () => {
    expect(await erasure.isErased('t-click', ANA)).toBe(false);
    await t.exec(`DELETE FROM deletion_tokens WHERE token_hash = 't-click'`);
    expect(await erasure.isErased('t-click', ANA)).toBe(false); // entry still there
  });

  /*
   * PGlite runs one query at a time, so two calls here never overlap: this proves that a link
   * already consumed reports not consumed. Real concurrency (two clicks at once on Neon) rests on
   * the consume step being one `DELETE … RETURNING` inside the statement (a row lock, re-checked
   * by the second request), pinned on the statement's text below. Scope limit stated in the gate.
   */
  it('should report not consumed when the link was already consumed', async () => {
    const first = await erasure.consumeAndErase('t-click', ANA);
    const second = await erasure.consumeAndErase('t-click', ANA);
    expect([first.consumed, second.consumed]).toEqual([true, false]);
  });

  it('should consume the link with one DELETE … RETURNING inside the statement', async () => {
    const seen: string[] = [];
    const spy = new PrivacyPersonErasureService(async (strings, ...values) => {
      seen.push(strings.join('?'));
      return t.query(strings, ...values);
    });
    await spy.consumeAndErase('t-click', ANA);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatch(/WITH consumed AS \(\s*DELETE FROM deletion_tokens[\s\S]*?RETURNING/);
    expect(seen[0]).not.toMatch(/SELECT[^)]*FROM deletion_tokens[\s\S]*consumed AS/);
  });
});
