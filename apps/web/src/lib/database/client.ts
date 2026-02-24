/**
 * Database Client
 *
 * HTTP-based Neon PostgreSQL driver for Vercel serverless.
 * No TCP connection pooling — uses HTTP queries per request.
 */

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { Logger } from '@/lib/monitoring/Logger';

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
 * Tagged template for SQL queries.
 * Usage: sql`SELECT * FROM waitlist_entries WHERE email = ${email}`
 */
export function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<Record<string, unknown>[]> {
  return getSql()(strings, ...values);
}

/**
 * Health check — verifies database connectivity.
 */
export async function pingDatabase(): Promise<boolean> {
  try {
    const db = getSql();
    await db`SELECT 1`;
    return true;
  } catch (error) {
    Logger.error('[Database] Ping failed', {}, error instanceof Error ? error : undefined);
    return false;
  }
}
