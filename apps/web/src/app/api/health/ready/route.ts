/**
 * Readiness Probe
 *
 * Checks that all required dependencies are reachable.
 * Returns 503 if any critical dependency is down.
 * Used by orchestrators and load balancers to route traffic.
 *
 * GET /api/health/ready
 */

import { NextResponse } from 'next/server';
import { pingRedis } from '@/lib/security/rateLimiter';

interface ReadyStatus {
  status: 'ready' | 'not_ready';
  checks: {
    redis: boolean;
  };
}

export async function GET(): Promise<NextResponse<ReadyStatus>> {
  try {
    const redisHealthy = await pingRedis();

    const ready = redisHealthy;
    const status: ReadyStatus = {
      status: ready ? 'ready' : 'not_ready',
      checks: {
        redis: redisHealthy,
      },
    };

    return NextResponse.json(status, { status: ready ? 200 : 503 });
  } catch {
    return NextResponse.json(
      { status: 'not_ready' as const, checks: { redis: false } },
      { status: 503 }
    );
  }
}
