/**
 * Readiness Probe
 *
 * Checks that all required dependencies are reachable.
 * Returns 503 if any critical dependency is down.
 * Used by orchestrators and load balancers to route traffic.
 *
 * GET /api/health/ready
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  RateLimitPresets,
  getClientIP,
  createRateLimitHeaders,
  pingRedis,
} from '@/lib/security/rateLimiter';
import { pingDatabase } from '@/lib/database';

interface ReadyStatus {
  status: 'ready' | 'not_ready';
  checks: {
    redis: boolean;
    database: boolean;
  };
}

export async function GET(request: NextRequest): Promise<NextResponse<ReadyStatus>> {
  try {
    const ip = getClientIP(request);
    const { limit, windowMs } = RateLimitPresets.lenient;
    const rateLimitResult = await checkRateLimit(`health-ready:${ip}`, limit, windowMs);

    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' } as unknown as ReadyStatus, {
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      });
    }

    const [redisHealthy, dbHealthy] = await Promise.all([pingRedis(), pingDatabase()]);

    const ready = redisHealthy && dbHealthy;
    const status: ReadyStatus = {
      status: ready ? 'ready' : 'not_ready',
      checks: {
        redis: redisHealthy,
        database: dbHealthy,
      },
    };

    return NextResponse.json(status, { status: ready ? 200 : 503 });
  } catch {
    return NextResponse.json(
      { status: 'not_ready' as const, checks: { redis: false, database: false } },
      { status: 503 }
    );
  }
}
