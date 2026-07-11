/**
 * CoinGecko provider (P2 Stage 1) — VERIFIER role only: independent BTC
 * close at a UTC month boundary for the dual-source append gate (codifies
 * the manual cross-check from the 2026-07-11 refresh: Yahoo $58,558.86 vs
 * CoinGecko $58,557.70).
 *
 * Uses the public endpoint; sends the demo key header when COINGECKO_API_KEY
 * is present (higher rate allowance, same data).
 */
import { withRetry } from '../lib/retry.mjs';

/**
 * BTC/USD price at (or nearest to) the first UTC instant of the month AFTER
 * `ym` — i.e. the month-close boundary for `ym`'s candle.
 */
export async function fetchBtcMonthCloseVerifier(ym) {
  const [y, m] = ym.split('-').map(Number);
  const boundary = Date.UTC(y, m, 1) / 1000; // first instant of the next month
  const from = boundary - 6 * 3600;
  const to = boundary + 6 * 3600;
  const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${from}&to=${to}`;
  const headers = {};
  if (process.env.COINGECKO_API_KEY) headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
  const prices = await withRetry(
    async () => {
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`CoinGecko returned ${res.status}`);
      const json = await res.json();
      if (!json.prices?.length) throw new Error('CoinGecko returned empty price range');
      return json.prices; // [ [ms, price], ... ]
    },
    { label: 'CoinGecko:BTC' }
  );
  // Nearest point to the boundary
  let best = prices[0];
  for (const p of prices) {
    if (Math.abs(p[0] / 1000 - boundary) < Math.abs(best[0] / 1000 - boundary)) best = p;
  }
  return {
    price: best[1],
    at: new Date(best[0]).toISOString(),
    provenance: {
      source: 'CoinGecko:bitcoin',
      url: 'market_chart/range@month-boundary',
      fetchedAt: new Date().toISOString(),
      licence: 'attribution',
    },
  };
}
