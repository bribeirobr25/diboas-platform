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

/**
 * Rate limiter interface — Service Agnostic Abstraction.
 * The existing Upstash/in-memory implementation satisfies this contract.
 * Consumers can depend on the interface for testing or alternative backends.
 */
export interface IRateLimiter {
  checkRateLimit(key: string, limit?: number, windowMs?: number): Promise<RateLimitResult>;
}

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
    Logger.error('[RateLimiter] Failed to initialize Redis:', {
      error: error instanceof Error ? error.message : String(error),
    });
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
 * Ping Redis to check connectivity (for health checks)
 */
export async function pingRedis(): Promise<boolean> {
  initializeRedis();
  if (!redis) return false;
  try {
    const result = await Promise.race([
      redis.ping(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Redis ping timeout')), 5000)
      ),
    ]);
    return result === 'PONG';
  } catch {
    return false;
  }
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
      Logger.error('[RateLimiter] Redis rate limit failed, using in-memory fallback', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Alert: Redis fallback means rate limiting is per-instance only
      try {
        const { applicationEventBus, ApplicationEventType } =
          await import('@/lib/events/ApplicationEventBus');
        applicationEventBus.emit(ApplicationEventType.APPLICATION_ERROR, {
          domain: 'monitoring',
          source: 'rateLimiter',
          timestamp: Date.now(),
          error: error instanceof Error ? error : new Error(String(error)),
          severity: 'high',
          metadata: { operation: 'redis_fallback_activated' },
        });
      } catch {
        // Event bus unavailable — already logged above
      }
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
    headers.set(
      'Retry-After',
      Math.max(0, result.reset - Math.floor(Date.now() / 1000)).toString()
    );
  }

  return headers;
}

// ---------------------------------------------------------------------------
// Dedicated rate limiters (F8 / F9 — Bar R2 exception, 2026-06-02)
//
// `@upstash/ratelimit` bakes the limit + window into the Ratelimit instance at
// construction (per-call args are ignored), so each distinct policy needs its
// own instance, separate from the IP-keyed `ratelimit` above.
//
// Fail-closed in production: a missing Upstash env or a Redis error blocks
// (success:false). In dev/test we fall back to the in-memory limiter with the
// same params so local DX isn't blocked.
// ---------------------------------------------------------------------------

function createDedicatedLimiter(limit: number, windowMs: number, prefix: string) {
  let instance: Ratelimit | null = null;
  let init = false;

  function ensure(): boolean {
    if (init) return instance !== null;
    init = true;
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return false;
    try {
      instance = new Ratelimit({
        redis: new Redis({ url, token }),
        limiter: Ratelimit.slidingWindow(limit, `${windowMs}ms`),
        analytics: true,
        prefix,
      });
      return true;
    } catch (error) {
      Logger.error(`[RateLimiter] Failed to init dedicated limiter '${prefix}'`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  const blocked = (): RateLimitResult => ({
    success: false,
    limit,
    remaining: 0,
    reset: Math.ceil((Date.now() + windowMs) / 1000),
  });

  return async function check(identifier: string): Promise<RateLimitResult> {
    const hasRedis = ensure();
    if (hasRedis && instance) {
      try {
        const r = await instance.limit(identifier);
        return {
          success: r.success,
          limit: r.limit,
          remaining: r.remaining,
          reset: Math.ceil(r.reset / 1000),
        };
      } catch (error) {
        Logger.error(`[RateLimiter] Dedicated limiter '${prefix}' failed`, {
          error: error instanceof Error ? error.message : String(error),
        });
        if (IS_PRODUCTION) return blocked(); // fail closed
      }
    } else if (IS_PRODUCTION) {
      return blocked(); // missing Upstash env in production → fail closed
    }
    // Dev/test fallback: in-memory with the same params, namespaced by prefix.
    return checkInMemoryRateLimit(`${prefix}${identifier}`, limit, windowMs);
  };
}

const checkOutboundEmail = createDedicatedLimiter(2, 5 * 60 * 1000, 'signup:email:');
const checkMonitoringTunnel = createDedicatedLimiter(1000, 60 * 1000, 'monitoring:tunnel:');

/**
 * F8 — per-email-address outbound email rate limit (max 2 per 5 minutes).
 * Keyed by the email's HMAC hash (raw email never reaches Upstash). Anti
 * email-bombing: caps how many confirmation/notification emails a single
 * address can receive regardless of source IP.
 */
export function checkOutboundEmailRateLimit(emailHash: string): Promise<RateLimitResult> {
  return checkOutboundEmail(emailHash);
}

/**
 * F9 — permissive per-IP rate limit for the `/api/monitoring` Sentry tunnel
 * (1000 per 60s). ~40× headroom over the Sentry SDK's normal ~25/min/session
 * rate so legitimate envelope traffic is never blocked, while a single-source
 * billing-amplification flood is capped.
 */
export function checkMonitoringTunnelRateLimit(ip: string): Promise<RateLimitResult> {
  return checkMonitoringTunnel(ip);
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
