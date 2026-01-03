/**
 * Health Check Endpoint
 *
 * Used by uptime monitoring services (BetterStack, etc.) to verify the application is running.
 * Returns a 200 OK response with system status information.
 *
 * Usage: GET /api/health
 */

import { NextResponse } from 'next/server';

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

export async function GET(): Promise<NextResponse<HealthStatus>> {
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

  return NextResponse.json(healthStatus, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Content-Type': 'application/json',
    },
  });
}

// Also support HEAD requests for simple uptime checks
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
