/**
 * Waitlist Stats API Route
 *
 * Returns current waitlist statistics for display in social proof sections
 * and waitlist confirmation pages.
 *
 * Priority:
 * 1. Environment variables (manual override)
 * 2. Live store data
 * 3. Fallback values
 *
 * Security:
 * - Rate limiting (lenient: 100 requests/60s for read-only endpoint)
 *
 * Response caching: 5 minutes (revalidate for fresh data)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/lib/monitoring/Logger';
import { getTotalCount, getCurrentPositionCounter } from '@/lib/waitingList/store';
import { WAITLIST_STATS_FALLBACK, type WaitlistStats } from '@/config/waitlist-stats';
import {
  checkRateLimit,
  getClientIP,
  createRateLimitHeaders,
  RateLimitPresets,
} from '@/lib/security';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes

export async function GET(request: NextRequest): Promise<NextResponse<WaitlistStats>> {
  // Rate limiting (lenient preset for read-only endpoint)
  const clientIP = getClientIP(request);
  const rateLimitResult = await checkRateLimit(
    `stats:${clientIP}`,
    RateLimitPresets.lenient.limit,
    RateLimitPresets.lenient.windowMs
  );

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        count: WAITLIST_STATS_FALLBACK.count,
        countries: WAITLIST_STATS_FALLBACK.countries,
        source: 'fallback',
        lastUpdated: new Date().toISOString(),
      },
      { status: 429, headers: createRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    // Check for environment variable overrides first (manual control)
    const envCount = process.env.NEXT_PUBLIC_WAITLIST_COUNT;
    const envCountries = process.env.NEXT_PUBLIC_WAITLIST_COUNTRIES;

    if (envCount && envCountries) {
      return NextResponse.json({
        count: parseInt(envCount, 10),
        countries: parseInt(envCountries, 10),
        source: 'env',
        lastUpdated: new Date().toISOString(),
      });
    }

    // Get live data from store
    const storeCount = getTotalCount();
    const positionCounter = getCurrentPositionCounter();

    // Use position counter as count (more representative of total signups)
    // Store count only shows current entries, position counter shows all-time signups
    const actualCount = Math.max(storeCount, positionCounter);

    if (actualCount > 0) {
      return NextResponse.json({
        count: actualCount,
        // Countries: Use env override or fallback (we don't track countries in store yet)
        countries: envCountries
          ? parseInt(envCountries, 10)
          : WAITLIST_STATS_FALLBACK.countries,
        source: 'store',
        lastUpdated: new Date().toISOString(),
      });
    }

    // Fallback values
    return NextResponse.json({
      count: WAITLIST_STATS_FALLBACK.count,
      countries: WAITLIST_STATS_FALLBACK.countries,
      source: 'fallback',
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    Logger.error('Error fetching waitlist stats', {}, error instanceof Error ? error : undefined);

    // Return fallback on error
    return NextResponse.json({
      count: WAITLIST_STATS_FALLBACK.count,
      countries: WAITLIST_STATS_FALLBACK.countries,
      source: 'fallback',
      lastUpdated: new Date().toISOString(),
    });
  }
}
