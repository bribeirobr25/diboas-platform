/**
 * GET /api/market/rate-ranges
 *
 * PR 2 · the stable strategies' base-rate ranges from OBSERVED pool history, for the goal
 * projection (private docs `audit/WEBAPP_PLANS_2026-11-04/P3_PROJECTION_PR2.md` §2). No input:
 * rates are currency-independent, so one CDN variant serves everyone. Rate-limited BEFORE any
 * provider is touched; a degraded answer (any stable strategy unavailable) takes a short shared
 * cache so a recovered source is seen within a minute; errors are never cached.
 */

import { NextRequest, NextResponse } from 'next/server';
import { type ProtocolApyHistory, type ProtocolId } from '@diboas/defi';
import { PROJECTION_POLICY } from '@diboas/investing';
import { getApyProvider } from '@/lib/market/factory';
import { STABLE_PROTOCOLS, isDegraded, rateRangesFor } from '@/lib/market/rateRanges';
import {
  MARKET_CACHE_CONTROL,
  MARKET_DEGRADED_CACHE_CONTROL,
  MARKET_ERROR_CACHE_CONTROL,
} from '@/lib/marketCacheHeaders';
import { Logger } from '@/lib/monitoring/Logger';
import { checkMarketRateLimit, rateLimitedResponse } from '@/lib/security/rateLimiter';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const rate = await checkMarketRateLimit(request.headers);
  if (!rate.allowed) return rateLimitedResponse(rate);
  try {
    // Independent fetches — never chained (P9).
    const results = await Promise.all(
      STABLE_PROTOCOLS.map((id) =>
        getApyProvider().getApyHistory(id, PROJECTION_POLICY.historyDays)
      )
    );
    const histories = new Map<ProtocolId, ProtocolApyHistory | null>(
      STABLE_PROTOCOLS.map((id, i) => [id, results[i]])
    );
    const payload = rateRangesFor(histories, new Date());
    if (isDegraded(payload)) {
      Logger.warn('rate ranges degraded', {
        route: 'rate-ranges',
        reasons: payload.strategies
          .filter((s) => !s.available)
          .map((s) => `${s.strategyId}:${'reason' in s ? s.reason : ''}`)
          .join(','),
      });
    }
    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': isDegraded(payload) ? MARKET_DEGRADED_CACHE_CONTROL : MARKET_CACHE_CONTROL,
      },
    });
  } catch (error) {
    Logger.error('market route failed', { route: 'rate-ranges' }, error);
    return NextResponse.json(
      { error: 'rate_ranges_unavailable' },
      { status: 503, headers: { 'Cache-Control': MARKET_ERROR_CACHE_CONTROL } }
    );
  }
}
