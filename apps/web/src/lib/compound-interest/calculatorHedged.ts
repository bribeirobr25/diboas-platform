/**
 * Compound Interest Calculator — currency-hedged variant.
 *
 * Per Phase-7 Q7(a) — the educational lesson at /learn/compound-interest uses
 * the non-hedged `calculateCompoundProjection` (calculator.ts). The three tool
 * pages (/tools/compound-interest, /tools/retirement, /tools/goal-savings)
 * use this hedged variant for non-USD locales so the diBoaS scenarios reflect
 * digital-dollar yield realistically converted to the user's local currency.
 *
 * Math (effective-rate model — canonical per `docs/tech/financial-calculations.md`):
 *   effectiveLocalAPY = (1 + usdYield) × (1 + localDepreciation) − 1
 *
 * For USD locales the depreciation is 0 so this collapses to the non-hedge
 * behavior — output is byte-identical to `calculateCompoundProjection` for en.
 *
 * Bank scenario stays at the locale savings rate WITHOUT hedge adjustment
 * because the user's bank pays in local currency, not USD.
 *
 * NEVER consolidate this with `calculateCompoundProjection` via a `hedge`
 * boolean flag — two distinct named functions per Q7(a) discipline.
 */

import {
  applyEffectiveRateClamp,
  calculateLumpSum,
  calculateMonthlyContributions,
  resolveHorizonMatchedDepreciation,
} from '@/lib/market-data/formulas';
import { marketDataService } from '@/lib/market-data/service';
import { LOCALE_CURRENCY } from '@/lib/market-data/constants';
import { convertCadenceToMonthly, isOneTime } from './cadence';
import { SCENARIO_RATES } from './scenarios';
import { INPUT_BOUNDS } from './constants';
import {
  type Cadence,
  type CalculatorInput,
  type CalculatorOutput,
  type ScenarioSeries,
  type SeriesKey,
  InvalidCalculatorInputError,
} from './types';

const HIGHLIGHTED_DEFAULT = 'historical' as const;

export function calculateCompoundProjectionHedged(input: CalculatorInput): CalculatorOutput {
  validateInput(input);

  const monthlyEquivalent = convertCadenceToMonthly(input.amount, input.cadence);
  const snapshot = marketDataService.getSync();
  const bankRate = snapshot.rates.bankRates[input.locale]?.savings ?? 0;

  // Phase D (TOOLS_IMPROVEMENT.md, 2026-05-23): horizon-matched continuous-window
  // CAGR via `resolveHorizonMatchedDepreciation` policy helper (prefers monthly
  // FX series, falls back to static `annualDepreciation` constant).
  const currency = LOCALE_CURRENCY[input.locale];
  const depreciation = resolveHorizonMatchedDepreciation(snapshot, currency, input.years);

  // C3 close (CTO-board v3 audit, 2026-05-26): every effective-rate site routes
  // through `applyEffectiveRateClamp` — the original C3 implementation only
  // covered the FV-shape and annuity-shape hedge functions, and this inline
  // compute-engine site bypassed the clamp. One helper, one event, all sites.
  const hedgedScenarioRate = (usdRatePercent: number): number => {
    if (depreciation === 0) return usdRatePercent;
    const usdYield = usdRatePercent / 100;
    const rawEffective = (1 + usdYield) * (1 + depreciation) - 1;
    const effective = applyEffectiveRateClamp(rawEffective, {
      source: 'calculateCompoundProjectionHedged',
      usdYield,
      depreciation,
    });
    return effective * 100;
  };

  const series: ScenarioSeries[] = [
    buildSeries('bank', bankRate, input.amount, monthlyEquivalent, input.cadence, input.years),
    buildSeries(
      'conservative',
      hedgedScenarioRate(SCENARIO_RATES.conservative),
      input.amount,
      monthlyEquivalent,
      input.cadence,
      input.years
    ),
    buildSeries(
      'historical',
      hedgedScenarioRate(SCENARIO_RATES.historical),
      input.amount,
      monthlyEquivalent,
      input.cadence,
      input.years
    ),
    buildSeries(
      'optimistic',
      hedgedScenarioRate(SCENARIO_RATES.optimistic),
      input.amount,
      monthlyEquivalent,
      input.cadence,
      input.years
    ),
  ];

  return {
    monthlyEquivalent,
    series,
    highlightedScenario: HIGHLIGHTED_DEFAULT,
    inputEcho: input,
    computedAt: Date.now(),
  };
}

function buildSeries(
  scenario: SeriesKey,
  annualRatePercent: number,
  amount: number,
  monthlyContribution: number,
  cadence: Cadence,
  years: number
): ScenarioSeries {
  if (isOneTime(cadence)) {
    const yearlyValues: number[] = [amount];
    for (let y = 1; y <= years; y++) {
      const result = calculateLumpSum(amount, annualRatePercent / 100, 0, y);
      yearlyValues.push(result.nominalFV);
    }
    return {
      scenario,
      rate: annualRatePercent,
      yearlyValues,
      finalValue: yearlyValues[yearlyValues.length - 1] ?? 0,
    };
  }

  const yearlyValues: number[] = [0];
  for (let y = 1; y <= years; y++) {
    const result = calculateMonthlyContributions(
      monthlyContribution,
      annualRatePercent / 100,
      0,
      y * 12
    );
    yearlyValues.push(result.nominalFV);
  }
  return {
    scenario,
    rate: annualRatePercent,
    yearlyValues,
    finalValue: yearlyValues[yearlyValues.length - 1] ?? 0,
  };
}

function validateInput(input: CalculatorInput): void {
  if (!Number.isFinite(input.amount)) {
    throw new InvalidCalculatorInputError('amount', 'must be a finite number');
  }
  if (input.amount < INPUT_BOUNDS.amount.min || input.amount > INPUT_BOUNDS.amount.max) {
    throw new InvalidCalculatorInputError(
      'amount',
      `must be between ${INPUT_BOUNDS.amount.min} and ${INPUT_BOUNDS.amount.max}`
    );
  }
  if (!Number.isFinite(input.years) || !Number.isInteger(input.years)) {
    throw new InvalidCalculatorInputError('years', 'must be an integer');
  }
  if (input.years < INPUT_BOUNDS.years.min || input.years > INPUT_BOUNDS.years.max) {
    throw new InvalidCalculatorInputError(
      'years',
      `must be between ${INPUT_BOUNDS.years.min} and ${INPUT_BOUNDS.years.max}`
    );
  }
}
