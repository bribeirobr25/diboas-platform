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
import {
  getTotalCount,
  getCurrentPositionCounter,
  getFoundingMemberCount,
  getDistinctCountryCount,
} from '@/lib/waitingList/store';
import {
  WAITLIST_STATS_FALLBACK,
  WAITLIST_STATS_FALLBACK_B2B,
  type WaitlistStats,
} from '@/config/waitlist-stats';
import {
  checkRateLimit,
  getClientIP,
  createRateLimitHeaders,
  RateLimitPresets,
} from '@/lib/security';

export const dynamic = 'force-dynamic';

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
};

export async function GET(request: NextRequest): Promise<NextResponse<WaitlistStats>> {
  // Support cache bypass for real-time accuracy after signup
  const noCache = request.nextUrl.searchParams.get('fresh') === '1';
  const responseHeaders = noCache ? { 'Cache-Control': 'no-store' } : CACHE_HEADERS;

  // Optional source filter for audience-specific stats (e.g., ?source=landing_b2b)
  const VALID_SOURCES = ['landing_b2c', 'landing_b2b'] as const;
  type ValidSource = (typeof VALID_SOURCES)[number];
  const rawSource = request.nextUrl.searchParams.get('source');
  const sourceParam: ValidSource | null =
    rawSource && (VALID_SOURCES as readonly string[]).includes(rawSource)
      ? (rawSource as ValidSource)
      : null;

  // Rate limiting (lenient preset for read-only endpoint)
  const clientIP = getClientIP(request);
  const rateLimitResult = await checkRateLimit(
    `stats:${clientIP}`,
    RateLimitPresets.lenient.limit,
    RateLimitPresets.lenient.windowMs
  );

  if (!rateLimitResult.success) {
    const rlFallback =
      sourceParam === 'landing_b2b' ? WAITLIST_STATS_FALLBACK_B2B : WAITLIST_STATS_FALLBACK;
    return NextResponse.json(
      {
        count: rlFallback.count,
        countries: rlFallback.countries,
        source: 'fallback',
        lastUpdated: new Date().toISOString(),
        foundingMemberCount: rlFallback.foundingMemberCount,
        foundingMemberCap: rlFallback.foundingMemberCap,
        foundingMemberSpotsRemaining: rlFallback.foundingMemberSpotsRemaining,
      },
      { status: 429, headers: createRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    // Founding member data — audience-specific when source is provided
    const foundingMember = await getFoundingMemberCount(sourceParam || undefined);
    const foundingMemberFields = {
      foundingMemberCount: foundingMember.count,
      foundingMemberCap: foundingMember.cap,
      foundingMemberSpotsRemaining: Math.max(0, foundingMember.cap - foundingMember.count),
    };

    // Check for environment variable overrides first (manual control)
    const envCount = process.env.NEXT_PUBLIC_WAITLIST_COUNT;
    const envCountries = process.env.NEXT_PUBLIC_WAITLIST_COUNTRIES;

    if (envCount && envCountries) {
      return NextResponse.json(
        {
          count: parseInt(envCount, 10),
          countries: parseInt(envCountries, 10),
          source: 'env',
          lastUpdated: new Date().toISOString(),
          ...foundingMemberFields,
        },
        { headers: responseHeaders }
      );
    }

    // Get live data from store (all async, parallel fetch)
    // When source is provided, filter counts to that audience
    const [storeCount, positionCounter, countryCount] = await Promise.all([
      getTotalCount(sourceParam || undefined),
      sourceParam ? getTotalCount(sourceParam) : getCurrentPositionCounter(),
      getDistinctCountryCount(sourceParam || undefined),
    ]);

    // Use position counter as count (more representative of total signups)
    // Store count only shows current entries, position counter shows all-time signups
    const actualCount = Math.max(storeCount, positionCounter);

    if (actualCount > 0) {
      return NextResponse.json(
        {
          count: actualCount,
          // Countries: env override > live distinct count > fallback
          countries: envCountries
            ? parseInt(envCountries, 10)
            : countryCount || WAITLIST_STATS_FALLBACK.countries,
          source: 'store',
          lastUpdated: new Date().toISOString(),
          ...foundingMemberFields,
        },
        { headers: responseHeaders }
      );
    }

    // Fallback values
    return NextResponse.json(
      {
        count: WAITLIST_STATS_FALLBACK.count,
        countries: WAITLIST_STATS_FALLBACK.countries,
        source: 'fallback',
        lastUpdated: new Date().toISOString(),
        ...foundingMemberFields,
      },
      { headers: responseHeaders }
    );
  } catch (error) {
    Logger.error('Error fetching waitlist stats', {}, error instanceof Error ? error : undefined);

    // Return fallback on error — include founding member fields so the 3rd social proof card renders
    const fallback =
      sourceParam === 'landing_b2b' ? WAITLIST_STATS_FALLBACK_B2B : WAITLIST_STATS_FALLBACK;
    return NextResponse.json({
      count: fallback.count,
      countries: fallback.countries,
      source: 'fallback',
      lastUpdated: new Date().toISOString(),
      foundingMemberCount: fallback.foundingMemberCount,
      foundingMemberCap: fallback.foundingMemberCap,
      foundingMemberSpotsRemaining: fallback.foundingMemberSpotsRemaining,
    });
  }
}
