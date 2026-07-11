/**
 * Polygon.io provider (P4 — ETF-01 PRIMARY route, founder-approved 2026-07-11).
 *
 * `/v3/reference/tickers/{T}` returns REAL `share_class_shares_outstanding`
 * for all 11 spot-BTC funds. Weekly flow = Δshares × NAV — exact
 * creations/redemptions, no price-noise adjustment (plan Part C matrix).
 *
 * Free tier: 5 requests/min — the 11-ticker batch is paced at 13s intervals
 * (~2.4 min total), trivially fine for a weekly job. Requires POLYGON_API_KEY
 * (local: apps/web/.env.local; CI: repository secret — founder-owned key).
 */
import { withRetry } from '../lib/retry.mjs';

/** The 11 US spot-BTC ETFs (plan Part C; 'BTC' = Grayscale Mini). */
export const SPOT_BTC_ETFS = [
  'IBIT',
  'FBTC',
  'GBTC',
  'BTC',
  'ARKB',
  'BITB',
  'HODL',
  'BTCO',
  'EZBC',
  'BRRR',
  'BTCW',
];

const PACE_MS = 13_000; // 5 req/min free tier — 13s spacing keeps a safety margin

export async function fetchEtfSharesOutstanding(tickers = SPOT_BTC_ETFS) {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) {
    throw new Error(
      'POLYGON_API_KEY missing — set it in apps/web/.env.local (local) or the repo secrets (CI)'
    );
  }
  const out = {};
  for (let i = 0; i < tickers.length; i += 1) {
    const t = tickers[i];
    if (i > 0) await new Promise((r) => setTimeout(r, PACE_MS));
    const url = `https://api.polygon.io/v3/reference/tickers/${t}?apiKey=${apiKey}`;
    const res = await withRetry(
      async () => {
        const r = await fetch(url);
        if (r.status === 429) throw new Error(`Polygon ${t} rate-limited`);
        if (!r.ok) throw new Error(`Polygon ${t} returned ${r.status}`);
        return r.json();
      },
      { label: `Polygon:${t}`, baseDelayMs: 15_000 }
    );
    const info = res.results;
    out[t] = {
      shares: info?.share_class_shares_outstanding ?? null,
      lastUpdated: info?.last_updated_utc ?? null,
    };
  }
  return {
    funds: out,
    provenance: {
      source: 'Polygon:/v3/reference/tickers',
      fetchedAt: new Date().toISOString(),
      licence: 'polygon-free-tier',
    },
  };
}
