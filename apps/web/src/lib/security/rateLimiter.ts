/**
 * Distributed Rate Limiter
 *
 * Uses Upstash Redis for distributed rate limiting across instances.
 * Falls back to in-memory limiting if Redis is unavailable.
 *
 * Features:
 * - Sliding window algorithm
 * - Automatic Redis fallback
 * - Configurable limits per endpoint
 */

import { Logger } from '@/lib/monitoring/Logger';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { RATE_LIMIT_CONFIG, IS_PRODUCTION } from '@/config/env';

// In-memory fallback store
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

// Configuration from environment
const DEFAULT_LIMIT = RATE_LIMIT_CONFIG.strict.limit;
const DEFAULT_WINDOW_MS = RATE_LIMIT_CONFIG.strict.windowMs;

// Redis client (lazy initialization)
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;
let initialized = false;

/**
 * Initialize Redis and Ratelimit instances
 */
function initializeRedis(): boolean {
  if (initialized) {
    return redis !== null;
  }

  initialized = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (IS_PRODUCTION) {
      Logger.warn('[RateLimiter] Upstash Redis not configured, using in-memory fallback');
    }
    return false;
  }

  try {
    redis = new Redis({ url, token });
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(DEFAULT_LIMIT, `${DEFAULT_WINDOW_MS}ms`),
      analytics: true,
      prefix: RATE_LIMIT_CONFIG.prefix,
    });
    return true;
  } catch (error) {
    Logger.error('[RateLimiter] Failed to initialize Redis:', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

/**
 * Check if rate limiting is using Redis
 */
export function isRedisEnabled(): boolean {
  initializeRedis();
  return redis !== null;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
}

/**
 * Check rate limit for an identifier (usually IP address)
 *
 * @param identifier - Unique identifier (e.g., IP address)
 * @param limit - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit result
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW_MS
): Promise<RateLimitResult> {
  const hasRedis = initializeRedis();

  if (hasRedis && ratelimit) {
    try {
      const result = await ratelimit.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: Math.ceil(result.reset / 1000),
      };
    } catch (error) {
      Logger.error('[RateLimiter] Redis rate limit failed, using fallback:', { error: error instanceof Error ? error.message : String(error) });
      // Fall through to in-memory
    }
  }

  // In-memory fallback
  return checkInMemoryRateLimit(identifier, limit, windowMs);
}

/**
 * In-memory rate limiting fallback
 */
function checkInMemoryRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = inMemoryStore.get(identifier);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    cleanupInMemoryStore();
  }

  if (!entry || entry.resetAt <= now) {
    // New window
    inMemoryStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil((now + windowMs) / 1000),
    };
  }

  if (entry.count >= limit) {
    // Rate limited
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.ceil(entry.resetAt / 1000),
    };
  }

  // Increment count
  entry.count++;
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: Math.ceil(entry.resetAt / 1000),
  };
}

/**
 * Clean up expired entries from in-memory store
 */
function cleanupInMemoryStore(): void {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore.entries()) {
    if (entry.resetAt <= now) {
      inMemoryStore.delete(key);
    }
  }
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.toString());

  if (!result.success) {
    headers.set('Retry-After', Math.max(0, result.reset - Math.floor(Date.now() / 1000)).toString());
  }

  return headers;
}

/**
 * Preset rate limiters for different endpoints
 * Configuration loaded from environment variables
 */
export const RateLimitPresets = {
  // Strict: for sensitive endpoints like waitlist signup
  strict: RATE_LIMIT_CONFIG.strict,

  // Standard: for general API endpoints
  standard: RATE_LIMIT_CONFIG.standard,

  // Lenient: for read-only endpoints
  lenient: RATE_LIMIT_CONFIG.lenient,
} as const;
