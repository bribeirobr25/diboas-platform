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
import { type ProtocolId } from '@diboas/defi';
import { getApyProvider, getPriceProvider } from '@/lib/market/factory';
import { MARKET_CACHE_CONTROL, MARKET_ERROR_CACHE_CONTROL } from '@/lib/marketCacheHeaders';

const PROTOCOLS: ProtocolId[] = [
  'skySsr',
  'aaveV3',
  'compoundV3',
  'sanctumInf',
  'jupiterJlp',
  'jito',
];

/* Providers resolve through the `5.243` seam — never constructed here. */

export async function GET(request: NextRequest): Promise<NextResponse> {
  const daysRaw = Number(request.nextUrl.searchParams.get('days') ?? '365');
  const days = Number.isFinite(daysRaw) ? Math.min(Math.max(Math.trunc(daysRaw), 1), 730) : 365;
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
  } catch {
    return NextResponse.json(
      { error: 'history_unavailable' },
      { status: 503, headers: { 'Cache-Control': MARKET_ERROR_CACHE_CONTROL } }
    );
  }
}
