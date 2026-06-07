/**
 * Currency-hedged future-value formulas — for non-US locales where the
 * customer holds USD yield while their reporting currency depreciates.
 *
 * Effective rate model (NOT explicit FX conversion):
 *   effectiveLocalAPY = (1 + usdYield) * (1 + localDepreciation) - 1
 *
 * All depreciation is uncapped (both BRL and EUR). See
 * docs/audit/PREPARING_FOR_ANALYTICS_DATA.md §15.0 assumption 10.
 *
 * Path-dependent variant (Phase B, 2026-05-16):
 *   `calculateMonthlyPathDependentHedge` walks the FX path bucket-by-bucket
 *   for retrospective DCA where the smoothed CAGR under-counts. Forward
 *   projections continue to use the smoothed variants above. See
 *   docs/tech/financial-calculations.md §"Path-Dependent FX Hedge".
 */

import type { DepositTiming, FxBucket } from '../types';
import {
  annualToMonthlyRate,
  calculateMonthlyContributions,
  MONTHS_PER_YEAR,
  type MonthlyContributionResult,
} from './core';
import { applicationEventBus, ApplicationEventType } from '@/lib/events/ApplicationEventBus';
import { toISODateString } from '@/lib/utils/date';

// ---------------------------------------------------------------------------
// C3 close (TOOLS_41_DEFECTS_FIX_PLAN.md §3.3, 2026-05-26): boundary clamp
// for the effective-rate model. `annualToMonthlyRate()` throws when its input
// is ≤ -1 (geometric monthly conversion is undefined past -100% APY). The
// effective-rate formula `(1+usdYield)(1+d)−1` reaches that boundary only if
// `d ≤ -1` (local currency appreciating ≥ 100%) — not reachable with current
// data (BRL/EUR historical CAGR positive). But unguarded data refreshes
// could in principle expose the formula to a pathological value.
//
// Option C from Phase 0 §0.4: clamp the effective rate to -0.99 AND emit a
// structured observability event when the clamp activates. Honest failure
// beats silent rewrite — the event makes the clamp auditable.
// ---------------------------------------------------------------------------

/** Floor for the effective rate. -0.99 = -99% APY (still finite-defined geometric). */
export const EFFECTIVE_RATE_FLOOR = -0.99;

/**
 * Boundary clamp for the canonical effective-rate model. Exported so all
 * hedge sites (compound engine `calculatorHedged.ts`, the bespoke-math lib
 * orchestrators emergency-fund/time-to-target, the FV-shape and annuity-shape
 * functions below) route through ONE clamp + one observability event — not
 * three or five different inline guards.
 *
 * Per CTO-board v3 audit (2026-05-26): the original C3 implementation
 * (2026-05-26 morning) only covered `calculateWithCurrencyHedge` and
 * `calculateMonthlyWithCurrencyHedge`. The compound engine's inline hedge in
 * `calculatorHedged.ts:hedgedScenarioRate`, plus the bespoke-math orchestrators,
 * bypassed the clamp. This export + the consumer-side wiring in those files
 * closes that gap.
 */
export function applyEffectiveRateClamp(
  rate: number,
  context: { source: string; usdYield: number; depreciation: number }
): number {
  if (rate > EFFECTIVE_RATE_FLOOR) return rate;
  applicationEventBus.emit(ApplicationEventType.CALCULATOR_DEPRECIATION_CLAMPED, {
    domain: 'tools',
    source: context.source,
    timestamp: Date.now(),
    metadata: {
      originalEffectiveRate: rate,
      clampedTo: EFFECTIVE_RATE_FLOOR,
      usdYield: context.usdYield,
      depreciation: context.depreciation,
    },
  });
  return EFFECTIVE_RATE_FLOOR;
}

/**
 * Builds the percent-domain hedged-rate transformer shared by the compound
 * (`calculatorHedged`) and time-to-target calculators (D1 A-2). Converts a USD
 * rate (percent) into the effective local rate (percent) under the canonical
 * hedge expression `(1 + usdYield)(1 + depreciation) − 1`, clamped via
 * `applyEffectiveRateClamp`.
 *
 * `source` is the clamp's observability discriminator (feeds
 * `CALCULATOR_DEPRECIATION_CLAMPED`) and must stay unique per call site.
 */
export function createHedgedRateTransformer(
  depreciation: number,
  source: string
): (usdRatePercent: number) => number {
  return (usdRatePercent: number): number => {
    if (depreciation === 0) return usdRatePercent;
    const usdYield = usdRatePercent / 100;
    const rawEffective = (1 + usdYield) * (1 + depreciation) - 1;
    const effective = applyEffectiveRateClamp(rawEffective, {
      source,
      usdYield,
      depreciation,
    });
    return effective * 100;
  };
}

// ---------------------------------------------------------------------------
// Currency hedge — lump sum
// ---------------------------------------------------------------------------

export interface CurrencyHedgeResult {
  effectiveLocalAPY: number;
  nominalFV: number;
  realFV: number;
  nominalGain: number;
  realGain: number;
  /**
   * Modeled USD equivalent — NOT a true FX-converted value. Computed by
   * removing the depreciation component from the local-currency result.
   */
  estimatedUsdEquivalent: number;
}

export function calculateWithCurrencyHedge(
  principal: number,
  usdYield: number,
  localDepreciation: number,
  localInflation: number,
  years: number
): CurrencyHedgeResult {
  const rawEffective = (1 + usdYield) * (1 + localDepreciation) - 1;
  const effectiveLocalAPY = applyEffectiveRateClamp(rawEffective, {
    source: 'calculateWithCurrencyHedge',
    usdYield,
    depreciation: localDepreciation,
  });
  const nominalFV = principal * Math.pow(1 + effectiveLocalAPY, years);
  const realFV = nominalFV / Math.pow(1 + localInflation, years);
  const estimatedUsdEquivalent = nominalFV / Math.pow(1 + localDepreciation, years);

  return {
    effectiveLocalAPY,
    nominalFV,
    realFV,
    nominalGain: nominalFV - principal,
    realGain: realFV - principal,
    estimatedUsdEquivalent,
  };
}

// ---------------------------------------------------------------------------
// Currency hedge — monthly contributions
// ---------------------------------------------------------------------------

export interface MonthlyHedgeResult extends MonthlyContributionResult {
  effectiveLocalAPY: number;
  /** Modeled USD equivalent — see CurrencyHedgeResult.estimatedUsdEquivalent */
  estimatedUsdEquivalent: number;
}

export function calculateMonthlyWithCurrencyHedge(
  monthlyPayment: number,
  usdYield: number,
  localDepreciation: number,
  localInflation: number,
  months: number,
  timing: DepositTiming = 'end'
): MonthlyHedgeResult {
  const rawEffective = (1 + usdYield) * (1 + localDepreciation) - 1;
  const effectiveLocalAPY = applyEffectiveRateClamp(rawEffective, {
    source: 'calculateMonthlyWithCurrencyHedge',
    usdYield,
    depreciation: localDepreciation,
  });

  const result = calculateMonthlyContributions(
    monthlyPayment,
    effectiveLocalAPY,
    localInflation,
    months,
    timing
  );

  const years = months / MONTHS_PER_YEAR;
  const estimatedUsdEquivalent = result.nominalFV / Math.pow(1 + localDepreciation, years);

  return {
    ...result,
    effectiveLocalAPY,
    estimatedUsdEquivalent,
  };
}

// ---------------------------------------------------------------------------
// Path-dependent currency hedge — monthly DCA (Phase B, 2026-05-16)
// ---------------------------------------------------------------------------

export interface PathDependentHedgeResult {
  /** Total local currency contributed (monthlyContributionLocal × months) */
  totalContributedLocal: number;
  /** Final balance reconverted to local currency at endRate */
  finalBalanceLocal: number;
  /** Final balance in USD before reconversion */
  finalBalanceUsd: number;
  /**
   * Effective local-currency CAGR — derived by solving the standard annuity
   * equation for the monthly rate that produces `finalBalanceLocal` from
   * `monthlyContributionLocal × months` end-of-month contributions, then
   * annualizing. Bisection solver; converges to ~6 decimal places.
   */
  effectiveLocalCagr: number;
}

export interface PathDependentHedgeArgs {
  monthlyContributionLocal: number;
  usdAnnualYield: number;
  startDate: string; // ISO YYYY-MM-DD; month-1 anchor
  months: number; // total contribution count
  buckets: readonly FxBucket[];
  endRate: number; // local/USD at end-of-window
}

/**
 * Path-dependent currency hedge for DCA over multi-year windows where the
 * underlying FX path is non-uniform (e.g. BRL/USD 2010→2026: started ~1.78,
 * crashed to ~5.95, settled ~5.50).
 *
 * The smoothed `calculateMonthlyWithCurrencyHedge` uses a single CAGR which
 * under-estimates DCA outcomes because it assumes uniform conversion. This
 * function walks the FX path bucket-by-bucket: each monthly contribution is
 * converted to USD at the bucket-average rate covering that month, the USD
 * balance compounds monthly at the supplied yield (geometric monthly
 * equivalent of usdAnnualYield), and the final USD balance is reconverted
 * to local at `endRate`.
 *
 * Buckets are passed in by the caller — sourced from Phase C+ via
 * `marketDataService.getSync().historicalAnchors?.fxBuckets[code]`
 * (NOT `CurrencyRate.historicalBuckets` — historical data lives on
 * `MarketDataSnapshot.historicalAnchors` per the §3.3.5 lock).
 *
 * Timing: end-of-month (ordinary annuity). Month 1's contribution receives
 * no interest in month 1; from month 2 onward, the prior balance compounds
 * by one monthly period before the new contribution is added.
 *
 * Reference: docs/researches/btc-vs-assets-inflation-fx-final-analysis.md
 * Part 5 (Brazilian R$100/mo DCA validation scenarios B/C/D).
 */
export function calculateMonthlyPathDependentHedge(
  args: PathDependentHedgeArgs
): PathDependentHedgeResult {
  const { monthlyContributionLocal, usdAnnualYield, startDate, months, buckets, endRate } = args;

  if (months <= 0) {
    throw new Error('months must be > 0');
  }
  if (buckets.length === 0) {
    throw new Error('buckets must contain at least one FxBucket');
  }
  if (endRate <= 0) {
    throw new Error('endRate must be > 0');
  }

  const monthlyUsdRate = annualToMonthlyRate(usdAnnualYield);

  let usdBalance = 0;
  for (let m = 1; m <= months; m++) {
    if (m > 1) {
      usdBalance *= 1 + monthlyUsdRate;
    }
    const bucket = findBucketForMonth(startDate, m, buckets);
    if (bucket.avgRate <= 0) {
      throw new Error(`FxBucket avgRate must be > 0 (got ${bucket.avgRate})`);
    }
    usdBalance += monthlyContributionLocal / bucket.avgRate;
  }

  const finalBalanceUsd = usdBalance;
  const finalBalanceLocal = finalBalanceUsd * endRate;
  const totalContributedLocal = monthlyContributionLocal * months;
  const effectiveLocalCagr = solveAnnuityCagr(finalBalanceLocal, monthlyContributionLocal, months);

  return {
    totalContributedLocal,
    finalBalanceLocal,
    finalBalanceUsd,
    effectiveLocalCagr,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers — path-dependent hedge
// ---------------------------------------------------------------------------

/**
 * Find the bucket whose [startDate, endDate] window covers month `m` of the
 * DCA window starting at `startDate`. Month 1 = startDate; month m advances
 * (m-1) calendar months forward, anchored at day 1 of the month.
 */
function findBucketForMonth(
  windowStartDate: string,
  m: number,
  buckets: readonly FxBucket[]
): FxBucket {
  const anchor = new Date(`${windowStartDate}T00:00:00Z`);
  const monthDate = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + (m - 1), 1));
  const iso = toISODateString(monthDate);
  for (const b of buckets) {
    if (iso >= b.startDate && iso <= b.endDate) return b;
  }
  throw new Error(
    `No FxBucket covers month ${m} of DCA window (date ${iso}); buckets span [${buckets[0]?.startDate}, ${buckets[buckets.length - 1]?.endDate}]`
  );
}

/**
 * Solve the ordinary-annuity FV equation for the monthly rate r given:
 *   FV = PMT × ((1 + r)^n − 1) / r
 * then annualize r geometrically. Bisection over [0, 1] (monthly rate);
 * 60 iterations suffice for ~12-decimal precision on the monthly rate.
 *
 * Edge cases:
 *   - FV ≤ totalContributed → return 0 (no growth or loss; reported as 0% CAGR)
 *   - FV > realistic upper bound → returned at upper-bound annualized
 */
function solveAnnuityCagr(fv: number, pmt: number, n: number): number {
  const totalContributed = pmt * n;
  if (pmt <= 0 || n <= 0) return 0;
  if (fv <= totalContributed) return 0;

  let lo = 0;
  let hi = 1; // monthly rate of 100% → annualized 409600% — generous upper bound
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const fvMid = mid === 0 ? pmt * n : (pmt * (Math.pow(1 + mid, n) - 1)) / mid;
    if (fvMid < fv) lo = mid;
    else hi = mid;
  }
  const monthly = (lo + hi) / 2;
  return Math.pow(1 + monthly, MONTHS_PER_YEAR) - 1;
}
