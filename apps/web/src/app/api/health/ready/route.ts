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
import { pingDatabase } from '@/lib/database';

interface ReadyStatus {
  status: 'ready' | 'not_ready';
  checks: {
    redis: boolean;
    database: boolean;
  };
}

export async function GET(): Promise<NextResponse<ReadyStatus>> {
  try {
    const [redisHealthy, dbHealthy] = await Promise.all([
      pingRedis(),
      pingDatabase(),
    ]);

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
