/**
 * Database Client
 *
 * HTTP-based Neon PostgreSQL driver for Vercel serverless.
 * No TCP connection pooling — uses HTTP queries per request.
 */

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { Logger } from '@/lib/monitoring/Logger';

/**
 * IDatabaseClient — abstraction over the SQL tagged-template query function.
 *
 * Allows swapping the concrete driver (Neon, pg, PlanetScale, etc.)
 * without changing consumer code.
 */
export interface IDatabaseClient {
  sql(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<Record<string, unknown>[]>;

  rawSql(query: string): Promise<Record<string, unknown>[]>;

  pingDatabase(): Promise<boolean>;
}

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
 * Execute a raw SQL string (for migrations and DDL).
 * Not for user input — only for trusted SQL from migration files.
 */
export async function rawSql(query: string): Promise<Record<string, unknown>[]> {
  const db = getSql();
  // Wrap the raw string as a TemplateStringsArray to satisfy the neon driver
  const strings = Object.assign([query], { raw: [query] }) as TemplateStringsArray;
  return db(strings);
}

/**
 * Health check — verifies database connectivity.
 */
export async function pingDatabase(): Promise<boolean> {
  try {
    const db = getSql();
    await Promise.race([
      db`SELECT 1`,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Database ping timeout')), 5000)
      ),
    ]);
    return true;
  } catch (error) {
    Logger.error('[Database] Ping failed', {}, error instanceof Error ? error : undefined);
    return false;
  }
}
