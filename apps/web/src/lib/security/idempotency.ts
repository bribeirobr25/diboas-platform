/**
 * Idempotency Key Support
 *
 * Prevents duplicate processing of mutation requests.
 * When DATABASE_URL is set, uses PostgreSQL for durable storage.
 * Otherwise falls back to an in-memory LRU cache with TTL.
 */

import { NextResponse } from 'next/server';
import { dbGetIdempotentResponse, dbCacheIdempotentResponse } from './DatabaseIdempotencyStore';

interface CachedResponse {
  status: number;
  body: unknown;
  createdAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ENTRIES = 10_000;

const responseCache = new Map<string, CachedResponse>();

/** Whether a database is available for durable idempotency storage */
function hasDatabaseUrl(): boolean {
  return !!process.env.DATABASE_URL;
}

/** Evict expired entries when in-memory cache grows */
function evictStale(): void {
  if (responseCache.size <= MAX_ENTRIES) return;

  const now = Date.now();
  for (const [key, entry] of responseCache) {
    if (now - entry.createdAt > CACHE_TTL_MS) {
      responseCache.delete(key);
    }
  }
}

/**
 * Check for a cached idempotent response.
 * Returns the cached NextResponse if found, or null to proceed normally.
 *
 * When DATABASE_URL is available, queries PostgreSQL first
 * and falls back to in-memory on database errors.
 */
export async function getIdempotentResponse(
  idempotencyKey: string | null
): Promise<NextResponse | null> {
  if (!idempotencyKey) return null;

  // Try database first when available
  if (hasDatabaseUrl()) {
    const dbResult = await dbGetIdempotentResponse(idempotencyKey);
    if (dbResult) {
      return NextResponse.json(dbResult.body, { status: dbResult.status });
    }
  }

  // In-memory fallback
  const cached = responseCache.get(idempotencyKey);
  if (!cached) return null;

  if (Date.now() - cached.createdAt > CACHE_TTL_MS) {
    responseCache.delete(idempotencyKey);
    return null;
  }

  return NextResponse.json(cached.body, { status: cached.status });
}

/**
 * Store a response for idempotent replay.
 *
 * Writes to both database (when available) and in-memory cache
 * so that subsequent lookups within the same process are fast.
 */
export async function cacheIdempotentResponse(
  idempotencyKey: string | null,
  status: number,
  body: unknown
): Promise<void> {
  if (!idempotencyKey) return;

  // Always write to in-memory for fast same-process reads
  evictStale();
  responseCache.set(idempotencyKey, { status, body, createdAt: Date.now() });

  // Also persist to database when available
  if (hasDatabaseUrl()) {
    await dbCacheIdempotentResponse(idempotencyKey, status, body, CACHE_TTL_MS);
  }
}
