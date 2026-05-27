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
  type AssetCode,
  type AnchorConfidence,
  type MonthlyAssetSeries,
} from '@/lib/market-data';

export type AssetHistoryStartYear =
  | 2010
  | 2011
  | 2012
  | 2013
  | 2014
  | 2015
  | 2016
  | 2017
  | 2018
  | 2019
  | 2020
  | 2021
  | 2022
  | 2023
  | 2024
  | 2025
  | 2026;

export type ReturnsBasis = 'total_return' | 'price_only';

/** Phase E v2 — expanded yearly-picker args. */
export interface AssetHistoryDcaReplayArgs {
  asset: AssetCode;
  startYear: AssetHistoryStartYear;
  amount: number;
  /** PT2 (2026-05-23): UI toggle for SP500/QQQ/MSCI_WORLD/TLT. */
  returnsBasis?: ReturnsBasis;
  /**
   * Currency the `amount` is denominated in AND the terminal value should be
   * reported in. Defaults to USD. When set to BRL / EUR (etc.) and the asset's
   * native currency differs, the calculator does month-by-month FX conversion
   * along the actual historical FX path — converting each contribution into
   * the asset's native currency at THAT month's FX rate, running the unit math,
   * then converting the final terminal back to `displayCurrency` at the
   * end-month's FX rate. This is the correct retrospective math for
   * cross-currency cases (e.g. pt-BR user investing R$ into a USD-priced ETF).
   */
  displayCurrency?: 'USD' | 'BRL' | 'EUR';
}

/** Native pricing currency of each asset's underlying instrument. */
const ASSET_NATIVE_CURRENCY: Record<AssetCode, 'USD' | 'BRL' | 'EUR'> = {
  BTC: 'USD',
  SP500: 'USD',
  QQQ: 'USD',
  MSCI_WORLD: 'USD',
  GOLD: 'USD',
  TLT: 'USD',
  IBOVESPA: 'BRL',
  DAX: 'EUR',
};

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
  args: AssetHistoryDcaReplayArgs
): AssetHistoryRangeResult {
  const monthlySeries = marketDataService.getMonthlySeries();
  if (!monthlySeries) {
    throw new AssetHistoryDataError(
      'monthlySeries not loaded — call marketDataService.get() first'
    );
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
    (m) => parseInt(m.ym.slice(0, 4), 10) === args.startYear
  );
  if (startIdx === -1) {
    throw new AssetHistoryDataError(`no data for ${args.asset} in ${args.startYear}`);
  }

  const window = series.months.slice(startIdx);
  const basis: ReturnsBasis = args.returnsBasis ?? 'total_return';

  // Cross-currency FX-path setup (2026-05-23): when the user's display currency
  // differs from the asset's native pricing currency, each contribution is
  // converted to asset-native at THAT month's FX rate, the unit math runs in
  // asset-native units, and the final terminal is converted back to display
  // currency at the end-month FX rate. This is path-dependent retrospective FX
  // (NOT the forward-projection smoothed model prohibited by CLAUDE.md).
  const displayCcy = args.displayCurrency ?? 'USD';
  const assetCcy = ASSET_NATIVE_CURRENCY[args.asset];
  const fxByYm =
    displayCcy === assetCcy
      ? null
      : buildFxLookup(monthlySeries.fx, displayCcy, assetCcy, args.asset);

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
    // Convert this month's contribution from display-currency to asset-native.
    const amountInAssetCcy = fxByYm ? args.amount * fxByYm(m.ym) : args.amount;
    unitsByClose += amountInAssetCcy / close;
    unitsByLow += amountInAssetCcy / effLow;
    unitsByHigh += amountInAssetCcy / effHigh;
  }

  const finalBar = window[window.length - 1];
  const finalUsePriceOnly = basis === 'price_only' && finalBar.closePriceOnly != null;
  const finalPrice = finalUsePriceOnly ? finalBar.closePriceOnly! : finalBar.close;

  // Convert terminal asset-native value back to display currency at end-month FX.
  // For same-currency cases, fxBack = 1 (no-op).
  const fxBackByYm =
    displayCcy === assetCcy
      ? null
      : buildFxLookup(monthlySeries.fx, assetCcy, displayCcy, args.asset);
  const fxBack = fxBackByYm ? fxBackByYm(finalBar.ym) : 1;

  return {
    totalContributed: args.amount * window.length,
    confidence: confidenceForDcaReplay(args.asset, args.startYear),
    terminalValue: unitsByClose * finalPrice * fxBack,
    rangeLow: unitsByHigh * finalPrice * fxBack, // worst-entry timing yields fewest units
    rangeHigh: unitsByLow * finalPrice * fxBack, // best-entry timing yields most units
    months: window.length,
    startYm: window[0].ym,
    endYm: finalBar.ym,
    returnsBasis: basis,
  };
}

/**
 * Build a memoized FX converter: returns a function `(ym: string) => number`
 * that gives the multiplier to convert 1 unit of `fromCcy` to `toCcy` at the
 * close FX rate of month `ym`. Cross-rates derive via USD.
 *
 * Returns identity if from === to.
 *
 * Throws AssetHistoryDataError if the FX data isn't available for the entire
 * asset's window (so callers can surface a clear error rather than producing
 * nonsense numbers).
 */
function buildFxLookup(
  fx: NonNullable<ReturnType<typeof marketDataService.getMonthlySeries>>['fx'],
  fromCcy: 'USD' | 'BRL' | 'EUR',
  toCcy: 'USD' | 'BRL' | 'EUR',
  assetForError: AssetCode
): (ym: string) => number {
  if (fromCcy === toCcy) return () => 1;
  // Find the series whose `closeLocalPerUsd` we need; direction handled below.
  const seriesCcy: 'USD' | 'BRL' | 'EUR' = fromCcy === 'USD' ? toCcy : fromCcy;
  if (fromCcy !== 'USD' && toCcy !== 'USD') {
    // Cross-rate via USD: compose two single-leg lookups.
    const toUsd = buildFxLookup(fx, fromCcy, 'USD', assetForError);
    const fromUsd = buildFxLookup(fx, 'USD', toCcy, assetForError);
    return (ym: string) => toUsd(ym) * fromUsd(ym);
  }
  const series = fx?.[seriesCcy];
  if (!series || !series.months.length) {
    throw new AssetHistoryDataError(
      `monthlyFx[${seriesCcy}] required for ${assetForError} cross-currency calc`
    );
  }
  // Build a sorted-by-ym list once so forward-fill is O(log n) per lookup.
  const sortedYms = series.months.map((b) => b.ym).sort();
  const map = new Map(series.months.map((b) => [b.ym, b.closeLocalPerUsd]));

  // Forward-fill helper: if exact ym not present, use the LATEST available
  // month with ym <= requested. Handles end-of-window gaps (e.g. ECB EUR
  // data lagging asset price data by 1 month). Returns undefined if no
  // earlier month exists either.
  const lookupWithForwardFill = (ym: string): number | undefined => {
    if (map.has(ym)) return map.get(ym);
    // Binary search for largest ym <= requested.
    let lo = 0;
    let hi = sortedYms.length - 1;
    let foundIdx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (sortedYms[mid] <= ym) {
        foundIdx = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    if (foundIdx === -1) return undefined;
    return map.get(sortedYms[foundIdx]);
  };

  const direction: 'mul' | 'div' = fromCcy === 'USD' ? 'mul' : 'div';
  return (ym: string) => {
    const v = lookupWithForwardFill(ym);
    if (v === undefined || v <= 0) {
      throw new AssetHistoryDataError(
        `monthlyFx[${seriesCcy}] has no usable rate for ${ym} or earlier (asset ${assetForError})`
      );
    }
    return direction === 'mul' ? v : 1 / v;
  };
}

/**
 * PT2-aware lump-sum: $amount at start-month close, valued at final-month close.
 * Returns single terminalValue (no range; lump-sum has no entry-timing uncertainty).
 */
export function calculateAssetHistoryLumpSum(args: AssetHistoryDcaReplayArgs): Omit<
  AssetHistoryRangeResult,
  'rangeLow' | 'rangeHigh'
> & {
  rangeLow?: undefined;
  rangeHigh?: undefined;
} {
  // C20 close (2026-05-25): borrow confidence directly from the 3-line pure
  // helper instead of running a throwaway full DCA replay just to read one
  // field. Previous behavior: called `calculateAssetHistoryDcaReplay({...args,
  // amount: 1})` and discarded everything except `replay.confidence`. Now: skip
  // the replay; call the helper directly. Same output, much less work.
  const monthlySeries = marketDataService.getMonthlySeries()!;
  const series = monthlySeries.assets[args.asset];
  if (!series) {
    throw new AssetHistoryDataError(`Asset history data unavailable for ${args.asset}`);
  }
  // A2 fix (2026-05-23): mirror of calculateAssetHistoryDcaReplay's data-driven
  // first-month lookup.
  const startIdx = series.months.findIndex(
    (m) => parseInt(m.ym.slice(0, 4), 10) === args.startYear
  );
  if (startIdx === -1) {
    throw new AssetHistoryDataError(
      `Asset history data unavailable for ${args.asset} ${args.startYear}`
    );
  }
  const basis: ReturnsBasis = args.returnsBasis ?? 'total_return';
  const startBar = series.months[startIdx];
  const finalBar = series.months[series.months.length - 1];
  const startPrice =
    basis === 'price_only' && startBar.closePriceOnly != null
      ? startBar.closePriceOnly
      : startBar.close;
  const finalPrice =
    basis === 'price_only' && finalBar.closePriceOnly != null
      ? finalBar.closePriceOnly
      : finalBar.close;

  // Cross-currency lump-sum (2026-05-23): user puts in `args.amount` in
  // `displayCurrency` at startBar.ym; we convert to asset-native to buy at
  // startPrice, hold to finalBar.ym, then convert terminal back to
  // displayCurrency. For same-currency cases, the factors are 1 (identity).
  const displayCcy = args.displayCurrency ?? 'USD';
  const assetCcy = ASSET_NATIVE_CURRENCY[args.asset];
  const fxStart =
    displayCcy === assetCcy
      ? 1
      : buildFxLookup(monthlySeries.fx, displayCcy, assetCcy, args.asset)(startBar.ym);
  const fxEnd =
    displayCcy === assetCcy
      ? 1
      : buildFxLookup(monthlySeries.fx, assetCcy, displayCcy, args.asset)(finalBar.ym);
  const amountInAssetCcy = args.amount * fxStart;
  const terminalInAssetCcy = amountInAssetCcy * (finalPrice / startPrice);
  const terminalInDisplay = terminalInAssetCcy * fxEnd;

  return {
    totalContributed: args.amount,
    confidence: confidenceForDcaReplay(args.asset, args.startYear),
    terminalValue: terminalInDisplay,
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
function confidenceForDcaReplay(
  asset: AssetCode,
  startYear: AssetHistoryStartYear
): AnchorConfidence {
  if (asset === 'BTC') {
    return startYear <= 2012 ? 'LOW' : 'MEDIUM';
  }
  return 'HIGH';
}
