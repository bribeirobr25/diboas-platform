/**
 * Time-to-Target Calculator engine (Phase 2 §2.2 extraction, 2026-05-25).
 *
 * Inverse of compound interest: given a target + initial + recurring
 * contribution, return months to reach the target across 4 scenarios
 * (bank, conservative, historical, optimistic).
 *
 * Unit convention (CLAUDE.md):
 *   - `scenarioRates.*` / `bankRates.*.savings` are PERCENT → divide by 100.
 *   - `inflationRates.*` / `exchangeRates.*.annualDepreciation` are DECIMAL.
 *
 * R1 discipline: this is a separate named function from
 * `calculateEmergencyFundTimeline`. Both wrap `monthsToInflationAdjustedTarget`;
 * the time-to-target variant passes `annualInflation = 0` (nominal), the
 * emergency-fund variant passes the locale's `average5y` inflation
 * (inflation-adjusted). Never collapse behind `inflationAdjusted: boolean`.
 *
 * C15 close (cap alignment): `computeScenarioMonths` lump-sum loop and
 * `monthsToInflationAdjustedTarget` internal cap both bottom out at
 * `TIMELINE_MAX_MONTHS = 1200`. Single shared constant; both paths agree on
 * what "unreachable" means.
 *
 * SDK readiness: consumes `MarketDataSnapshot` — no direct constants imports.
 */

import {
  applyEffectiveRateClamp,
  calculateLumpSum,
  monthsToInflationAdjustedTarget,
  resolveHorizonMatchedDepreciation,
} from '@/lib/market-data/formulas';
import { LOCALE_CURRENCY } from '@/lib/market-data/constants';
import type { MarketDataSnapshot } from '@/lib/market-data/types';
import {
  convertCadenceToMonthly,
  isOneTime,
  SCENARIO_RATES,
  type Cadence,
} from '@/lib/compound-interest';
import type { SupportedLocale } from '@diboas/i18n/config';

/**
 * Shared cap for both the lump-sum loop AND the iterative
 * `monthsToInflationAdjustedTarget`. Closes C15 by consolidating the
 * "unreachable" boundary; before, the two paths shipped separately-written
 * caps that happened to align at 1200.
 */
export const TIMELINE_MAX_MONTHS = 1200;

/**
 * Time-to-target horizon estimate has a 40-year ceiling (vs emergency-fund's
 * matching 40-year cap added in Phase 2 §2.1). Audit-bundle F3 documents the
 * fallback when `contribution <= 0` as 10 years (vs emergency-fund's 5 — the
 * asymmetry is that time-to-target implies a longer horizon by construction).
 */
export const TIME_TO_TARGET_MAX_HORIZON_YEARS = 40;
export const TIME_TO_TARGET_FALLBACK_HORIZON_YEARS = 10;

export const TIME_TO_TARGET_SCENARIO_KEYS = [
  'bank',
  'conservative',
  'historical',
  'optimistic',
] as const;
export type TimeToTargetScenarioKey = (typeof TIME_TO_TARGET_SCENARIO_KEYS)[number];

export interface TimeToTargetInput {
  readonly target: number;
  readonly initialAmount: number;
  readonly contribution: number;
  readonly cadence: Cadence;
  readonly locale: SupportedLocale;
}

export interface TimeToTargetResult {
  readonly months: Readonly<Record<TimeToTargetScenarioKey, number | null>>;
  /** True if any scenario exceeds 360 months (over-30-years advisory) */
  readonly over30Years: boolean;
  /** True if non-USD locale → hedge applied to non-bank scenarios */
  readonly hedged: boolean;
  /** Monthly contribution after cadence conversion (0 for oneTime) */
  readonly monthlyContribution: number;
  /** Bank scenario rate (percent, NOT decimal) — for display */
  readonly bankRatePercent: number;
}

/**
 * Compute months to reach `target` for a single scenario.
 * Returns `null` if unreachable within `TIMELINE_MAX_MONTHS`.
 * Exported for direct testing (C17 close — composition logic is now testable
 * without rendering the React component).
 */
export function computeScenarioMonths(args: {
  target: number;
  initialAmount: number;
  monthlyContribution: number;
  annualRate: number;
}): number | null {
  const { target, initialAmount, monthlyContribution, annualRate } = args;
  if (target <= initialAmount) return 0;
  if (monthlyContribution <= 0) {
    // Lump-sum-only path: solve year-by-year via `calculateLumpSum`.
    if (initialAmount <= 0 || annualRate <= 0) return null;
    const maxYears = TIMELINE_MAX_MONTHS / 12;
    for (let years = 1; years <= maxYears; years++) {
      const fv = calculateLumpSum(initialAmount, annualRate, 0, years).nominalFV;
      if (fv >= target) return years * 12;
    }
    return null;
  }
  try {
    return monthsToInflationAdjustedTarget(
      target,
      monthlyContribution,
      annualRate,
      0,
      'end',
      initialAmount
    );
  } catch {
    return null;
  }
}

export function calculateTimeToTargetTimeline(
  input: TimeToTargetInput,
  snapshot: MarketDataSnapshot
): TimeToTargetResult {
  const bankRate = snapshot.rates.bankRates[input.locale]?.savings ?? 0;
  const currency = LOCALE_CURRENCY[input.locale];
  const estimatedHorizonYears =
    input.contribution > 0
      ? Math.max(
          1,
          Math.min(TIME_TO_TARGET_MAX_HORIZON_YEARS, input.target / (input.contribution * 12))
        )
      : TIME_TO_TARGET_FALLBACK_HORIZON_YEARS;
  const depreciation = resolveHorizonMatchedDepreciation(snapshot, currency, estimatedHorizonYears);

  // C3 close (CTO-board v3 audit, 2026-05-26): route inline hedge through the
  // shared clamp helper. Mirror of `calculatorHedged.ts:hedgedScenarioRate`.
  const hedge = (usdRatePercent: number): number => {
    if (depreciation === 0) return usdRatePercent;
    const usdYield = usdRatePercent / 100;
    const rawEffective = (1 + usdYield) * (1 + depreciation) - 1;
    const effective = applyEffectiveRateClamp(rawEffective, {
      source: 'calculateTimeToTargetTimeline',
      usdYield,
      depreciation,
    });
    return effective * 100;
  };

  const scenarioRatesPercent: Record<TimeToTargetScenarioKey, number> = {
    bank: bankRate,
    conservative: hedge(SCENARIO_RATES.conservative),
    historical: hedge(SCENARIO_RATES.historical),
    optimistic: hedge(SCENARIO_RATES.optimistic),
  };

  const monthlyContribution = isOneTime(input.cadence)
    ? 0
    : convertCadenceToMonthly(input.contribution, input.cadence);

  const months = {} as Record<TimeToTargetScenarioKey, number | null>;
  for (const key of TIME_TO_TARGET_SCENARIO_KEYS) {
    months[key] = computeScenarioMonths({
      target: input.target,
      initialAmount: input.initialAmount,
      monthlyContribution,
      annualRate: scenarioRatesPercent[key] / 100,
    });
  }

  const over30Years = TIME_TO_TARGET_SCENARIO_KEYS.some(
    (k) => months[k] !== null && (months[k] as number) > 360
  );

  return {
    months,
    over30Years,
    hedged: depreciation > 0,
    monthlyContribution,
    bankRatePercent: bankRate,
  };
}
