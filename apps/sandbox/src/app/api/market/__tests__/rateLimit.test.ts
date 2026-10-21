import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  MARKET_RATE_LIMIT,
  __resetRateLimiter,
  checkMarketRateLimit,
} from '@/lib/security/rateLimiter';
import { marketUpstream } from '@/test/marketUpstream';

/**
 * `5.213` · THE ROUTE REFUSES, AND REFUSES BEFORE IT SPENDS ANYTHING.
 *
 * The limiter's own behaviour is proven in
 * `src/lib/security/__tests__/rateLimiter.test.ts`. What this file adds is the
 * wiring claim, which is the one that actually protects the live seam: that the
 * guard sits AHEAD of every provider call. A limiter placed after the fetch has
 * limited nothing that costs anything — the request still reached DeFiLlama and
 * CoinGecko, which is the whole reason `5.213` exists.
 */

const hoisted = vi.hoisted(() => ({ providerCalls: 0, throwNext: false }));

/**
 * ⚑ THE REAL FACTORY, WRAPPED TO COUNT — NOT REPLACED.
 * A first version substituted providers returning empty arrays and the route
 * answered **503**, because it fails closed on absent market data. That is the
 * route working correctly, and it would have made this file assert the limiter
 * against a broken baseline. Delegating to the real fixture-backed factory
 * keeps the 200 path honest while still counting whether a provider was
 * reached at all.
 */
vi.mock('@/lib/market/factory', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/market/factory')>();
  return {
    ...actual,
    getApyProvider: () => {
      hoisted.providerCalls += 1;
      if (hoisted.throwNext) {
        hoisted.throwNext = false;
        throw new Error('factory failed');
      }
      return actual.getApyProvider();
    },
    getPriceProvider: () => {
      hoisted.providerCalls += 1;
      return actual.getPriceProvider();
    },
    getGasProvider: () => {
      hoisted.providerCalls += 1;
      return actual.getGasProvider();
    },
  };
});

vi.mock('@/lib/evidence/ingest', () => ({ ingestNetworkCosts: async () => [] }));

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();
  return { ...actual, after: () => undefined };
});

const request = () =>
  new NextRequest(new URL('http://localhost/api/market'), {
    headers: { 'x-real-ip': '203.0.113.44' },
  });

beforeEach(() => {
  __resetRateLimiter();
  hoisted.providerCalls = 0;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  /* `5.578`: the upstreams are faked; the factory is still the real one, wrapped to count. */
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown) => marketUpstream(String(input), Date.now()))
  );
});
afterEach(() => {
  __resetRateLimiter();
  vi.unstubAllGlobals();
});

describe('GET /api/market — 5.213 rate limit', () => {
  it('should serve a normal request (the limiter does not break the route)', async () => {
    const { GET } = await import('../route');
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(hoisted.providerCalls, 'the providers were never reached').toBeGreaterThan(0);
  });

  it('should answer 429 once the client has exhausted its window', async () => {
    const headers = new Headers({ 'x-real-ip': '203.0.113.44' });
    /* Exhaust the budget through the limiter itself, then make ONE real call. */
    for (let i = 0; i <= MARKET_RATE_LIMIT; i += 1) await checkMarketRateLimit(headers);

    hoisted.providerCalls = 0;
    const { GET } = await import('../route');
    const response = await GET(request());

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: 'RATE_LIMITED' });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(Number(response.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(hoisted.providerCalls, 'the route reached a provider despite being rate limited').toBe(
      0
    );
  });
});

describe('GET /api/market/history — 5.213 rate limit (PB-2)', () => {
  /**
   * The history route is the expensive one (`?days=` 1–730 is a cache-key
   * dimension, so misses are cheap to force). Requirement as above: the guard
   * sits AHEAD of every provider call — proven here for this route too, not
   * inferred from its sibling.
   */
  const historyRequest = () =>
    new NextRequest(new URL('http://localhost/api/market/history?days=30'), {
      headers: { 'x-real-ip': '203.0.113.45' },
    });

  it('should answer 429 without reaching any provider once the window is exhausted', async () => {
    const headers = new Headers({ 'x-real-ip': '203.0.113.45' });
    for (let i = 0; i <= MARKET_RATE_LIMIT; i += 1) await checkMarketRateLimit(headers);

    hoisted.providerCalls = 0;
    const { GET } = await import('../history/route');
    const response = await GET(historyRequest());

    expect(response.status).toBe(429);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(hoisted.providerCalls, 'history reached a provider despite being rate limited').toBe(0);
  });

  it('should serve a normal history request', async () => {
    const { GET } = await import('../history/route');
    const response = await GET(historyRequest());
    expect(response.status).toBe(200);
    expect(hoisted.providerCalls).toBeGreaterThan(0);
  });
});

/**
 * REQUIREMENT (R-14 / P12; 2026-10-18 lane audit): an unexpected error inside either
 * market route still answers 503 with the error cache header — and is LOGGED with its
 * cause, never swallowed. The client identity is not in the log.
 */
describe('market routes — an unexpected error is logged, not swallowed', () => {
  for (const [route, url, ip] of [
    ['../route', 'http://localhost/api/market', '203.0.113.46'],
    ['../history/route', 'http://localhost/api/market/history?days=30', '203.0.113.47'],
  ] as const) {
    it(`should answer 503 and log the cause (${route})`, async () => {
      const err = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        hoisted.throwNext = true;
        const { GET } = await import(route);
        const response = await GET(new NextRequest(new URL(url), { headers: { 'x-real-ip': ip } }));
        expect(response.status).toBe(503);
        expect(err).toHaveBeenCalledTimes(1);
        expect(JSON.stringify(err.mock.calls[0])).toContain('factory failed');
        expect(JSON.stringify(err.mock.calls)).not.toContain(ip);
      } finally {
        hoisted.throwNext = false;
        err.mockRestore();
      }
    });
  }
});
