/**
 * Horizon-matched CAGR derivation — Phase D (TOOLS_IMPROVEMENT.md, 2026-05-23).
 *
 * Computes a forward-projection FX depreciation rate from the monthly FX
 * time-series using a CONTINUOUS trailing-N-year window where N matches the
 * user's chosen horizon:
 *
 *   windowMonths = min(horizonYears × 12, totalAvailableMonths)
 *
 * Removes the discontinuity that a 3-step (5y/10y/16y) function would
 * introduce at the boundaries (CTO Review H1, plan v1.1).
 *
 * **Sign convention:** the function reads `closeLocalPerUsd` (canonical
 * form — rising means local currency depreciating). Output is the CAGR of
 * `closeLocalPerUsd` over the window. Positive output = local currency
 * depreciated against USD (which is what the hedge formula
 * `(1 + usdYield) × (1 + localDepreciation) − 1` expects).
 *
 * **P7 graceful fallback:** returns sentinel `0` (no depreciation) when the
 * series is empty, undefined, or has < 12 months. Calculators that consume
 * this value degrade to non-hedged behavior rather than throwing in the
 * render path. Test `should return 0 when fxSeries has fewer than 12 months`
 * enforces this contract.
 */

import type { MonthlyFxSeries, MonthlyFxBar, MarketDataSnapshot } from '../types';

const MIN_REQUIRED_MONTHS = 12;

export function deriveHorizonMatchedCAGR(
  fxSeries: MonthlyFxSeries | { months: ReadonlyArray<MonthlyFxBar> } | undefined,
  horizonYears: number
): number {
  if (!fxSeries) return 0;
  const months = fxSeries.months;
  if (!months || months.length < MIN_REQUIRED_MONTHS) return 0;

  // Continuous trailing-window: match the user's horizon up to the full
  // available series length.
  const desiredMonths = Math.max(MIN_REQUIRED_MONTHS, Math.round(horizonYears * 12));
  const windowMonths = Math.min(desiredMonths, months.length);
  const sliced = months.slice(-windowMonths);

  const startClose = sliced[0]?.closeLocalPerUsd ?? 0;
  const endClose = sliced[sliced.length - 1]?.closeLocalPerUsd ?? 0;
  if (startClose <= 0 || endClose <= 0) return 0;

  // CAGR of LOCAL_per_USD = how much MORE local per USD per year = local depreciation.
  const years = (sliced.length - 1) / 12;
  if (years <= 0) return 0;
  return Math.pow(endClose / startClose, 1 / years) - 1;
}

/**
 * Policy helper — resolves the per-locale depreciation rate for forward
 * projection. USD currencies always return 0.
 *
 * **Priority (FX-16 D1, Bar 2026-05-26):** the calibrated forward constant
 * `FALLBACK_MARKET_DATA.exchangeRates.rates[currency].annualDepreciation`
 * is authoritative when present. The monthly-FX horizon-matched CAGR is used
 * ONLY as a fallback when the constant is missing.
 *
 * **Why this inversion (vs the earlier "live wins" policy):** D1 distinguishes
 * two semantically different quantities — `historicalCagr` is a retrospective
 * endpoint-pair CAGR; `annualDepreciation` is a forward calibration assumption,
 * intentionally smoother than any single endpoint-pair derivation. The live
 * monthly-FX derivation is mechanically an endpoint-pair CAGR over a sliding
 * window — semantically the *historical* quantity, not the forward one. For
 * EUR specifically, live derivation produces ~1.23% (the retired PT3 value);
 * the calibrated forward assumption is 0.55%. D1's locked rule: "do not use
 * 1.23% for forward EUR projections."
 *
 * For BRL the two methodologies happen to coincide (~6.21%) because BRL's
 * calibration window matches the available FX data; the inversion changes
 * nothing observable for BRL. For the 14 FX-16 currencies there is no live
 * FX series — the constant wins by default. The inversion's only observable
 * effect is EUR (1.23% → 0.55% in forward projections).
 *
 * Single source of truth for forward-projection FX rates. All calculators
 * consuming a non-USD locale depreciation MUST route through this function —
 * P4 DRY discipline.
 */
export function resolveHorizonMatchedDepreciation(
  snapshot: MarketDataSnapshot,
  currency: string | undefined,
  horizonYears: number
): number {
  if (!currency || currency === 'USD') return 0;
  const calibrated = snapshot.exchangeRates.rates[currency]?.annualDepreciation;
  if (typeof calibrated === 'number') return calibrated;
  // Fallback for currencies without a calibrated constant.
  const fxSeries = snapshot.monthlySeries?.fx?.[currency];
  if (fxSeries && fxSeries.months.length >= MIN_REQUIRED_MONTHS) {
    return deriveHorizonMatchedCAGR(fxSeries, horizonYears);
  }
  return 0;
}
