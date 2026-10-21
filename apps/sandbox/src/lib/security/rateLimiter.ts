/**
 * Rate limiting for the sandbox's server-side market seam (`5.213`).
 *
 * **Authority:** `SANDBOX_RULES` R-5 and the ratified `SANDBOX_SPEC_D-F`
 * (standing dependency FT-4) require the public data seam to be rate limited.
 * Measured 2026-09-25 before this file existed: the sandbox had **zero** rate
 * limiting and **zero** Upstash dependency, while `/api/market` and
 * `/api/market/history` were reachable publicly at `app.diboas.com` and each
 * request could reach two external providers.
 *
 * ## Two tiers, and the fallback is a real limiter
 *
 * Upstash Redis (a sliding window) when configured; a per-instance in-memory
 * FIXED window when not. This mirrors `apps/web/src/lib/security/rateLimiter.ts`
 * rather than inventing a second pattern.
 *
 * ⚑ THE FALLBACK LIMITS — IT DOES NOT WAVE TRAFFIC THROUGH. An unconfigured
 * Redis degrades the limiter from *distributed* to *per-instance*; it never
 * degrades it to *absent*.
 *
 * ⚑ PER INSTANCE — NO GLOBAL BOUND IS DEMONSTRATED (stated 2026-10-16, R4 T2).
 * During INTERMITTENT Redis failure, a request that times out is judged by the
 * local window of whichever instance served it, while a request Redis answers
 * is judged by Redis. The two tiers count separately, and every instance has
 * its own window, so one client can be admitted by both tiers and by several
 * instances in the same minute. That is bounded per instance, but no global
 * upper bound is demonstrated — an earlier "about double" was per instance
 * only. Bounding it differently is a rate-limit POLICY decision, not made here.
 *
 * ⚑ THE REDIS TIER IS THE LIVE ONE (measured 2026-10-15, variable NAMES only:
 * `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are set for Production
 * and Preview). So the Redis path is not a nice-to-have; it is what every
 * deployed request runs, and it must fail CLOSED-ISH like the fallback does:
 *
 *   - `@upstash/ratelimit` resolves `{ success: true, reason: 'timeout' }` when
 *     Redis is slow ("allow requests in case of network problems"). Trusting
 *     `success` there would turn a slow Redis into NO limit. A timed-out answer
 *     is therefore not an answer: the local window decides instead.
 *   - The library default timeout is 5000 ms, added to every uncached market
 *     request while Redis is slow. It is bounded to `MARKET_REDIS_TIMEOUT_MS`.
 *
 * ⚑ WHAT THIS PROTECTS, STATED PRECISELY: THE ORIGIN, NOT THE EDGE.
 *
 * Both market routes ship `MARKET_CACHE_CONTROL` (`s-maxage=300`), so a CDN HIT
 * never reaches this function and is never counted. That is the right division
 * of labour — the edge absorbs repeat traffic for free — but it means the
 * limiter's budget applies to cache MISSES, which is exactly the expensive
 * case: `?currency=` × `?days=` (1–730) are cache-key dimensions, so a caller
 * can force misses cheaply, and that is the abuse shape `5.213` names. A green
 * limiter does NOT mean "30 requests per client reached the edge"; it means
 * "30 origin executions per client", which is the number that costs money and
 * reaches DeFiLlama and CoinGecko.
 *
 * ⚑ WHAT IS DELIBERATELY NOT LIMITED: `/api/health`. A liveness probe that can
 * be rate-limited reports the limiter's state, not the service's, and a
 * platform health check would trip it first. Stated rather than left as an
 * unexplained gap.
 */

import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { Logger } from '../monitoring/Logger';

/** Requests per window, per client, per route group. */
export const MARKET_RATE_LIMIT = 30;
/** Window length in milliseconds. */
export const MARKET_RATE_WINDOW_MS = 60_000;
/** Upper bound on one Redis round-trip before the local window decides instead. */
const MARKET_REDIS_TIMEOUT_MS = 1_000;
/**
 * Hard cap on distinct clients held by the in-memory window. Expired entries
 * are swept first; past the cap the OLDEST window is evicted. Eviction errs
 * towards allowing (the evicted client starts a fresh window), never towards
 * refusing a client that has done nothing — and reaching it needs this many
 * distinct identities inside one window.
 */
const MEMORY_MAX_KEYS = 10_000;

interface RateLimitResult {
  allowed: boolean;
  /** Requests still available in the current window. */
  remaining: number;
  /** Epoch ms at which the window resets. */
  resetAt: number;
  /** Which tier answered — reported, never used to decide. */
  backend: 'upstash' | 'memory';
}

/* ── in-memory fallback ───────────────────────────────────────────────────── */

interface Window {
  count: number;
  resetAt: number;
}

const memory = new Map<string, Window>();
let memoryMaxKeys = MEMORY_MAX_KEYS;

/**
 * A fixed window per key. Bounded twice: expired entries are swept on write
 * (rather than by a timer this package has no right to own), and the number of
 * live keys is capped at `MEMORY_MAX_KEYS`, because "time-bounded" alone still
 * grows without limit when many distinct clients arrive inside one window.
 */
function checkInMemory(key: string, limit: number, windowMs: number, now: number): RateLimitResult {
  for (const [k, w] of memory) {
    if (w.resetAt <= now) memory.delete(k);
  }
  const existing = memory.get(key);
  if (!existing || existing.resetAt <= now) {
    if (!existing && memory.size >= memoryMaxKeys) {
      /* Map iteration is insertion order: the first key is the oldest window. */
      const oldest = memory.keys().next().value;
      if (oldest !== undefined) memory.delete(oldest);
    }
    const fresh = { count: 1, resetAt: now + windowMs };
    memory.set(key, fresh);
    return { allowed: true, remaining: limit - 1, resetAt: fresh.resetAt, backend: 'memory' };
  }
  existing.count += 1;
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
    backend: 'memory',
  };
}

/** Test seam — the module owns process-wide state, so a suite must be able to reset it. */
export function __resetRateLimiter(): void {
  memory.clear();
  memoryMaxKeys = MEMORY_MAX_KEYS;
  limiter = null;
  initialized = false;
  lastDowngradeWarn.clear();
}

/** Test seam — the number of client windows currently held in memory. */
export function __memoryKeyCount(): number {
  return memory.size;
}

/** Test seam — a small cap makes eviction ORDER observable without 10 000 calls.
    `__resetRateLimiter()` restores the production cap. */
export function __setMemoryMaxKeysForTest(max: number): void {
  memoryMaxKeys = max;
}

/* ── Upstash ──────────────────────────────────────────────────────────────── */

/**
 * The slice of `Ratelimit` this module uses. Declared so a suite can inject a
 * remote tier and prove the Redis path — the one production runs — rather than
 * only the fallback.
 */
export interface RemoteLimiter {
  limit(identifier: string): Promise<{
    success: boolean;
    remaining: number;
    reset: number;
    reason?: 'timeout' | 'cacheBlock' | 'denyList';
  }>;
}

let limiter: RemoteLimiter | null = null;
let initialized = false;

/*
 * P12 (2026-10-18 lane audit): when the remote tier cannot answer, the limit silently
 * becomes per-instance (no global bound). That is the documented fail-open, but it was
 * invisible. One warning per reason per window — the REASON only, never the client
 * identity (the IP is personal data; this app has no external sink, `reportError.ts`).
 */
type DowngradeReason = 'init-failed' | 'timeout' | 'unreachable';
const lastDowngradeWarn = new Map<DowngradeReason, number>();
function warnDowngrade(reason: DowngradeReason, now: number): void {
  const last = lastDowngradeWarn.get(reason);
  if (last !== undefined && now - last < MARKET_RATE_WINDOW_MS) return;
  lastDowngradeWarn.set(reason, now);
  Logger.warn('market rate limiter fell back to per-instance limits', { reason });
}

/** Test seam — install a remote tier (or `null` for "unconfigured"). */
export function __setRemoteLimiterForTest(remote: RemoteLimiter | null): void {
  limiter = remote;
  initialized = true;
}

function upstash(): RemoteLimiter | null {
  if (initialized) return limiter;
  initialized = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(MARKET_RATE_LIMIT, `${MARKET_RATE_WINDOW_MS} ms`),
      prefix: 'sandbox:market',
      timeout: MARKET_REDIS_TIMEOUT_MS,
    });
  } catch {
    /* A limiter that throws must not take the route down with it. */
    limiter = null;
    warnDowngrade('init-failed', Date.now());
  }
  return limiter;
}

/* ── the entry point ──────────────────────────────────────────────────────── */

/**
 * The client identity a limit is counted against.
 *
 * ⚑ `x-forwarded-for` IS CLIENT-SUPPLIED AND SPOOFABLE, so the Vercel-set
 * header is preferred and the first XFF hop is only a fallback. A missing
 * identity collapses to one shared bucket rather than to "unlimited" — an
 * unidentifiable caller is the case a limiter most needs to hold.
 */
export function clientKey(headers: Headers): string {
  const vercel = headers.get('x-real-ip');
  if (vercel) return vercel;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return 'unknown';
}

export async function checkMarketRateLimit(
  headers: Headers,
  now: number = Date.now()
): Promise<RateLimitResult> {
  const key = clientKey(headers);
  const remote = upstash();
  if (remote) {
    try {
      const result = await remote.limit(key);
      /* A timed-out answer is the library's fail-open default, not a verdict:
         the local window decides (see the header). */
      if (result.reason !== 'timeout') {
        return {
          allowed: result.success,
          remaining: result.remaining,
          resetAt: result.reset,
          backend: 'upstash',
        };
      }
      warnDowngrade('timeout', now);
    } catch {
      /* Redis unreachable mid-flight — fall through to the local window. */
      warnDowngrade('unreachable', now);
    }
  }
  return checkInMemory(key, MARKET_RATE_LIMIT, MARKET_RATE_WINDOW_MS, now);
}

/**
 * The refusal, shaped once so both market routes answer identically.
 *
 * ⚑ `no-store`, deliberately. The market routes are CDN-cached
 * (`MARKET_CACHE_CONTROL`); a cached 429 would refuse every other client from
 * the edge for the life of the entry — the same amplification the market lane
 * already guards against by keeping failures uncacheable.
 */
export function rateLimitedResponse(result: RateLimitResult): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return NextResponse.json(
    { error: 'RATE_LIMITED' },
    {
      status: 429,
      headers: {
        'retry-after': String(retryAfter),
        'cache-control': 'no-store',
        'x-ratelimit-limit': String(MARKET_RATE_LIMIT),
        'x-ratelimit-remaining': '0',
      },
    }
  );
}
