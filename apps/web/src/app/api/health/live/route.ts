/**
 * Liveness Probe
 *
 * Minimal check: the process is running and can handle HTTP.
 * Used by orchestrators (Kubernetes, etc.) to detect hangs.
 * No dependency checks — those belong in the readiness probe.
 *
 * GET /api/health/live
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RateLimitPresets, getClientIP, createRateLimitHeaders } from '@/lib/security/rateLimiter';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIP(request);
    const { limit, windowMs } = RateLimitPresets.lenient;
    const rateLimitResult = await checkRateLimit(`health-live:${ip}`, limit, windowMs);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    return NextResponse.json({ status: 'alive' });
  } catch (error) {
    console.error('[health/live] Liveness probe error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Liveness check failed' },
      { status: 503 }
    );
  }
}
