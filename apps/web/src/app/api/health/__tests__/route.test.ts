/**
 * Health endpoint — status-semantics regression tests (2026-07-11 fix).
 *
 * Production was flapping unhealthy/degraded because heap-percentage drove the
 * status: on serverless, V8 grows heapTotal lazily, so heapUsed/heapTotal
 * routinely exceeds 90% on a healthy warm instance — and the resulting 503s
 * would page any uptime monitor as DOWN. These tests pin the fixed semantics:
 *   database down  → unhealthy + 503
 *   redis down     → degraded + 200 (rate limiting fails open; site serves)
 *   both up        → healthy + 200, regardless of heap ratio
 * Memory remains telemetry-only in the authorized payload.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/api/routeHelpers', () => ({
  applyRateLimit: vi.fn().mockResolvedValue(null),
}));

const pingRedis = vi.fn();
const pingDatabase = vi.fn();
vi.mock('@/lib/security/rateLimiter', () => ({
  pingRedis: (...args: unknown[]) => pingRedis(...args),
}));
vi.mock('@/lib/database/client', () => ({
  pingDatabase: (...args: unknown[]) => pingDatabase(...args),
}));

import { GET } from '../route';

const makeRequest = (headers: Record<string, string> = {}) =>
  new NextRequest('https://diboas.com/api/health', { headers });

describe('GET /api/health — status semantics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return healthy 200 when database and redis are both up, regardless of heap ratio', async () => {
    pingDatabase.mockResolvedValue(true);
    pingRedis.mockResolvedValue(true);
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'healthy' });
  });

  it('should return degraded 200 when redis is down but the database is up', async () => {
    pingDatabase.mockResolvedValue(true);
    pingRedis.mockResolvedValue(false);
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'degraded' });
  });

  it('should return unhealthy 503 when the database is down', async () => {
    pingDatabase.mockResolvedValue(false);
    pingRedis.mockResolvedValue(true);
    const res = await GET(makeRequest());
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: 'unhealthy' });
  });

  it('should hide detailed system info from unauthenticated requests', async () => {
    pingDatabase.mockResolvedValue(true);
    pingRedis.mockResolvedValue(true);
    const body = await (await GET(makeRequest())).json();
    expect(body).not.toHaveProperty('checks');
    expect(body).not.toHaveProperty('uptime');
  });

  it('should include memory telemetry only for the internal-key-authorized payload', async () => {
    pingDatabase.mockResolvedValue(true);
    pingRedis.mockResolvedValue(true);
    process.env.INTERNAL_API_KEY = 'test-internal-key';
    const res = await GET(makeRequest({ authorization: 'Bearer test-internal-key' }));
    const body = await res.json();
    expect(body.status).toBe('healthy');
    expect(body.checks.memory.percentage).toBeGreaterThanOrEqual(0);
    delete process.env.INTERNAL_API_KEY;
  });
});
