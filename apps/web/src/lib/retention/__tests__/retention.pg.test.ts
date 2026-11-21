/**
 * ⛑ RETENTION-1 guard 3 · the retention job's SQL against a real Postgres (plan P14; `5.863`).
 *
 * PGlite in-process (src/test/pglite.ts), no account or key. Delivery rows and idempotency rows
 * are written by the REAL writers (`logEmailDelivery`, `dbCacheIdempotentResponse`) through the
 * test database, so their address normalisation and their timestamp kinds are under test too.
 * Ages are set in SQL from `NOW() - interval …` (never 3 × 365 days in JavaScript: a leap year
 * would put a seed on the boundary).
 *
 * Scope limit: PGlite, not Neon's HTTP driver; every statement is standard SQL.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { QueryFn } from '@/lib/database/client';
import { createTestDatabase, TEST_DATABASE_BOOT_MS, type TestDatabase } from '@/test/pglite';

let current: QueryFn;
vi.mock('@/lib/database/client', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => current(strings, ...values),
}));
vi.mock('@/lib/monitoring/Logger', () => ({
  Logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { runRetention } from '..';
import { ORPHAN_SWEEP_MAX_ROWS } from '../emailDeliveryOrphans';
import { logEmailDelivery } from '@/lib/email/deliveryLogger';
import { dbCacheIdempotentResponse } from '@/lib/security/DatabaseIdempotencyStore';
import { hashEmailAddress } from '@/lib/security/hashEmailAddress';
import { Logger } from '@/lib/monitoring/Logger';

let t: TestDatabase;

const member = async (id: string, email: string) =>
  t.exec('INSERT INTO waitlist_entries (id, email_hash) VALUES ($1, $2)', [
    id,
    hashEmailAddress(email),
  ]);
/** A delivery row written by the real logger; `locale` doubles as the test's label. */
const delivered = async (email: string, label: string, status: 'sent' | 'failed' = 'sent') =>
  logEmailDelivery({ recipientEmail: email, template: 'welcome', locale: label, status });
const age = async (label: string, interval: string) =>
  t.exec(
    `UPDATE email_delivery_logs SET sent_at = NOW() - interval '${interval}' WHERE locale = $1`,
    [label]
  );
const labels = async () =>
  (await t.exec('SELECT locale FROM email_delivery_logs ORDER BY locale')).map((r) => r.locale);

/* PGlite boots a WASM Postgres; give the suite its own budget (COV-1, 5.1023). */
describe('RETENTION-1 guard 3 · the purges on Postgres', { timeout: 30_000 }, () => {
  beforeAll(async () => {
    t = await createTestDatabase();
    current = t.query;
  }, TEST_DATABASE_BOOT_MS);
  afterAll(async () => {
    await t.close();
  });
  beforeEach(async () => {
    await t.reset();
    vi.mocked(Logger.error).mockClear();
    vi.mocked(Logger.warn).mockClear();
  });

  it('should run in UTC when the harness starts', async () => {
    expect((await t.exec('SHOW TIME ZONE'))[0]).toEqual({ TimeZone: 'UTC' });
  });

  it('should delete exactly the expired and orphaned rows, and keep the rest, when the job runs', async () => {
    await member('wl_ana', 'ana@example.com');
    await member('wl_bob', 'bob@example.com');
    // a member's rows: one past 3 years, one inside; the mixed-case write must still match
    await delivered('ana@example.com', 'm-old');
    await delivered('ana@example.com', 'm-young');
    await delivered('  Ana@Example.com ', 'm-mixed');
    await age('m-old', '3 years 1 day');
    await age('m-young', '3 years -1 day');
    // an orphan (erased person) and a legacy row with an empty hash
    await delivered('gone@example.com', 'orphan');
    await t.exec(
      `INSERT INTO email_delivery_logs (id, recipient_hash, template, locale, status)
       VALUES ('edl_legacy', '', 'welcome', 'legacy-empty', 'sent')`
    );
    // stored error texts: raw (legacy) and the code (kept)
    await delivered('bob@example.com', 'b-failed', 'failed');
    await t.exec(
      `INSERT INTO email_delivery_logs (id, recipient_hash, template, locale, status, error_message)
       VALUES ('edl_raw', $1, 'welcome', 'b-raw', 'failed', 'Mailbox bob@example.com rejected')`,
      [hashEmailAddress('bob@example.com')]
    );
    // deletion links: expired and live, with and without a hash
    await t.exec(
      `INSERT INTO deletion_tokens (token_hash, email, email_hash, expires_at) VALUES
        ('t-expired', 'c', 'h1', NOW() - interval '1 minute'),
        ('t-live', 'c', 'h2', NOW() + interval '1 hour'),
        ('t-expired-null', 'c', NULL, NOW() - interval '1 minute'),
        ('t-live-null', 'c', NULL, NOW() + interval '1 hour')`
    );
    // idempotency rows through the real writer: one expired, one live
    await dbCacheIdempotentResponse('k-expired', 200, { ok: true }, -60_000);
    await dbCacheIdempotentResponse('k-live', 200, { ok: true }, 60_000);
    // audit rows either side of 90 days
    await t.exec(
      `INSERT INTO audit_logs (created_at) VALUES (NOW() - interval '91 days'), (NOW() - interval '89 days')`
    );

    const run = await runRetention(t.query);

    expect(run.ok).toBe(true);
    expect(Object.fromEntries(run.purges.map((p) => [p.name, p.count]))).toEqual({
      auditLogs: 1,
      emailDeliveryLogs: 1,
      emailDeliveryOrphans: 2,
      emailDeliveryLegacyText: 1,
      deletionTokens: 2,
      idempotencyCache: 1,
    });
    expect(await labels()).toEqual(['b-failed', 'b-raw', 'm-mixed', 'm-young']);
    expect(
      (
        await t.exec(
          'SELECT error_message FROM email_delivery_logs WHERE status = $1 ORDER BY id',
          ['failed']
        )
      )
        .map((r) => r.error_message)
        .sort()
    ).toEqual(['legacy_redacted', 'provider_rejected']);
    expect(
      (await t.exec('SELECT token_hash FROM deletion_tokens ORDER BY 1')).map((r) => r.token_hash)
    ).toEqual(['t-live', 't-live-null']);
    expect((await t.exec('SELECT key FROM idempotency_cache')).map((r) => r.key)).toEqual([
      'k-live',
    ]);
    expect((await t.exec('SELECT count(*)::int AS n FROM audit_logs'))[0]!.n).toBe(1);
    // the sweep deleted rows, so it says so (count only)
    expect(Logger.warn).toHaveBeenCalledWith('[retention] rows deleted by a sweep', {
      purge: 'emailDeliveryOrphans',
      count: 2,
    });
  });

  it('should be idempotent when the job runs twice', async () => {
    await member('wl_ana', 'ana@example.com');
    await delivered('ana@example.com', 'm-old');
    await age('m-old', '3 years 1 day');
    // a raw error text and a stored code: a second run must rewrite neither (P14 review)
    await delivered('ana@example.com', 'm-failed', 'failed');
    await t.exec(
      `INSERT INTO email_delivery_logs (id, recipient_hash, template, locale, status, error_message)
       VALUES ('edl_raw2', $1, 'welcome', 'm-raw', 'failed', 'Mailbox rejected')`,
      [hashEmailAddress('ana@example.com')]
    );
    const first = await runRetention(t.query);
    expect(first.purges.find((p) => p.name === 'emailDeliveryLegacyText')?.count).toBe(1);
    const second = await runRetention(t.query);
    expect(second.purges.every((p) => p.count === 0 && p.status === 'ok')).toBe(true);
  });

  it('should delete nothing and report the brake when more orphans than the cap exist', async () => {
    await member('wl_ana', 'ana@example.com');
    for (let i = 0; i <= ORPHAN_SWEEP_MAX_ROWS; i++)
      await delivered(`gone${i}@example.com`, `o${i}`);
    const run = await runRetention(t.query);
    const sweep = run.purges.find((p) => p.name === 'emailDeliveryOrphans');
    expect(sweep).toEqual({ name: 'emailDeliveryOrphans', status: 'brake', count: 0 });
    expect(run.ok).toBe(false);
    expect((await t.exec('SELECT count(*)::int AS n FROM email_delivery_logs'))[0]!.n).toBe(
      ORPHAN_SWEEP_MAX_ROWS + 1
    );
    expect(Logger.error).toHaveBeenCalledWith('[retention] brake tripped; nothing deleted', {
      purge: 'emailDeliveryOrphans',
    });
    // the other purges still ran
    expect(run.purges.filter((p) => p.status === 'ok')).toHaveLength(run.purges.length - 1);
  });

  it('should delete exactly the cap when that many orphans exist', async () => {
    await member('wl_ana', 'ana@example.com');
    for (let i = 0; i < ORPHAN_SWEEP_MAX_ROWS; i++)
      await delivered(`gone${i}@example.com`, `o${i}`);
    const run = await runRetention(t.query);
    expect(run.purges.find((p) => p.name === 'emailDeliveryOrphans')).toEqual({
      name: 'emailDeliveryOrphans',
      status: 'ok',
      count: ORPHAN_SWEEP_MAX_ROWS,
    });
  });

  it('should delete nothing and report the brake when the waitlist is empty', async () => {
    await delivered('gone@example.com', 'o1');
    const run = await runRetention(t.query);
    expect(run.purges.find((p) => p.name === 'emailDeliveryOrphans')?.status).toBe('brake');
    expect(await labels()).toEqual(['o1']);
  });
});
