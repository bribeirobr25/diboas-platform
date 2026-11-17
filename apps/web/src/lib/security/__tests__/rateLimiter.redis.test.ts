/**
 * Rate limiter — Redis-configured and production paths (5.70).
 *
 * Covers what the in-memory suites cannot: the Upstash-backed result mapping,
 * the health-check ping, Redis initialisation failures, and the dedicated
 * limiters' fail-closed contract in production (a missing Upstash env, an
 * init failure or a Redis error must BLOCK, never fall back to per-instance
 * memory). Upstash is mocked at the module boundary the limiter imports;
 * no network is used.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const state = vi.hoisted(() => ({
  isProduction: false,
  redisCtorError: null as unknown,
  ratelimitCtorError: null as unknown,
  ping: (() => Promise.resolve('PONG')) as () => Promise<unknown>,
  limit: (() => Promise.resolve(undefined)) as (identifier: string) => Promise<unknown>,
  ratelimitConfigs: [] as Array<{ prefix: string; limiter: unknown }>,
  limitCalls: [] as Array<{ limiter: unknown; prefix: string; identifier: string }>,
  emit: vi.fn(),
  emitThrows: false,
}));

vi.mock('@upstash/redis', () => {
  class MockRedis {
    constructor() {
      if (state.redisCtorError !== null) throw state.redisCtorError;
    }
    ping() {
      return state.ping();
    }
  }
  return { Redis: MockRedis };
});

vi.mock('@upstash/ratelimit', () => {
  class MockRatelimit {
    private readonly config: { prefix: string; limiter: unknown };
    constructor(config: { prefix: string; limiter: unknown }) {
      if (state.ratelimitCtorError !== null) throw state.ratelimitCtorError;
      state.ratelimitConfigs.push(config);
      this.config = config;
    }
    limit(identifier: string) {
      state.limitCalls.push({
        limiter: this.config.limiter,
        prefix: this.config.prefix,
        identifier,
      });
      return state.limit(identifier);
    }
    static slidingWindow(limit: number, window: string) {
      return `sliding:${limit}:${window}`;
    }
  }
  return { Ratelimit: MockRatelimit };
});

vi.mock('@/config/env', () => ({
  RATE_LIMIT_CONFIG: {
    strict: { limit: 5, windowMs: 60000 },
    standard: { limit: 20, windowMs: 60000 },
    lenient: { limit: 100, windowMs: 60000 },
    prefix: 'diboas:rl:',
  },
  get IS_PRODUCTION() {
    return state.isProduction;
  },
}));

vi.mock('@/lib/events/ApplicationEventBus', () => ({
  applicationEventBus: {
    emit: (...args: unknown[]) => {
      if (state.emitThrows) throw new Error('event bus down');
      return state.emit(...args);
    },
  },
  ApplicationEventType: { APPLICATION_ERROR: 'application:error' },
}));

async function importFresh() {
  const limiter = await import('../rateLimiter');
  const { Logger } = await import('@/lib/monitoring/Logger');
  return { ...limiter, Logger };
}

function withRedisEnv(): void {
  vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.test');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
}

function withoutRedisEnv(): void {
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
}

const FIXED_NOW = new Date('2026-11-10T12:00:00.000Z');

describe('rateLimiter — Redis and production paths', () => {
  beforeEach(() => {
    vi.resetModules();
    state.isProduction = false;
    state.redisCtorError = null;
    state.ratelimitCtorError = null;
    state.ping = () => Promise.resolve('PONG');
    state.limit = () => Promise.resolve(undefined);
    state.ratelimitConfigs = [];
    state.limitCalls = [];
    state.emit = vi.fn();
    state.emitThrows = false;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  describe('initialisation', () => {
    it('should warn about the in-memory fallback when Upstash is not configured in production', async () => {
      withoutRedisEnv();
      state.isProduction = true;
      const { isRedisEnabled, Logger } = await importFresh();

      expect(isRedisEnabled()).toBe(false);
      expect(Logger.warn).toHaveBeenCalledWith(
        '[RateLimiter] Upstash Redis not configured, using in-memory fallback'
      );
    });

    it('should stay silent about the fallback when Upstash is not configured outside production', async () => {
      withoutRedisEnv();
      const { isRedisEnabled, Logger } = await importFresh();

      expect(isRedisEnabled()).toBe(false);
      expect(Logger.warn).not.toHaveBeenCalled();
    });

    it('should report Redis enabled and build the IP limiter from config when Upstash is configured', async () => {
      withRedisEnv();
      const { isRedisEnabled } = await importFresh();

      expect(isRedisEnabled()).toBe(true);
      expect(state.ratelimitConfigs).toContainEqual(
        expect.objectContaining({ prefix: 'diboas:rl:', limiter: 'sliding:5:60000ms' })
      );
    });

    it('should report Redis disabled and log the message when the Redis client throws an Error', async () => {
      withRedisEnv();
      state.redisCtorError = new Error('bad url');
      const { isRedisEnabled, Logger } = await importFresh();

      expect(isRedisEnabled()).toBe(false);
      expect(Logger.error).toHaveBeenCalledWith('[RateLimiter] Failed to initialize Redis:', {
        error: 'bad url',
      });
    });

    it('should log the stringified value when the Redis client throws a non-Error', async () => {
      withRedisEnv();
      state.redisCtorError = 'raw init failure';
      const { isRedisEnabled, Logger } = await importFresh();

      expect(isRedisEnabled()).toBe(false);
      expect(Logger.error).toHaveBeenCalledWith('[RateLimiter] Failed to initialize Redis:', {
        error: 'raw init failure',
      });
    });
  });

  describe('pingRedis', () => {
    it('should return true when Redis answers PONG', async () => {
      withRedisEnv();
      const { pingRedis } = await importFresh();

      expect(await pingRedis()).toBe(true);
    });

    it('should return false when Redis answers anything other than PONG', async () => {
      withRedisEnv();
      state.ping = () => Promise.resolve('LOADING');
      const { pingRedis } = await importFresh();

      expect(await pingRedis()).toBe(false);
    });

    it('should return false when the ping rejects', async () => {
      withRedisEnv();
      state.ping = () => Promise.reject(new Error('ECONNREFUSED'));
      const { pingRedis } = await importFresh();

      expect(await pingRedis()).toBe(false);
    });

    it('should return false after 5 seconds when the ping never settles', async () => {
      vi.useFakeTimers();
      withRedisEnv();
      state.ping = () => new Promise(() => {});
      const { pingRedis } = await importFresh();

      const pending = pingRedis();
      await vi.advanceTimersByTimeAsync(4999);
      let settled = false;
      void pending.then(() => {
        settled = true;
      });
      await Promise.resolve();
      expect(settled).toBe(false);

      await vi.advanceTimersByTimeAsync(1);
      expect(await pending).toBe(false);
    });
  });

  /* Visual pass 2026-11-11: one Upstash instance, built with the strict policy, answered every
   * caller, so "lenient" (100 a minute) routes got 5 a minute in production. */
  describe('checkRateLimit applies each caller’s own policy', () => {
    it('should answer a lenient call from a 100-a-minute limiter with its own prefix when Redis answers', async () => {
      withRedisEnv();
      state.limit = () => Promise.resolve({ success: true, limit: 100, remaining: 99, reset: 0 });
      const { checkRateLimit, RateLimitPresets } = await importFresh();
      const { limit, windowMs } = RateLimitPresets.lenient;

      await checkRateLimit('consent-check:203.0.113.9', limit, windowMs);
      expect(state.limitCalls).toEqual([
        {
          limiter: 'sliding:100:60000ms',
          prefix: 'diboas:rl:100/60000:',
          identifier: 'consent-check:203.0.113.9',
        },
      ]);
    });

    it('should reuse one limiter per policy and keep the strict default on its original prefix', async () => {
      withRedisEnv();
      state.limit = () => Promise.resolve({ success: true, limit: 0, remaining: 0, reset: 0 });
      const { checkRateLimit } = await importFresh();

      await checkRateLimit('a', 100, 60000);
      await checkRateLimit('b', 100, 60000);
      await checkRateLimit('c', 20, 60000);
      await checkRateLimit('d');
      expect(state.limitCalls.map((c) => [c.identifier, c.limiter, c.prefix])).toEqual([
        ['a', 'sliding:100:60000ms', 'diboas:rl:100/60000:'],
        ['b', 'sliding:100:60000ms', 'diboas:rl:100/60000:'],
        ['c', 'sliding:20:60000ms', 'diboas:rl:20/60000:'],
        ['d', 'sliding:5:60000ms', 'diboas:rl:'],
      ]);
      // the default instance plus one per extra policy, never one per call
      expect(state.ratelimitConfigs).toHaveLength(3);
    });

    it('should fall back to memory with the caller’s policy when building a policy limiter fails', async () => {
      withRedisEnv();
      const { checkRateLimit } = await importFresh();
      state.ratelimitCtorError = new Error('refused');
      const first = await checkRateLimit('e', 2, 60000);
      expect(first).toMatchObject({ success: true, limit: 2, remaining: 1 });
      await checkRateLimit('e', 2, 60000);
      expect((await checkRateLimit('e', 2, 60000)).success).toBe(false);
    });
  });

  describe('checkRateLimit with Upstash', () => {
    it('should map the Upstash result and convert the reset to whole seconds when Redis answers', async () => {
      withRedisEnv();
      state.limit = () =>
        Promise.resolve({ success: false, limit: 5, remaining: 0, reset: 1_700_000_000_500 });
      const { checkRateLimit } = await importFresh();

      expect(await checkRateLimit('203.0.113.1')).toEqual({
        success: false,
        limit: 5,
        remaining: 0,
        reset: 1_700_000_001,
      });
    });

    it('should emit a high-severity APPLICATION_ERROR when Redis fails with a non-Error', async () => {
      withRedisEnv();
      state.limit = () => Promise.reject('socket closed');
      const { checkRateLimit, Logger } = await importFresh();

      const result = await checkRateLimit('203.0.113.2', 5, 60000);

      expect(result).toEqual(expect.objectContaining({ success: true, remaining: 4, limit: 5 }));
      expect(Logger.error).toHaveBeenCalledWith(
        '[RateLimiter] Redis rate limit failed, using in-memory fallback',
        { error: 'socket closed' }
      );
      expect(state.emit).toHaveBeenCalledWith(
        'application:error',
        expect.objectContaining({
          source: 'rateLimiter',
          severity: 'high',
          metadata: { operation: 'redis_fallback_activated' },
          error: expect.objectContaining({ message: 'socket closed' }),
        })
      );
      const emitted = state.emit.mock.calls[0][1] as { error: unknown };
      expect(emitted.error).toBeInstanceOf(Error);
    });

    it('should pass the original Error to the event bus when Redis fails with an Error', async () => {
      withRedisEnv();
      const failure = new Error('READONLY');
      state.limit = () => Promise.reject(failure);
      const { checkRateLimit } = await importFresh();

      await checkRateLimit('203.0.113.3', 5, 60000);

      const emitted = state.emit.mock.calls[0][1] as { error: unknown };
      expect(emitted.error).toBe(failure);
    });

    it('should still answer from memory when the event bus itself throws during the fallback', async () => {
      withRedisEnv();
      state.limit = () => Promise.reject(new Error('down'));
      state.emitThrows = true;
      const { checkRateLimit } = await importFresh();

      await expect(checkRateLimit('203.0.113.4', 5, 60000)).resolves.toEqual(
        expect.objectContaining({ success: true, remaining: 4 })
      );
    });
  });

  describe('dedicated limiters (F8 / F9) — fail closed in production', () => {
    it('should block when Upstash is not configured in production', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(FIXED_NOW);
      withoutRedisEnv();
      state.isProduction = true;
      const { checkOutboundEmailRateLimit, checkMonitoringTunnelRateLimit } = await importFresh();

      expect(await checkOutboundEmailRateLimit('hash-1')).toEqual({
        success: false,
        limit: 2,
        remaining: 0,
        reset: Math.ceil((FIXED_NOW.getTime() + 5 * 60 * 1000) / 1000),
      });
      expect(await checkMonitoringTunnelRateLimit('198.51.100.1')).toEqual({
        success: false,
        limit: 1000,
        remaining: 0,
        reset: Math.ceil((FIXED_NOW.getTime() + 60 * 1000) / 1000),
      });
    });

    it('should block when the dedicated limiter fails to initialise in production', async () => {
      withRedisEnv();
      state.isProduction = true;
      state.ratelimitCtorError = new Error('init refused');
      const { checkOutboundEmailRateLimit, Logger } = await importFresh();

      const result = await checkOutboundEmailRateLimit('hash-2');

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(Logger.error).toHaveBeenCalledWith(
        "[RateLimiter] Failed to init dedicated limiter 'signup:email:'",
        { error: 'init refused' }
      );
    });

    it('should block when Redis errors in production', async () => {
      withRedisEnv();
      state.isProduction = true;
      state.limit = () => Promise.reject(new Error('ETIMEDOUT'));
      const { checkMonitoringTunnelRateLimit, Logger } = await importFresh();

      const result = await checkMonitoringTunnelRateLimit('198.51.100.2');

      expect(result.success).toBe(false);
      expect(result.limit).toBe(1000);
      expect(Logger.error).toHaveBeenCalledWith(
        "[RateLimiter] Dedicated limiter 'monitoring:tunnel:' failed",
        { error: 'ETIMEDOUT' }
      );
    });

    it('should block every call, including the first, when Redis errors in production', async () => {
      withRedisEnv();
      state.isProduction = true;
      state.limit = () => Promise.reject(new Error('down'));
      const { checkOutboundEmailRateLimit } = await importFresh();

      const results = await Promise.all([
        checkOutboundEmailRateLimit('hash-3'),
        checkOutboundEmailRateLimit('hash-3'),
      ]);

      expect(results.map((r) => r.success)).toEqual([false, false]);
    });
  });

  describe('dedicated limiters — Upstash answers and dev/test fallback', () => {
    it('should map the Upstash result and build each limiter with its own policy when Redis answers', async () => {
      withRedisEnv();
      state.limit = () =>
        Promise.resolve({ success: true, limit: 2, remaining: 1, reset: 1_700_000_000_001 });
      const { checkOutboundEmailRateLimit } = await importFresh();

      expect(await checkOutboundEmailRateLimit('hash-4')).toEqual({
        success: true,
        limit: 2,
        remaining: 1,
        reset: 1_700_000_001,
      });
      expect(state.ratelimitConfigs).toContainEqual({
        redis: expect.anything(),
        limiter: 'sliding:2:300000ms',
        analytics: false,
        prefix: 'signup:email:',
      });
    });

    it('should fall back to the in-memory limiter with the same policy when Redis errors outside production', async () => {
      withRedisEnv();
      state.limit = () => Promise.reject('raw redis failure');
      const { checkOutboundEmailRateLimit, Logger } = await importFresh();

      const first = await checkOutboundEmailRateLimit('hash-5');
      const second = await checkOutboundEmailRateLimit('hash-5');
      const third = await checkOutboundEmailRateLimit('hash-5');

      expect([first.success, second.success, third.success]).toEqual([true, true, false]);
      expect(Logger.error).toHaveBeenCalledWith(
        "[RateLimiter] Dedicated limiter 'signup:email:' failed",
        { error: 'raw redis failure' }
      );
    });

    it('should fall back to the in-memory limiter and log the stringified value when init throws a non-Error outside production', async () => {
      withRedisEnv();
      state.ratelimitCtorError = 'raw ctor failure';
      const { checkMonitoringTunnelRateLimit, Logger } = await importFresh();

      const result = await checkMonitoringTunnelRateLimit('198.51.100.3');

      expect(result).toEqual(expect.objectContaining({ success: true, remaining: 999 }));
      expect(Logger.error).toHaveBeenCalledWith(
        "[RateLimiter] Failed to init dedicated limiter 'monitoring:tunnel:'",
        { error: 'raw ctor failure' }
      );
    });

    it('should namespace the in-memory fallback by prefix so the two limiters never share a counter', async () => {
      withoutRedisEnv();
      const { checkOutboundEmailRateLimit, checkMonitoringTunnelRateLimit } = await importFresh();

      await checkOutboundEmailRateLimit('same-id');
      await checkOutboundEmailRateLimit('same-id');
      const emailBlocked = await checkOutboundEmailRateLimit('same-id');
      const tunnel = await checkMonitoringTunnelRateLimit('same-id');

      expect(emailBlocked.success).toBe(false);
      expect(tunnel).toEqual(expect.objectContaining({ success: true, remaining: 999 }));
    });
  });
});
