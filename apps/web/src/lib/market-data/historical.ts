/**
 * Historical anchor data for retrospective performance calculators.
 *
 * Source: docs/researches/btc-vs-assets-inflation-fx-final-analysis.md
 *   - Part 1 anchors: July 2010 (BTC Mt.Gox launch) → May 2026, 190 months
 *   - Part 2 anchors: March 2016 → May 2026, 122 months
 *   - Part 4 FX path: BRL/USD and EUR/USD bucket averages
 *   - Part 5 methodology: 4 BRL bucket windows for path-dependent DCA
 *
 * Last research update: 2026-05-15
 * Refresh cadence: annual (each January, append prior year anchors).
 *
 * SCOPE: single-point anchors at named dates. NOT a full monthly time-series.
 * For monthly granularity, future ingestion via CoinGecko / FRED / Yahoo
 * Finance is a post-MVP item gated on the iter-5 SDK swap.
 *
 * RESEARCH CONFIDENCE LEVELS (carry forward to UI uncertainty bars):
 *  - Inflation, FX history: HIGH (official BLS/IBGE/Eurostat/Destatis/INE)
 *  - Equity index TR: MEDIUM (May 2026 prices are mid-month estimates)
 *  - BTC 2010 price: MEDIUM ±30% (Mt.Gox volumes thin; sources differ $0.05-$0.08)
 *  - BTC DCA 2010 calculation: LOW (terminal range $500M-$1.5B depending on path)
 *
 * §6.10 enforcement: this file is INTERNAL to lib/market-data/. Consumers
 * MUST route through `marketDataService.getSync().historicalAnchors` —
 * direct imports from `historical.ts` outside `lib/market-data/` are
 * prohibited and enforced by the §3.13 pre-merge grep gate.
 */

// Anchor types (AssetCode, AnchorYear, AnchorConfidence, AssetAnchor) live in
// `./types` so `HistoricalAnchorsData` on `MarketDataSnapshot` can reference
// them without `types.ts` importing this file (avoids circular dep). This
// file owns the DATA; `./types` owns the SHAPE. Consumers should import
// types from the public barrel (`./index`), not from this internal file.
import type { AssetCode, AnchorYear, AssetAnchor, FxBucket } from './types';

// ---------------------------------------------------------------------------
// Anchor data — 8 assets × 3 anchor windows (Jul 2010 / Mar 2016 / May 2026)
// Sourced from docs/researches/btc-vs-assets-inflation-fx-final-analysis.md
// Parts 1 + 2 anchor tables.
// ---------------------------------------------------------------------------

export const ANCHOR_PRICES: readonly AssetAnchor[] = [
  // BTC — 2010 price midpoint MEDIUM (±30% sources vary $0.05-$0.08).
  {
    asset: 'BTC',
    year: 2010,
    monthIndicative: 7,
    price: 0.07,
    currency: 'USD',
    confidence: 'MEDIUM',
    source: 'Mt.Gox launch, research midpoint',
  },
  {
    asset: 'BTC',
    year: 2016,
    monthIndicative: 3,
    price: 416.73,
    currency: 'USD',
    confidence: 'HIGH',
    source: 'CoinGecko via research Part 2',
  },
  {
    asset: 'BTC',
    year: 2026,
    monthIndicative: 5,
    price: 80000,
    currency: 'USD',
    confidence: 'HIGH',
    source: 'mid-May 2026 spot',
  },
  // S&P 500 (price index — Part 1 anchor reconstructs TR via dividend series)
  {
    asset: 'SP500',
    year: 2010,
    monthIndicative: 7,
    price: 1030,
    currency: 'USD',
    confidence: 'HIGH',
    source: 'Yahoo Finance ^GSPC, research Part 1',
  },
  {
    asset: 'SP500',
    year: 2016,
    monthIndicative: 3,
    price: 2060,
    currency: 'USD',
    confidence: 'HIGH',
    source: 'Yahoo Finance ^GSPC, research Part 2',
  },
  {
    asset: 'SP500',
    year: 2026,
    monthIndicative: 5,
    price: 7400,
    currency: 'USD',
    confidence: 'MEDIUM',
    source: 'mid-May 2026 estimate',
  },
  // QQQ (split-adjusted)
  {
    asset: 'QQQ',
    year: 2010,
    monthIndicative: 7,
    price: 45.5,
    currency: 'USD',
    confidence: 'HIGH',
    source: 'Yahoo Finance, research Part 1',
  },
  {
    asset: 'QQQ',
    year: 2016,
    monthIndicative: 3,
    price: 108,
    currency: 'USD',
    confidence: 'HIGH',
    source: 'Yahoo Finance, research Part 2',
  },
  {
    asset: 'QQQ',
    year: 2026,
    monthIndicative: 5,
    price: 711,
    currency: 'USD',
    confidence: 'MEDIUM',
    source: 'mid-May 2026 estimate',
  },
  // MSCI World (gross USD)
  {
    asset: 'MSCI_WORLD',
    year: 2010,
    monthIndicative: 7,
    price: 1180,
    currency: 'USD',
    confidence: 'HIGH',
    source: 'MSCI, research Part 1',
  },
  {
    asset: 'MSCI_WORLD',
    year: 2016,
    monthIndicative: 3,
    price: 1610,
    currency: 'USD',
    confidence: 'HIGH',
    source: 'MSCI, research Part 2',
  },
  {
    asset: 'MSCI_WORLD',
    year: 2026,
    monthIndicative: 5,
    price: 5540,
    currency: 'USD',
    confidence: 'MEDIUM',
    source: 'mid-May 2026 estimate',
  },
  // Gold (spot $/oz)
  {
    asset: 'GOLD',
    year: 2010,
    monthIndicative: 7,
    price: 1200,
    currency: 'USD',
    confidence: 'HIGH',
    source: 'LBMA, research Part 1',
  },
  {
    asset: 'GOLD',
    year: 2016,
    monthIndicative: 3,
    price: 1235,
    currency: 'USD',
    confidence: 'HIGH',
    source: 'LBMA, research Part 2',
  },
  {
    asset: 'GOLD',
    year: 2026,
    monthIndicative: 5,
    price: 4700,
    currency: 'USD',
    confidence: 'MEDIUM',
    source: 'mid-May 2026 spot',
  },
  // TLT (20+ Year Treasury ETF, TR-adjusted)
  {
    asset: 'TLT',
    year: 2010,
    monthIndicative: 7,
    price: 98,
    currency: 'USD',
    confidence: 'HIGH',
    source: 'iShares, research Part 1',
  },
  {
    asset: 'TLT',
    year: 2016,
    monthIndicative: 3,
    price: 94,
    currency: 'USD',
    confidence: 'HIGH',
    source: 'iShares, research Part 2',
  },
  {
    asset: 'TLT',
    year: 2026,
    monthIndicative: 5,
    price: 85,
    currency: 'USD',
    confidence: 'MEDIUM',
    source: 'mid-May 2026 effective',
  },
  // Ibovespa (BRL, TR)
  {
    asset: 'IBOVESPA',
    year: 2010,
    monthIndicative: 7,
    price: 67500,
    currency: 'BRL',
    confidence: 'HIGH',
    source: 'B3, research Part 1',
  },
  {
    asset: 'IBOVESPA',
    year: 2016,
    monthIndicative: 3,
    price: 50055,
    currency: 'BRL',
    confidence: 'HIGH',
    source: 'B3, research Part 2',
  },
  {
    asset: 'IBOVESPA',
    year: 2026,
    monthIndicative: 5,
    price: 177000,
    currency: 'BRL',
    confidence: 'MEDIUM',
    source: 'mid-May 2026 estimate',
  },
  // DAX (TR, EUR)
  {
    asset: 'DAX',
    year: 2010,
    monthIndicative: 7,
    price: 6100,
    currency: 'EUR',
    confidence: 'HIGH',
    source: 'Deutsche Börse, research Part 1',
  },
  {
    asset: 'DAX',
    year: 2016,
    monthIndicative: 3,
    price: 9966,
    currency: 'EUR',
    confidence: 'HIGH',
    source: 'Deutsche Börse, research Part 2',
  },
  {
    asset: 'DAX',
    year: 2026,
    monthIndicative: 5,
    price: 24000,
    currency: 'EUR',
    confidence: 'MEDIUM',
    source: 'mid-May 2026 estimate',
  },
] as const;

// ---------------------------------------------------------------------------
// FX bucket averages for Phase B path-dependent hedge
// FxBucket type imported from ./types (Phase B lock; canonical shape).
// Bucket averages sourced from research Part 5 methodology.
// ---------------------------------------------------------------------------

export const BRL_USD_BUCKETS: readonly FxBucket[] = [
  { avgRate: 2.0, startDate: '2010-01-01', endDate: '2014-12-31' },
  { avgRate: 3.5, startDate: '2015-01-01', endDate: '2019-12-31' },
  { avgRate: 5.2, startDate: '2020-01-01', endDate: '2024-12-31' },
  { avgRate: 5.65, startDate: '2025-01-01', endDate: '2026-05-15' },
] as const;

export const EUR_USD_BUCKETS: readonly FxBucket[] = [
  // EUR per USD — inverted from research Part 4 (USD per EUR). Bucket averages
  // smoothed over the path drivers: 2010-14 Eurozone Crisis 1.20-1.50 range,
  // 2015-19 ECB QE 1.05-1.20, 2020-26 range-bound 1.05-1.18.
  { avgRate: 0.78, startDate: '2010-01-01', endDate: '2014-12-31' },
  { avgRate: 0.88, startDate: '2015-01-01', endDate: '2019-12-31' },
  { avgRate: 0.89, startDate: '2020-01-01', endDate: '2026-05-15' },
] as const;

// ---------------------------------------------------------------------------
// Lookup helpers — internal to lib/market-data/
// Phase C+ wraps these into the MarketDataSnapshot.historicalAnchors slice.
// ---------------------------------------------------------------------------

export function getAnchorPrice(asset: AssetCode, year: AnchorYear): AssetAnchor | null {
  return ANCHOR_PRICES.find((a) => a.asset === asset && a.year === year) ?? null;
}

export function getFxBuckets(code: 'BRL' | 'EUR'): readonly FxBucket[] {
  return code === 'BRL' ? BRL_USD_BUCKETS : EUR_USD_BUCKETS;
}

/** ISO-8601 date of the last research-doc refresh — drives the 365-day staleness gate. */
export const LAST_RESEARCH_UPDATE = '2026-05-15';
