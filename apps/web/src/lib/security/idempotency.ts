/**
 * Idempotency Key Support
 *
 * Prevents duplicate processing of mutation requests.
 * Uses an in-memory LRU cache with TTL.
 * Production systems should replace with Redis-backed storage.
 */

import { NextResponse } from 'next/server';

interface CachedResponse {
  status: number;
  body: unknown;
  createdAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ENTRIES = 10_000;

const responseCache = new Map<string, CachedResponse>();

/** Evict expired entries when cache grows */
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
 */
export function getIdempotentResponse(idempotencyKey: string | null): NextResponse | null {
  if (!idempotencyKey) return null;

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
 */
export function cacheIdempotentResponse(
  idempotencyKey: string | null,
  status: number,
  body: unknown
): void {
  if (!idempotencyKey) return;

  evictStale();
  responseCache.set(idempotencyKey, { status, body, createdAt: Date.now() });
}
