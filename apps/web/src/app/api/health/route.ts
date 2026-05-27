/**
 * Health Check Endpoint
 *
 * Used by uptime monitoring services (BetterStack, etc.) to verify the application is running.
 * Returns a 200 OK response with system status information.
 *
 * Security: Rate limited to prevent abuse
 *
 * Usage: GET /api/health
 */

import { NextRequest, NextResponse } from 'next/server';
import { pingRedis } from '@/lib/security/rateLimiter';
import { pingDatabase } from '@/lib/database/client';
import { applyRateLimit } from '@/lib/api/routeHelpers';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    server: boolean;
    redis: boolean;
    database: boolean;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

// Track server start time for uptime calculation
const serverStartTime = Date.now();

export async function GET(
  request: NextRequest
): Promise<NextResponse<HealthStatus | { status: string } | { error: string }>> {
  try {
    const rateLimited = await applyRateLimit(request, 'health', 'lenient');
    if (rateLimited)
      return rateLimited as NextResponse<HealthStatus | { status: string } | { error: string }>;

    const [redisHealthy, dbHealthy, memoryUsage] = await Promise.all([
      pingRedis(),
      pingDatabase(),
      Promise.resolve(process.memoryUsage()),
    ]);

    const heapUsed = memoryUsage.heapUsed;
    const heapTotal = memoryUsage.heapTotal;
    const memoryPercentage = Math.round((heapUsed / heapTotal) * 100);

    // Determine health status based on memory usage and database connectivity
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (memoryPercentage > 90 || !dbHealthy) {
      status = 'unhealthy';
    } else if (memoryPercentage > 75) {
      status = 'degraded';
    }

    const httpStatus = status === 'unhealthy' ? 503 : 200;

    // Only return detailed system info when authenticated with internal API key.
    // Public requests get status-only (prevents infrastructure fingerprinting).
    const authHeader = request.headers.get('authorization');
    const internalKey = process.env.INTERNAL_API_KEY;
    const isAuthorized = internalKey && authHeader === `Bearer ${internalKey}`;

    if (!isAuthorized) {
      return NextResponse.json(
        { status },
        { status: httpStatus, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }

    const healthStatus: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor((Date.now() - serverStartTime) / 1000),
      checks: {
        server: true,
        redis: redisHealthy,
        database: dbHealthy,
        memory: {
          used: Math.round(heapUsed / 1024 / 1024),
          total: Math.round(heapTotal / 1024 / 1024),
          percentage: memoryPercentage,
        },
      },
    };

    return NextResponse.json(healthStatus, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Health check failed' }, { status: 503 });
  }
}

// Also support HEAD requests for simple uptime checks
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  try {
    const rateLimited = await applyRateLimit(request, 'health-head', 'lenient');
    if (rateLimited) return rateLimited;

    return new NextResponse(null, {
      status: 200,
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
