/**
 * Asset History calculator — retrospective performance.
 *
 * Phase E original (2026-05-16): 8 assets × 2 start years (2010, 2016) ×
 * 2 modes (lump sum, monthly DCA). Read locked historical anchor table.
 *
 * Phase E v2 (TOOLS_IMPROVEMENT.md, 2026-05-23): expanded to 17 start years
 * (2010–2026) via monthly OHLC replay. Adds:
 *   - `calculateAssetHistoryDcaReplay()` — month-by-month replay using
 *     `marketDataService.getMonthlySeries().assets[asset]`. Produces a range
 *     output `[rangeLow, rangeHigh]` from monthly-low/high entries (best/worst
 *     timing). Standard close-based DCA terminal value is the midpoint reference.
 *   - PT2 (2026-05-23 Bar acceptance): `returnsBasis: 'total_return' | 'price_only'`
 *     toggle. When `price_only`, the replay reads `closePriceOnly` when present
 *     (SP500/QQQ/MSCI_WORLD/TLT only); otherwise falls back to `close` (BTC/GOLD
 *     have no dividend-yield divergence; IBOVESPA/DAX are native total return).
 *   - M1 (CTO Review): BTC DCA confidence stays MEDIUM-capped (2013+) or LOW
 *     (2010–2012). Monthly data granularity does NOT promote BTC outcomes to
 *     HIGH-confidence — entry-timing volatility remains the dominant uncertainty.
 *     The audit M6 calm-framing range display is preserved for BTC 2010–2012.
 *
 * Backwards compatibility: `calculateAssetHistory()` retains the original
 * signature for the 2-start-year era. New callers use `calculateAssetHistoryDcaReplay`.
 */

import {
  marketDataService,
  type AssetAnchor,
  type AssetCode,
  type AnchorConfidence,
  type AnchorYear,
  type MonthlyAssetSeries,
} from '@/lib/market-data';

const END_YEAR: AnchorYear = 2026;
const END_MONTH = 5;

export type AssetHistoryStartYear =
  | 2010 | 2011 | 2012 | 2013 | 2014 | 2015 | 2016 | 2017
  | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026;

export type ReturnsBasis = 'total_return' | 'price_only';

export interface AssetHistoryArgs {
  asset: AssetCode;
  startYear: 2010 | 2016;
  mode: 'lumpSum' | 'monthlyDca';
  amount: number;
}

/** Phase E v2 — expanded yearly-picker args. */
export interface AssetHistoryDcaReplayArgs {
  asset: AssetCode;
  startYear: AssetHistoryStartYear;
  amount: number;
  /** PT2 (2026-05-23): UI toggle for SP500/QQQ/MSCI_WORLD/TLT. */
  returnsBasis?: ReturnsBasis;
}

export interface AssetHistoryResult {
  startAnchor: AssetAnchor;
  endAnchor: AssetAnchor;
  totalContributed: number;
  confidence: AnchorConfidence;
  /** Terminal value when confidence allows a single number; null when LOW. */
  terminalValue: number | null;
  /** Only populated for LOW-confidence outcomes (BTC DCA 2010). */
  rangeLow?: number;
  rangeHigh?: number;
  /** Months spanned by the DCA window (ignored for lump sum). */
  months: number;
}

export interface AssetHistoryRangeResult {
  totalContributed: number;
  confidence: AnchorConfidence;
  /** Midpoint reference (close-based DCA terminal). */
  terminalValue: number;
  /** Best-case entry timing (monthly-low). */
  rangeLow: number;
  /** Worst-case entry timing (monthly-high). */
  rangeHigh: number;
  months: number;
  startYm: string;
  endYm: string;
  returnsBasis: ReturnsBasis;
}

export class AssetHistoryDataError extends Error {
  constructor(reason: string) {
    super(`Asset history data unavailable: ${reason}`);
    this.name = 'AssetHistoryDataError';
  }
}

/**
 * Phase E v2 (TOOLS_IMPROVEMENT.md, 2026-05-23): month-by-month DCA replay.
 * Replaces the `DCA_TERMINAL_PER_100` static lookup with explicit replay using
 * `monthlySeries.assets[asset]`. Outputs a range from monthly low/high.
 */
export function calculateAssetHistoryDcaReplay(
  args: AssetHistoryDcaReplayArgs,
): AssetHistoryRangeResult {
  const monthlySeries = marketDataService.getMonthlySeries();
  if (!monthlySeries) {
    throw new AssetHistoryDataError('monthlySeries not loaded — call marketDataService.get() first');
  }
  const series = monthlySeries.assets?.[args.asset];
  if (!series || !series.months.length) {
    throw new AssetHistoryDataError(`no monthly series for ${args.asset}`);
  }

  // A2 fix (2026-05-23): data-driven first month for the requested startYear.
  // Previously hardcoded month=7 for 2010 / month=1 otherwise — this skipped
  // DAX's 2010-06 row (DAX dataset begins June 2010, the other 7 assets begin
  // July 2010). Now we use whichever month of `startYear` first appears in the
  // series, preserving the "throw if year predates dataset" behavior.
  const startIdx = series.months.findIndex(
    (m) => parseInt(m.ym.slice(0, 4), 10) === args.startYear,
  );
  if (startIdx === -1) {
    throw new AssetHistoryDataError(`no data for ${args.asset} in ${args.startYear}`);
  }

  const window = series.months.slice(startIdx);
  const basis: ReturnsBasis = args.returnsBasis ?? 'total_return';

  // F2 fix (2026-05-23): basis-consistent OHLC.
  //
  // For TR-adjusted assets (SP500, QQQ, MSCI_WORLD, TLT — where `close` is the
  // dividend-adjusted value AND a raw unadjusted `closePriceOnly` is present),
  // the raw `high`/`low` come from Yahoo unadjusted intramonth — they live in
  // PRICE-ONLY units. Mixing them with the adjusted `close` produces inverted
  // ranges where terminalValue escapes [rangeLow, rangeHigh].
  //
  // Derive the per-month adjustment factor `close/closePriceOnly` and apply
  // it uniformly across the OHLC bar to lift `high`/`low` into TR-space. This
  // is the standard treatment used by Bloomberg/FactSet — dividend factor is
  // a within-month constant scalar, so high ≥ close ≥ low is preserved.
  //
  // For native-TR assets (BTC, GOLD, IBOVESPA, DAX — no `closePriceOnly`),
  // factor = 1 implicitly; OHLC is already internally consistent.
  //
  // For `basis === 'price_only'` mode, both close (closePriceOnly) and the
  // raw OHLC are in the same unadjusted units — no factor needed.
  let unitsByClose = 0;
  let unitsByLow = 0;
  let unitsByHigh = 0;
  for (const m of window) {
    const usePriceOnly = basis === 'price_only' && m.closePriceOnly != null;
    const close = usePriceOnly ? m.closePriceOnly! : m.close;

    // Effective high/low in the same units as `close`.
    let effHigh = m.high;
    let effLow = m.low;
    if (basis === 'total_return' && m.closePriceOnly != null && m.closePriceOnly > 0) {
      const factor = m.close / m.closePriceOnly;
      effHigh = m.high * factor;
      effLow = m.low * factor;
    }

    if (close <= 0 || effLow <= 0 || effHigh <= 0) continue;
    unitsByClose += args.amount / close;
    unitsByLow += args.amount / effLow;
    unitsByHigh += args.amount / effHigh;
  }

  const finalBar = window[window.length - 1];
  const finalUsePriceOnly = basis === 'price_only' && finalBar.closePriceOnly != null;
  const finalPrice = finalUsePriceOnly ? finalBar.closePriceOnly! : finalBar.close;

  return {
    totalContributed: args.amount * window.length,
    confidence: confidenceForDcaReplay(args.asset, args.startYear),
    terminalValue: unitsByClose * finalPrice,
    rangeLow: unitsByHigh * finalPrice,    // worst-entry timing yields fewest units
    rangeHigh: unitsByLow * finalPrice,    // best-entry timing yields most units
    months: window.length,
    startYm: window[0].ym,
    endYm: finalBar.ym,
    returnsBasis: basis,
  };
}

/**
 * PT2-aware lump-sum: $amount at start-month close, valued at final-month close.
 * Returns single terminalValue (no range; lump-sum has no entry-timing uncertainty).
 */
export function calculateAssetHistoryLumpSum(
  args: AssetHistoryDcaReplayArgs,
): Omit<AssetHistoryRangeResult, 'rangeLow' | 'rangeHigh'> & { rangeLow?: undefined; rangeHigh?: undefined } {
  const replay = calculateAssetHistoryDcaReplay({ ...args, amount: 1 });
  const monthlySeries = marketDataService.getMonthlySeries()!;
  const series = monthlySeries.assets[args.asset]!;
  // A2 fix (2026-05-23): mirror of calculateAssetHistoryDcaReplay's data-driven
  // first-month lookup.
  const startIdx = series.months.findIndex(
    (m) => parseInt(m.ym.slice(0, 4), 10) === args.startYear,
  );
  const basis: ReturnsBasis = args.returnsBasis ?? 'total_return';
  const startBar = series.months[startIdx];
  const finalBar = series.months[series.months.length - 1];
  const startPrice = basis === 'price_only' && startBar.closePriceOnly != null ? startBar.closePriceOnly : startBar.close;
  const finalPrice = basis === 'price_only' && finalBar.closePriceOnly != null ? finalBar.closePriceOnly : finalBar.close;
  return {
    totalContributed: args.amount,
    confidence: replay.confidence,
    terminalValue: args.amount * (finalPrice / startPrice),
    months: series.months.length - startIdx,
    startYm: startBar.ym,
    endYm: finalBar.ym,
    returnsBasis: basis,
  };
}

/**
 * Confidence stratification per Phase D.4 v1.1 (preserves audit M6 calm-framing).
 * Monthly granularity ≠ outcome certainty for volatile assets.
 */
function confidenceForDcaReplay(asset: AssetCode, startYear: AssetHistoryStartYear): AnchorConfidence {
  if (asset === 'BTC') {
    return startYear <= 2012 ? 'LOW' : 'MEDIUM';
  }
  return 'HIGH';
}

// ─────────────────────────────────────────────────────────────────────────
// LEGACY API — calculateAssetHistory (2-start-year, anchor-table-based).
// Retained for backwards compat during Phase E rollout. New callers should
// use calculateAssetHistoryDcaReplay or calculateAssetHistoryLumpSum.
// ─────────────────────────────────────────────────────────────────────────

export function calculateAssetHistory(args: AssetHistoryArgs): AssetHistoryResult {
  const anchors = marketDataService.getHistoricalAnchors();
  if (!anchors) {
    throw new AssetHistoryDataError('marketDataService.getHistoricalAnchors() returned undefined');
  }

  const startAnchor = anchors.anchors.find(
    (a) => a.asset === args.asset && a.year === args.startYear,
  );
  const endAnchor = anchors.anchors.find((a) => a.asset === args.asset && a.year === END_YEAR);
  if (!startAnchor || !endAnchor) {
    throw new AssetHistoryDataError(`anchors missing for ${args.asset} ${args.startYear} → ${END_YEAR}`);
  }

  const months = monthsBetween(
    args.startYear,
    startAnchor.monthIndicative,
    END_YEAR,
    END_MONTH,
  );

  // BTC DCA 2010 is the LOW-confidence path — audit M6 calm-framing.
  if (args.asset === 'BTC' && args.startYear === 2010 && args.mode === 'monthlyDca') {
    const scale = args.amount / 100;
    return {
      startAnchor,
      endAnchor,
      totalContributed: args.amount * months,
      confidence: 'LOW',
      terminalValue: null,
      rangeLow: 500_000_000 * scale,
      rangeHigh: 1_500_000_000 * scale,
      months,
    };
  }

  if (args.mode === 'lumpSum') {
    const terminalValue = args.amount * (endAnchor.price / startAnchor.price);
    return {
      startAnchor,
      endAnchor,
      totalContributed: args.amount,
      confidence: pairConfidence(startAnchor.confidence, endAnchor.confidence),
      terminalValue,
      months,
    };
  }

  // Legacy DCA — research-validated terminal-per-$100/mo lookup.
  const dcaTerminal = DCA_TERMINAL_PER_100[args.asset]?.[args.startYear];
  if (dcaTerminal === undefined) {
    throw new AssetHistoryDataError(
      `DCA terminal value not validated for ${args.asset} ${args.startYear}`,
    );
  }
  const scale = args.amount / 100;
  const terminalValue = dcaTerminal * scale;

  const confidence: AnchorConfidence =
    args.asset === 'BTC' ? 'MEDIUM' : pairConfidence(startAnchor.confidence, endAnchor.confidence);

  return {
    startAnchor,
    endAnchor,
    totalContributed: args.amount * months,
    confidence,
    terminalValue,
    months,
  };
}

const DCA_TERMINAL_PER_100: Partial<Record<AssetCode, Record<2010 | 2016, number>>> = {
  BTC: { 2010: 0, 2016: 200_000 },
  SP500: { 2010: 66_000, 2016: 22_000 },
  QQQ: { 2010: 110_000, 2016: 28_000 },
  GOLD: { 2010: 33_000, 2016: 22_000 },
  MSCI_WORLD: { 2010: 40_000, 2016: 20_000 },
  DAX: { 2010: 33_000, 2016: 17_000 },
  IBOVESPA: { 2010: 30_000, 2016: 22_000 },
  TLT: { 2010: 23_000, 2016: 13_500 },
};

function monthsBetween(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
): number {
  return (endYear - startYear) * 12 + (endMonth - startMonth);
}

function pairConfidence(a: AnchorConfidence, b: AnchorConfidence): AnchorConfidence {
  if (a === 'LOW' || b === 'LOW') return 'LOW';
  if (a === 'MEDIUM' || b === 'MEDIUM') return 'MEDIUM';
  return 'HIGH';
}
