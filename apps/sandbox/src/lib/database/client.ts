/**
 * Sandbox Database Client — HTTP-based Neon PostgreSQL driver for Vercel
 * serverless. Mirrors the `apps/web` client's `sql` (P1.2 slice 1a) and backs its
 * OWN Neon project (separate from the platform DB — one-migrations-owner-per-
 * database, SANDBOX_RULES R-6). The unused `rawSql` and `pingDatabase` mirrors
 * were deleted 2026-10-18 (lane audit; a knip `ignore` had hidden them) — the
 * migration CLI has its own `rawSql`, and the sandbox has no health route.
 *
 * Runtime use lands in Phase 2 (`PostgresLedgerStore`, via the exported `sql`
 * which satisfies `@diboas/banking`'s `SqlExecutor` — see the contract line
 * below). The standalone migration runner is `migrate.mjs` (self-contained CLI;
 * does not import this).
 */

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import type { SqlExecutor } from '@diboas/banking';

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

// Contract (CTO §14.2 B): `sql` conforms to @diboas/banking's `SqlExecutor`
// injection seam, so `new PostgresLedgerStore(ownerKey, sql)` links at compile
// time — if either signature drifts, this line fails type-check.
const _sqlExecutorContract: SqlExecutor = sql;
void _sqlExecutorContract;
