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
import { checkRateLimit, RateLimitPresets, getClientIP, createRateLimitHeaders } from '@/lib/security/rateLimiter';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    server: boolean;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

// Track server start time for uptime calculation
const serverStartTime = Date.now();

export async function GET(request: NextRequest): Promise<NextResponse<HealthStatus | { error: string }>> {
  // Rate limiting - use lenient preset for health checks (monitoring services call frequently)
  const ip = getClientIP(request);
  const { limit, windowMs } = RateLimitPresets.lenient;
  const rateLimitResult = await checkRateLimit(`health:${ip}`, limit, windowMs);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  }

  const memoryUsage = process.memoryUsage();
  const heapUsed = memoryUsage.heapUsed;
  const heapTotal = memoryUsage.heapTotal;
  const memoryPercentage = Math.round((heapUsed / heapTotal) * 100);

  // Determine health status based on memory usage
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (memoryPercentage > 90) {
    status = 'unhealthy';
  } else if (memoryPercentage > 75) {
    status = 'degraded';
  }

  const healthStatus: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor((Date.now() - serverStartTime) / 1000), // seconds
    checks: {
      server: true,
      memory: {
        used: Math.round(heapUsed / 1024 / 1024), // MB
        total: Math.round(heapTotal / 1024 / 1024), // MB
        percentage: memoryPercentage,
      },
    },
  };

  // Return 503 for unhealthy status (helps load balancers)
  const httpStatus = status === 'unhealthy' ? 503 : 200;

  // Merge rate limit headers with response headers
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);
  const responseHeaders = new Headers({
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Content-Type': 'application/json',
  });
  rateLimitHeaders.forEach((value, key) => responseHeaders.set(key, value));

  return NextResponse.json(healthStatus, {
    status: httpStatus,
    headers: responseHeaders,
  });
}

// Also support HEAD requests for simple uptime checks
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  // Rate limiting for HEAD requests too
  const ip = getClientIP(request);
  const { limit, windowMs } = RateLimitPresets.lenient;
  const rateLimitResult = await checkRateLimit(`health-head:${ip}`, limit, windowMs);

  if (!rateLimitResult.success) {
    return new NextResponse(null, {
      status: 429,
      headers: createRateLimitHeaders(rateLimitResult),
    });
  }

  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);
  rateLimitHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  return new NextResponse(null, {
    status: 200,
    headers: rateLimitHeaders,
  });
}
