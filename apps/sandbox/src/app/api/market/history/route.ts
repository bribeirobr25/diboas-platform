/**
 * GET /api/market/history?days=N
 *
 * Per-protocol daily APY history AND daily price history for all six execution
 * protocols — the time machine's replay source. One route because the replay
 * always needs both together: a lending leg replays APY, a market leg replays
 * price, and a single strategy holds both (Principle 9 — two routes would mean
 * two round trips for data never used apart). Provider-cached server-side at
 * the ruled 6 h TTL.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PROTOCOL_IDS, type ProtocolId } from '@diboas/defi';
import { getApyProvider, getPriceProvider } from '@/lib/market/factory';
import { MARKET_CACHE_CONTROL, MARKET_ERROR_CACHE_CONTROL } from '@/lib/marketCacheHeaders';
import { Logger } from '@/lib/monitoring/Logger';
import { checkMarketRateLimit, rateLimitedResponse } from '@/lib/security/rateLimiter';
import { HISTORY_DAYS_DEFAULT, HISTORY_DAYS_MAX } from '@/lib/market/historyWindow';

/* The one exhaustive list (`PROTOCOL_IDS`, defi) — a new protocol cannot be left out. */
const PROTOCOLS: ProtocolId[] = [...PROTOCOL_IDS];

/* Providers resolve through the `5.243` seam — never constructed here. */

export async function GET(request: NextRequest): Promise<NextResponse> {
  /**
   * `5.213` · R-5 / `SANDBOX_SPEC_D-F` (FT-4). Refuse BEFORE any provider is
   * touched — a limiter that runs after the fetch has limited nothing that
   * costs anything.
   */
  const rate = await checkMarketRateLimit(request.headers);
  if (!rate.allowed) return rateLimitedResponse(rate);

  const daysRaw = Number(request.nextUrl.searchParams.get('days') ?? String(HISTORY_DAYS_DEFAULT));
  const days = Number.isFinite(daysRaw)
    ? Math.min(Math.max(Math.trunc(daysRaw), 1), HISTORY_DAYS_MAX)
    : HISTORY_DAYS_DEFAULT;
  try {
    // Independent fetches — never chained (React perf guidance + P9).
    const [apyResults, priceResults] = await Promise.all([
      Promise.all(PROTOCOLS.map((protocolId) => getApyProvider().getApyHistory(protocolId, days))),
      Promise.all(
        PROTOCOLS.map((protocolId) => getPriceProvider().getPriceHistory(protocolId, days))
      ),
    ]);
    /**
     * A REFUSED series is OMITTED, never sent as an empty one.
     *
     * `null` from the port means "no primary, and no eligible fallback". The
     * replay already treats an ABSENT history as an unreplayable leg (I-G1d,
     * all-or-nothing per position) — which is the existing controlled-
     * unavailable behaviour and needs no new Product handling. Sending an empty
     * series instead would have required inventing a stamp for a value that
     * does not exist.
     */
    const histories = apyResults.filter((h) => h !== null);
    const priceHistories = priceResults.filter((h) => h !== null);
    return NextResponse.json(
      { days, histories, priceHistories },
      { headers: { 'Cache-Control': MARKET_CACHE_CONTROL } }
    );
  } catch (error) {
    // Unexpected here (providers fail open); logged, never silent (P12/R-14).
    Logger.error('market route failed', { route: 'history' }, error);
    return NextResponse.json(
      { error: 'history_unavailable' },
      { status: 503, headers: { 'Cache-Control': MARKET_ERROR_CACHE_CONTROL } }
    );
  }
}
