/**
 * Sandbox Database Client — HTTP-based Neon PostgreSQL driver for Vercel
 * serverless. Mirrors the `apps/web` client (P1.2 slice 1a) but logs via the
 * sandbox `Logger` (slice 1b) and backs its OWN Neon project (separate from the
 * platform DB — one-migrations-owner-per-database, SANDBOX_RULES R-6).
 *
 * Runtime use lands in Phase 2 (`PostgresLedgerStore`, via the exported `sql`
 * which satisfies `@diboas/banking`'s `SqlExecutor` — see the contract line
 * below). The standalone migration runner is `migrate.mjs` (self-contained CLI;
 * does not import this).
 */

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import type { SqlExecutor } from '@diboas/banking';
import { Logger } from '../monitoring/Logger';

let _sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  _sql = neon(databaseUrl);
  return _sql;
}

/**
 * Default query timeout (ms). Neon serverless cold start can take 3-7s on wake
 * (documented on the web side); once warm, queries complete in <500ms.
 */
const DEFAULT_QUERY_TIMEOUT_MS = 8000;

/** Wraps a promise with a timeout, clearing the timer on settle (P7/P9). */
function withTimeout<T>(
  promise: Promise<T>,
  ms: number = DEFAULT_QUERY_TIMEOUT_MS,
  operation = 'Database query'
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${operation} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

/** Tagged template for SQL queries (8s timeout guard). */
export function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<Record<string, unknown>[]> {
  return withTimeout(getSql()(strings, ...values));
}

/**
 * Execute a raw SQL string. For trusted SQL only (migrations/DDL), never user
 * input. One statement per call (Neon HTTP is a one-shot transport).
 */
export async function rawSql(query: string): Promise<Record<string, unknown>[]> {
  const db = getSql();
  const strings = Object.assign([query], { raw: [query] }) as unknown as TemplateStringsArray;
  // CTO C1/§14.2 A: wrap in the same 8s timeout as `sql` (the mirrored web gap —
  // untimed `rawSql` — is tracked for apps/web as PENDING_ALL Follow-up D).
  return withTimeout(db(strings), DEFAULT_QUERY_TIMEOUT_MS, 'Database rawSql');
}

/** Health check — verifies connectivity. */
export async function pingDatabase(): Promise<boolean> {
  try {
    await withTimeout(getSql()`SELECT 1`, DEFAULT_QUERY_TIMEOUT_MS, 'Database ping');
    return true;
  } catch (error) {
    Logger.error('database ping failed', {}, error);
    return false;
  }
}

// Contract (CTO §14.2 B): `sql` conforms to @diboas/banking's `SqlExecutor`
// injection seam, so `new PostgresLedgerStore(ownerKey, sql)` links at compile
// time — if either signature drifts, this line fails type-check.
const _sqlExecutorContract: SqlExecutor = sql;
void _sqlExecutorContract;
