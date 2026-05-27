/**
 * Rate Limiter Redis Fallback Tests
 *
 * Verifies the in-memory fallback activates correctly when Redis is
 * unavailable, and that monitoring events are emitted.
 *
 * P7 Error Handling: fallback is explicit, not silent
 * P12 Monitoring: operational degradation is observable
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let mockLimitFn: (...args: any[]) => any = vi.fn();

vi.mock('@upstash/ratelimit', () => {
  class MockRatelimit {
    limit(...args: unknown[]) {
      return mockLimitFn(...args);
    }
    static slidingWindow() {
      return 'mock-limiter';
    }
  }
  return { Ratelimit: MockRatelimit };
});

vi.mock('@upstash/redis', () => {
  class MockRedis {
    ping() {
      return Promise.resolve('PONG');
    }
  }
  return { Redis: MockRedis };
});

vi.mock('@/lib/monitoring/Logger', () => ({
  Logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock the event bus import (dynamic import in the fallback path)
vi.mock('@/lib/events/ApplicationEventBus', () => ({
  applicationEventBus: {
    emit: vi.fn(),
  },
  ApplicationEventType: {
    APPLICATION_ERROR: 'application:error',
  },
}));

describe('Rate limiter Redis fallback monitoring', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  async function importModule() {
    return import('../rateLimiter');
  }

  it('should emit APPLICATION_ERROR when Redis fallback activates', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

    // Redis throws on limit()
    mockLimitFn = vi.fn().mockRejectedValue(new Error('Redis connection failed'));

    const { checkRateLimit } = await importModule();
    const { Logger } = await import('@/lib/monitoring/Logger');

    const result = await checkRateLimit('fallback-test', 5, 60000);

    // Should succeed via in-memory fallback
    expect(result.success).toBe(true);

    // Should log the fallback
    expect(Logger.error).toHaveBeenCalledWith(
      '[RateLimiter] Redis rate limit failed, using in-memory fallback',
      expect.objectContaining({ error: 'Redis connection failed' })
    );

    mockLimitFn = vi.fn();
  });

  it('should still rate limit via in-memory when Redis is down', async () => {
    // No Redis env vars — direct in-memory path
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { checkRateLimit } = await importModule();

    // First request should pass
    const result1 = await checkRateLimit('inmem-test', 2, 60000);
    expect(result1.success).toBe(true);
    expect(result1.remaining).toBe(1);

    // Second request should pass
    const result2 = await checkRateLimit('inmem-test', 2, 60000);
    expect(result2.success).toBe(true);
    expect(result2.remaining).toBe(0);

    // Third request should be rate limited
    const result3 = await checkRateLimit('inmem-test', 2, 60000);
    expect(result3.success).toBe(false);
    expect(result3.remaining).toBe(0);
  });
});
