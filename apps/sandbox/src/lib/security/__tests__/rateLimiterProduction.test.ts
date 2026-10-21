import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * REQUIREMENT (CLAUDE.md: security utilities 100%; the 2026-10-18 lane audit): the
 * production setup path — the one Vercel runs — builds the Upstash limiter from the two
 * env vars with this app's prefix, window and timeout; a constructor that throws, a
 * timed-out answer, and an unreachable Redis all fall back to the per-instance window
 * WITHOUT taking the route down; and each fallback is logged once per window, carrying
 * the reason only — never the client identity. `__setRemoteLimiterForTest` (used by the
 * main suite) skips exactly this path, which is why it had no coverage.
 */
const ctorArgs: unknown[] = [];
let ctorThrows = false;
let limitImpl: () => Promise<unknown> = async () => ({ success: true, remaining: 9, reset: 1 });
const warn = vi.fn();

async function load() {
  vi.resetModules();
  vi.doMock('@upstash/redis', () => ({
    Redis: class {
      constructor(public opts: unknown) {}
    },
  }));
  vi.doMock('@upstash/ratelimit', () => {
    class Ratelimit {
      static slidingWindow = (n: number, w: string) => ({ n, w });
      constructor(opts: unknown) {
        if (ctorThrows) throw new Error('bad config');
        ctorArgs.push(opts);
      }
      limit = () => limitImpl();
    }
    return { Ratelimit };
  });
  vi.doMock('@/lib/monitoring/Logger', () => ({ Logger: { warn, error: vi.fn(), info: vi.fn() } }));
  return import('../rateLimiter');
}
const headers = () => new Headers({ 'x-real-ip': '203.0.113.7' });

beforeEach(() => {
  ctorArgs.length = 0;
  ctorThrows = false;
  limitImpl = async () => ({ success: true, remaining: 9, reset: 1 });
  warn.mockClear();
  vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.doUnmock('@upstash/redis');
  vi.doUnmock('@upstash/ratelimit');
  vi.doUnmock('@/lib/monitoring/Logger');
});

describe('rate limiter — the production (Upstash) setup path', () => {
  it('should build the remote limiter with this app’s prefix, window and timeout, and use it', async () => {
    const m = await load();
    const r = await m.checkMarketRateLimit(headers());
    expect(r.backend).toBe('upstash');
    expect(ctorArgs).toHaveLength(1);
    expect(ctorArgs[0]).toMatchObject({
      prefix: 'sandbox:market',
      timeout: 1_000,
      limiter: { n: m.MARKET_RATE_LIMIT, w: `${m.MARKET_RATE_WINDOW_MS} ms` },
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('should not build a remote tier when either env var is missing (local window only)', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    const m = await load();
    expect((await m.checkMarketRateLimit(headers())).backend).toBe('memory');
    expect(ctorArgs).toHaveLength(0);
  });

  it('should fall back to the local window when the constructor THROWS, and say why once', async () => {
    ctorThrows = true;
    const m = await load();
    expect((await m.checkMarketRateLimit(headers())).backend).toBe('memory');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![1]).toEqual({ reason: 'init-failed' });
  });

  it('should fall back on a TIMED-OUT answer and log it once per window, never with the IP', async () => {
    limitImpl = async () => ({ success: true, remaining: 0, reset: 0, reason: 'timeout' });
    const m = await load();
    const t0 = 1_000_000;
    expect((await m.checkMarketRateLimit(headers(), t0)).backend).toBe('memory');
    await m.checkMarketRateLimit(headers(), t0 + 1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(warn.mock.calls)).not.toContain('203.0.113.7');
    await m.checkMarketRateLimit(headers(), t0 + m.MARKET_RATE_WINDOW_MS);
    expect(warn).toHaveBeenCalledTimes(2); // a new window, a new line
  });

  it('should fall back when Redis is UNREACHABLE mid-flight', async () => {
    limitImpl = async () => {
      throw new Error('ECONNREFUSED');
    };
    const m = await load();
    expect((await m.checkMarketRateLimit(headers())).backend).toBe('memory');
    expect(warn.mock.calls[0]![1]).toEqual({ reason: 'unreachable' });
  });
});
