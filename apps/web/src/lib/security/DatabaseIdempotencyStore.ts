/**
 * Database-Backed Idempotency Store (Task 64)
 *
 * Stores idempotent responses in PostgreSQL via the Neon HTTP driver.
 * Used when DATABASE_URL is available; the in-memory fallback remains
 * for local development / environments without a database.
 */

import { sql } from '@/lib/database/client';
import { Logger } from '@/lib/monitoring/Logger';

interface CachedResponseRow {
  key: string;
  response: { status: number; body: unknown };
  created_at: string;
  expires_at: string;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Look up a cached idempotent response from the database.
 * Returns null if not found or expired.
 */
export async function dbGetIdempotentResponse(
  idempotencyKey: string
): Promise<{ status: number; body: unknown } | null> {
  try {
    const rows = await sql`
      SELECT response
      FROM idempotency_cache
      WHERE key = ${idempotencyKey}
        AND expires_at > NOW()
      LIMIT 1
    `;

    if (rows.length === 0) return null;

    const row = rows[0] as unknown as CachedResponseRow;
    return row.response;
  } catch (error) {
    Logger.error('[DatabaseIdempotencyStore] Failed to read', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Store a response in the database for idempotent replay.
 */
export async function dbCacheIdempotentResponse(
  idempotencyKey: string,
  status: number,
  body: unknown,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();
    const response = JSON.stringify({ status, body });

    await sql`
      INSERT INTO idempotency_cache (key, response, expires_at)
      VALUES (${idempotencyKey}, ${response}::jsonb, ${expiresAt}::timestamp)
      ON CONFLICT (key) DO UPDATE
        SET response = ${response}::jsonb,
            expires_at = ${expiresAt}::timestamp
    `;
  } catch (error) {
    Logger.error('[DatabaseIdempotencyStore] Failed to write', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Delete expired entries (housekeeping). Safe to call periodically.
 */
export async function dbCleanupIdempotencyCache(): Promise<void> {
  try {
    await sql`DELETE FROM idempotency_cache WHERE expires_at <= NOW()`;
  } catch (error) {
    Logger.error('[DatabaseIdempotencyStore] Cleanup failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
