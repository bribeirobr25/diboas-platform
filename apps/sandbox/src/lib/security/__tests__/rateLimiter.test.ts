import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MARKET_RATE_LIMIT,
  MARKET_RATE_WINDOW_MS,
  __memoryKeyCount,
  __resetRateLimiter,
  __setMemoryMaxKeysForTest,
  __setRemoteLimiterForTest,
  checkMarketRateLimit,
  clientKey,
  rateLimitedResponse,
  type RemoteLimiter,
} from '../rateLimiter';
import { expectedLogs } from '@/test/expectedLogs';

// Failure paths below LOG by design (R-14); asserted, not silenced (2026-10-19 cleanup).
expectedLogs({
  strict: true,
  warn: ['market rate limiter fell back to per-instance limits'],
  requiredIn:
    /should fall back to the local window when Redis throws|should NOT trust a timed-out answer/,
});

/**
 * `5.213` · THE MARKET SEAM REFUSES.
 *
 * **Authority:** `SANDBOX_RULES` R-5 and the ratified `SANDBOX_SPEC_D-F`
 * (standing dependency FT-4). Measured 2026-09-25 before this landed: the
 * sandbox had **zero** rate limiting and **zero** Upstash dependency while
 * `/api/market` and `/api/market/history` were publicly reachable, each request
 * able to reach two external providers.
 *
 * ⚑ BOTH TIERS ARE PROVEN. The first block runs the in-memory tier (no Upstash
 * variables). The Redis block injects a remote tier through
 * `__setRemoteLimiterForTest`, because the deployed sandbox HAS the Upstash
 * variables (measured 2026-10-15, names only) — the Redis path is the one
 * production runs, so a suite that proved only the fallback would have proven
 * the path nobody runs. (This header previously claimed the opposite; that
 * premise was false and is corrected here — P0 review, PB-2.)
 */

const headersFor = (ip: string) => new Headers({ 'x-real-ip': ip });

beforeEach(() => {
  __resetRateLimiter();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});
afterEach(() => {
  __resetRateLimiter();
  vi.useRealTimers();
});

describe('5.213 · the limiter refuses past its limit', () => {
  it('should allow exactly the limit and refuse the next request', async () => {
    const h = headersFor('203.0.113.7');
    for (let i = 1; i <= MARKET_RATE_LIMIT; i += 1) {
      const r = await checkMarketRateLimit(h);
      expect(r.allowed, `request ${i} of ${MARKET_RATE_LIMIT} was refused`).toBe(true);
    }
    const over = await checkMarketRateLimit(h);
    expect(over.allowed, 'the limit was not enforced').toBe(false);
    expect(over.remaining).toBe(0);
  });

  it('should use the in-memory tier when Upstash is unconfigured — and still LIMIT', () => {
    /**
     * The property that matters most. An unconfigured Redis degrades the
     * limiter from distributed to per-instance; it must never degrade it to
     * absent, or the control would be off in exactly the deployment it was
     * written for.
     */
    return (async () => {
      const h = headersFor('198.51.100.4');
      let last = await checkMarketRateLimit(h);
      expect(last.backend).toBe('memory');
      for (let i = 0; i < MARKET_RATE_LIMIT + 5; i += 1) last = await checkMarketRateLimit(h);
      expect(last.allowed).toBe(false);
      expect(last.backend).toBe('memory');
    })();
  });

  it('should count each client separately', async () => {
    const a = headersFor('203.0.113.1');
    const b = headersFor('203.0.113.2');
    for (let i = 0; i <= MARKET_RATE_LIMIT; i += 1) await checkMarketRateLimit(a);
    expect((await checkMarketRateLimit(a)).allowed).toBe(false);
    expect((await checkMarketRateLimit(b)).allowed, 'one client exhausted another').toBe(true);
  });

  it('should let the window expire and allow again', async () => {
    const h = headersFor('203.0.113.9');
    const start = 1_000_000;
    for (let i = 0; i <= MARKET_RATE_LIMIT; i += 1) await checkMarketRateLimit(h, start);
    expect((await checkMarketRateLimit(h, start)).allowed).toBe(false);
    const after = start + MARKET_RATE_WINDOW_MS + 1;
    expect((await checkMarketRateLimit(h, after)).allowed, 'the window never reset').toBe(true);
  });

  it('should hold an UNIDENTIFIABLE caller in one shared bucket, never unlimited', async () => {
    /**
     * ⚑ The absence of an identity is the case a limiter most needs to hold.
     * Collapsing to `unknown` means many anonymous callers share one budget —
     * blunt, and correct. Treating a missing header as "no limit" would make
     * the control removable by deleting a header.
     */
    const anon = new Headers();
    expect(clientKey(anon)).toBe('unknown');
    let last = await checkMarketRateLimit(anon);
    for (let i = 0; i < MARKET_RATE_LIMIT + 2; i += 1) last = await checkMarketRateLimit(anon);
    expect(last.allowed).toBe(false);
  });

  it('should prefer the platform header over the spoofable one', () => {
    const both = new Headers({ 'x-real-ip': '203.0.113.5', 'x-forwarded-for': '9.9.9.9, 8.8.8.8' });
    expect(clientKey(both)).toBe('203.0.113.5');
    expect(clientKey(new Headers({ 'x-forwarded-for': '9.9.9.9, 8.8.8.8' }))).toBe('9.9.9.9');
  });

  /**
   * DOCUMENTS CURRENT BEHAVIOUR — not a policy (R4 T3, 2026-10-16). An IPv6
   * client is keyed by its FULL address, so two addresses in one /64 count as
   * two clients. Whether IPv6 traffic reaches the app, and what Vercel puts in
   * `x-real-ip` for it, is infrastructure behaviour that only a preview can
   * show. Changing the key (e.g. to a /64 prefix) is a rate-limit POLICY change
   * and is not authorized here; if it is ever made, this test changes with it.
   */
  it('should key an IPv6 client by its full address (current behaviour, documented)', () => {
    const a = clientKey(new Headers({ 'x-real-ip': '2001:db8:1:2::1' }));
    const b = clientKey(new Headers({ 'x-real-ip': '2001:db8:1:2::2' }));
    expect(a).toBe('2001:db8:1:2::1');
    expect(b, 'two addresses in one /64 are two clients today').not.toBe(a);
  });

  it('should cap the client windows held in memory and evict the OLDEST first (PB-2)', async () => {
    /**
     * Requirement: the fallback is bounded in SIZE, not only in time, and
     * eviction errs towards ALLOWING — it drops the oldest window, never a
     * newer client's count and never the whole map.
     */
    __setMemoryMaxKeysForTest(3);
    const now = 5_000_000;
    const [a, b, c, d] = ['10.0.0.1', '10.0.0.2', '10.0.0.3', '10.0.0.4'].map(headersFor);
    for (let i = 0; i <= MARKET_RATE_LIMIT; i += 1) await checkMarketRateLimit(a!, now);
    expect((await checkMarketRateLimit(a!, now)).allowed, 'A should be refused').toBe(false);
    await checkMarketRateLimit(b!, now);
    for (let i = 0; i <= MARKET_RATE_LIMIT; i += 1) await checkMarketRateLimit(c!, now);
    await checkMarketRateLimit(d!, now); // the 4th client: evicts A, the oldest
    expect(__memoryKeyCount()).toBe(3);
    expect((await checkMarketRateLimit(c!, now)).allowed, 'a newer window was evicted').toBe(false);
    expect((await checkMarketRateLimit(a!, now)).allowed, 'the oldest window survived').toBe(true);
  });
});

/** A remote tier whose answer the test controls. */
function remoteAnswering(answer: Awaited<ReturnType<RemoteLimiter['limit']>>): RemoteLimiter & {
  calls: number;
} {
  const fake = {
    calls: 0,
    async limit() {
      fake.calls += 1;
      return answer;
    },
  };
  return fake;
}

describe('5.213 · the Redis tier — the one production runs (PB-2)', () => {
  it("should honour Redis's refusal", async () => {
    __setRemoteLimiterForTest(
      remoteAnswering({ success: false, remaining: 0, reset: Date.now() + 20_000 })
    );
    const r = await checkMarketRateLimit(headersFor('203.0.113.20'));
    expect(r.backend).toBe('upstash');
    expect(r.allowed).toBe(false);
  });

  it("should honour Redis's allowance when it actually answered", async () => {
    __setRemoteLimiterForTest(
      remoteAnswering({ success: true, remaining: 12, reset: Date.now() + 20_000 })
    );
    const r = await checkMarketRateLimit(headersFor('203.0.113.21'));
    expect(r.backend).toBe('upstash');
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(12);
  });

  it('should NOT trust a timed-out answer — the library fails open there (PB-2)', async () => {
    /**
     * Requirement (R-5 / SANDBOX_SPEC_D-F FT-4): the seam is limited even when
     * Redis is slow. `@upstash/ratelimit` resolves `success: true,
     * reason: 'timeout'` on timeout; if that were trusted, a slow Redis would
     * mean NO limit. So the local window must decide — and refuse past it.
     */
    const remote = remoteAnswering({ success: true, remaining: 0, reset: 0, reason: 'timeout' });
    __setRemoteLimiterForTest(remote);
    const h = headersFor('203.0.113.22');
    let last = await checkMarketRateLimit(h);
    expect(last.backend).toBe('memory');
    for (let i = 0; i < MARKET_RATE_LIMIT + 3; i += 1) last = await checkMarketRateLimit(h);
    expect(last.allowed, 'a timed-out Redis answer let traffic through').toBe(false);
    expect(remote.calls).toBeGreaterThan(MARKET_RATE_LIMIT);
  });

  it('should fall back to the local window when Redis throws', async () => {
    __setRemoteLimiterForTest({
      async limit() {
        throw new Error('ECONNRESET');
      },
    });
    const h = headersFor('203.0.113.23');
    let last = await checkMarketRateLimit(h);
    expect(last.backend).toBe('memory');
    for (let i = 0; i < MARKET_RATE_LIMIT + 3; i += 1) last = await checkMarketRateLimit(h);
    expect(last.allowed).toBe(false);
  });
});

describe('5.213 · the refusal is shaped correctly', () => {
  it('should answer 429 with retry-after and no-store', () => {
    const response = rateLimitedResponse({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 30_000,
      backend: 'memory',
    });
    expect(response.status).toBe(429);
    /* The value, not just its sign: a 30 s reset must say 29–30 s
       (`Math.max(1, …)` made `> 0` true for any constant). */
    const retryAfter = Number(response.headers.get('retry-after'));
    expect(retryAfter).toBeGreaterThanOrEqual(29);
    expect(retryAfter).toBeLessThanOrEqual(30);
    /* A cached 429 would refuse every other client from the edge. */
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-ratelimit-remaining')).toBe('0');
  });
});
