/**
 * An in-process Postgres for tests (PGlite), used by RETENTION-1 guards 3 and 4 (plan P14).
 *
 * The website's real schema lives in the private migrations (register `5.709`); this one is
 * SYNTHETIC and NON-CANONICAL. Per plan P14 §16 G3′ it holds only what the guards test: the
 * column names the queries use, `timestamp` vs `timestamptz` where a comparison depends on it,
 * NOT NULL only where a test relies on it, and the keys `ON CONFLICT` needs. No comments, index
 * names or other defaults.
 *
 * The adapter has the shape of `IDatabaseClient['sql']` (rows only, as Neon's tagged template
 * returns): a tagged template becomes `$1…$n` parameters. The session runs in UTC (asserted).
 */
import { PGlite } from '@electric-sql/pglite';
import type { QueryFn } from '@/lib/database/client';

const SCHEMA = `
  CREATE TABLE waitlist_entries (id text PRIMARY KEY, email_hash text);
  CREATE TABLE deletion_tokens (
    token_hash text PRIMARY KEY, email text, email_hash text, expires_at timestamptz NOT NULL
  );
  CREATE TABLE email_delivery_logs (
    id text PRIMARY KEY, recipient_email text, recipient_hash text NOT NULL, template text,
    subject text, locale text, status text, provider_id text, error_message text,
    sent_at timestamptz NOT NULL DEFAULT NOW()
  );
  CREATE TABLE idempotency_cache (key text PRIMARY KEY, response jsonb, expires_at timestamp NOT NULL);
  CREATE TABLE audit_logs (id serial PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT NOW());
`;

export interface TestDatabase {
  db: PGlite;
  query: QueryFn;
  /** Plain SQL for seeding and reading back. */
  exec(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
  /** Empty every table (between tests: booting PGlite takes seconds, so a file boots once). */
  reset(): Promise<void>;
  close(): Promise<void>;
}

/** Booting the WASM Postgres is slow; a suite boots once in `beforeAll` with this budget. */
export const TEST_DATABASE_BOOT_MS = 120_000;

export async function createTestDatabase(): Promise<TestDatabase> {
  const db = new PGlite();
  await db.exec(`SET TIME ZONE 'UTC';`);
  const tz = await db.query<{ TimeZone: string }>('SHOW TIME ZONE');
  if (tz.rows[0]?.TimeZone !== 'UTC') throw new Error('test database is not in UTC');
  await db.exec(SCHEMA);

  const query: QueryFn = async (strings, ...values) => {
    const text = strings.reduce((acc, part, i) => acc + `$${i}` + part);
    const result = await db.query<Record<string, unknown>>(text, values);
    return result.rows;
  };
  const exec = async (sql: string, params: unknown[] = []) =>
    (await db.query<Record<string, unknown>>(sql, params)).rows;

  const reset = async () => {
    await db.exec(
      'TRUNCATE waitlist_entries, deletion_tokens, email_delivery_logs, idempotency_cache, audit_logs RESTART IDENTITY;'
    );
  };

  return { db, query, exec, reset, close: () => db.close() };
}
