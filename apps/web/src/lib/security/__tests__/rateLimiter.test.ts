import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock external dependencies before any imports
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: vi.fn().mockImplementation(() => ({
    limit: vi.fn(),
  })),
}));

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    ping: vi.fn(),
  })),
}));

vi.mock('@/lib/monitoring/Logger', () => ({
  Logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/config/env', () => ({
  RATE_LIMIT_CONFIG: {
    strict: { limit: 5, windowMs: 60000 },
    standard: { limit: 20, windowMs: 60000 },
    lenient: { limit: 100, windowMs: 60000 },
    prefix: 'diboas:rl:',
  },
  IS_PRODUCTION: false,
}));

describe('rateLimiter', () => {
  beforeEach(() => {
    vi.resetModules();
    // Ensure no Redis env vars are set so we use in-memory fallback
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Helper to dynamically import the module with fresh state.
   */
  async function importModule() {
    return await import('../rateLimiter');
  }

  describe('In-memory rate limiting (no Redis)', () => {
    it('should allow requests under the limit', async () => {
      const { checkRateLimit } = await importModule();

      const result = await checkRateLimit('test-user', 5, 60000);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(5);
    });

    it('should block requests over the limit', async () => {
      const { checkRateLimit } = await importModule();

      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        await checkRateLimit('blocked-user', 5, 60000);
      }

      const result = await checkRateLimit('blocked-user', 5, 60000);

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.limit).toBe(5);
    });

    it('should reset after window expires', async () => {
      vi.useFakeTimers();
      const { checkRateLimit } = await importModule();

      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        await checkRateLimit('expiring-user', 5, 60000);
      }

      // Verify blocked
      const blockedResult = await checkRateLimit('expiring-user', 5, 60000);
      expect(blockedResult.success).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(60001);

      // Should be allowed again
      const result = await checkRateLimit('expiring-user', 5, 60000);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should return correct remaining count', async () => {
      const { checkRateLimit } = await importModule();

      const result1 = await checkRateLimit('count-user', 5, 60000);
      expect(result1.remaining).toBe(4);

      const result2 = await checkRateLimit('count-user', 5, 60000);
      expect(result2.remaining).toBe(3);

      const result3 = await checkRateLimit('count-user', 5, 60000);
      expect(result3.remaining).toBe(2);

      const result4 = await checkRateLimit('count-user', 5, 60000);
      expect(result4.remaining).toBe(1);

      const result5 = await checkRateLimit('count-user', 5, 60000);
      expect(result5.remaining).toBe(0);
    });

    it('should return correct reset timestamp', async () => {
      vi.useFakeTimers();
      const now = Date.now();
      const windowMs = 60000;

      const { checkRateLimit } = await importModule();

      const result = await checkRateLimit('reset-user', 5, windowMs);

      const expectedReset = Math.ceil((now + windowMs) / 1000);
      expect(result.reset).toBe(expectedReset);
    });

    it('should track different identifiers independently', async () => {
      const { checkRateLimit } = await importModule();

      // Exhaust limit for user-a
      for (let i = 0; i < 5; i++) {
        await checkRateLimit('user-a', 5, 60000);
      }

      const blockedResult = await checkRateLimit('user-a', 5, 60000);
      expect(blockedResult.success).toBe(false);

      // user-b should still be allowed
      const allowedResult = await checkRateLimit('user-b', 5, 60000);
      expect(allowedResult.success).toBe(true);
      expect(allowedResult.remaining).toBe(4);
    });
  });

  describe('getClientIP', () => {
    it('should extract first IP from x-forwarded-for', async () => {
      const { getClientIP } = await importModule();

      const request = new Request('http://localhost/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
        },
      });

      expect(getClientIP(request)).toBe('192.168.1.1');
    });

    it('should trim whitespace from x-forwarded-for IP', async () => {
      const { getClientIP } = await importModule();

      const request = new Request('http://localhost/test', {
        headers: {
          'x-forwarded-for': '  192.168.1.1  , 10.0.0.1',
        },
      });

      expect(getClientIP(request)).toBe('192.168.1.1');
    });

    it('should use x-real-ip as fallback', async () => {
      const { getClientIP } = await importModule();

      const request = new Request('http://localhost/test', {
        headers: {
          'x-real-ip': '10.0.0.5',
        },
      });

      expect(getClientIP(request)).toBe('10.0.0.5');
    });

    it('should prefer x-forwarded-for over x-real-ip', async () => {
      const { getClientIP } = await importModule();

      const request = new Request('http://localhost/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '10.0.0.5',
        },
      });

      expect(getClientIP(request)).toBe('192.168.1.1');
    });

    it('should return "unknown" when no IP headers are present', async () => {
      const { getClientIP } = await importModule();

      const request = new Request('http://localhost/test');

      expect(getClientIP(request)).toBe('unknown');
    });
  });

  describe('createRateLimitHeaders', () => {
    it('should set all rate limit headers', async () => {
      const { createRateLimitHeaders } = await importModule();

      const headers = createRateLimitHeaders({
        success: true,
        limit: 20,
        remaining: 15,
        reset: 1700000000,
      });

      expect(headers.get('X-RateLimit-Limit')).toBe('20');
      expect(headers.get('X-RateLimit-Remaining')).toBe('15');
      expect(headers.get('X-RateLimit-Reset')).toBe('1700000000');
    });

    it('should include Retry-After when rate limited', async () => {
      vi.useFakeTimers();
      const nowSeconds = Math.floor(Date.now() / 1000);
      const resetTime = nowSeconds + 30;

      const { createRateLimitHeaders } = await importModule();

      const headers = createRateLimitHeaders({
        success: false,
        limit: 5,
        remaining: 0,
        reset: resetTime,
      });

      expect(headers.get('Retry-After')).toBeDefined();
      const retryAfter = parseInt(headers.get('Retry-After')!, 10);
      expect(retryAfter).toBeGreaterThanOrEqual(0);
      expect(retryAfter).toBeLessThanOrEqual(30);
    });

    it('should not include Retry-After when not rate limited', async () => {
      const { createRateLimitHeaders } = await importModule();

      const headers = createRateLimitHeaders({
        success: true,
        limit: 20,
        remaining: 15,
        reset: 1700000000,
      });

      expect(headers.get('Retry-After')).toBeNull();
    });

    it('should set Retry-After to 0 when reset time is in the past', async () => {
      const { createRateLimitHeaders } = await importModule();

      const headers = createRateLimitHeaders({
        success: false,
        limit: 5,
        remaining: 0,
        reset: 0, // far in the past
      });

      expect(headers.get('Retry-After')).toBe('0');
    });
  });

  describe('RateLimitPresets', () => {
    it('should have strict preset', async () => {
      const { RateLimitPresets } = await importModule();

      expect(RateLimitPresets.strict).toEqual({
        limit: 5,
        windowMs: 60000,
      });
    });

    it('should have standard preset', async () => {
      const { RateLimitPresets } = await importModule();

      expect(RateLimitPresets.standard).toEqual({
        limit: 20,
        windowMs: 60000,
      });
    });

    it('should have lenient preset', async () => {
      const { RateLimitPresets } = await importModule();

      expect(RateLimitPresets.lenient).toEqual({
        limit: 100,
        windowMs: 60000,
      });
    });
  });

  describe('isRedisEnabled', () => {
    it('should return false when Redis env vars are not set', async () => {
      const { isRedisEnabled } = await importModule();

      expect(isRedisEnabled()).toBe(false);
    });

    it('should return false when only URL is set', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
      const { isRedisEnabled } = await importModule();

      expect(isRedisEnabled()).toBe(false);

      delete process.env.UPSTASH_REDIS_REST_URL;
    });
  });

  describe('pingRedis', () => {
    it('should return false when Redis is not configured', async () => {
      const { pingRedis } = await importModule();

      const result = await pingRedis();
      expect(result).toBe(false);
    });
  });
});
