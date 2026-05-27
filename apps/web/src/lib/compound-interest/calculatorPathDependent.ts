/**
 * Compound Interest Calculator — path-dependent (retrospective) variant.
 *
 * Phase D.3 (2026-05-16) — third named engine alongside the lesson
 * (`calculateCompoundProjection`) and tool-smoothed (`calculateCompoundProjectionHedged`)
 * engines. Per R1 discipline at `docs/tech/financial-calculations.md`
 * §"Path-Dependent FX Hedge", this is a SEPARATE NAMED FUNCTION — NOT a
 * `pathDependent: boolean` flag on `calculateCompoundProjectionHedged`.
 *
 * Use case: retrospective DCA on `/tools/goal-savings`. "What would my Jan
 * 2010 → today DCA have produced, accounting for the actual BRL/USD path?"
 *
 * Math: for non-USD locales with historical FX bucket data on
 * `marketDataService.getSync().historicalAnchors.fxBuckets[CURRENCY]`,
 * walks the bucket-by-bucket path via `calculateMonthlyPathDependentHedge`
 * (Phase B, lib/market-data/formulas/currencyHedge.ts).
 *
 * For USD locale OR locales without historical buckets, gracefully falls
 * back to `calculateCompoundProjectionHedged` output — the smoothed model
 * is correct when the FX path is unknown or trivially flat (USD/USD).
 *
 * Scope:
 *   - `years` capped at 16 (max bucket coverage = 2026 - 2010). Throws
 *     `InvalidCalculatorInputError` if exceeded — UI must clamp.
 *   - Anchor end: `historicalAnchors.lastResearchUpdate` (May 2026 in v1).
 *   - Anchor start: `endDate − years × 12 months`.
 *   - Bank scenario stays in local currency (no FX hedge — same as the
 *     smoothed-hedge engine's bank scenario).
 */

import {
  calculateLumpSum,
  calculateMonthlyContributions,
  calculateMonthlyPathDependentHedge,
} from '@/lib/market-data/formulas';
import { marketDataService } from '@/lib/market-data/service';
import { LOCALE_CURRENCY } from '@/lib/market-data/constants';
import { calculateCompoundProjectionHedged } from './calculatorHedged';
import { convertCadenceToMonthly, isOneTime } from './cadence';
import { SCENARIO_RATES } from './scenarios';
import { INPUT_BOUNDS, MAX_RETROSPECTIVE_YEARS } from './constants';
import {
  type Cadence,
  type CalculatorInput,
  type CalculatorOutput,
  type ScenarioSeries,
  type SeriesKey,
  InvalidCalculatorInputError,
} from './types';
import type { FxBucket } from '@/lib/market-data';

const HIGHLIGHTED_DEFAULT = 'historical' as const;

export function calculateCompoundProjectionPathDependent(input: CalculatorInput): CalculatorOutput {
  validateInput(input);

  const snapshot = marketDataService.getSync();
  const currency = LOCALE_CURRENCY[input.locale];
  const historicalAnchors = snapshot.historicalAnchors;
  const buckets =
    currency === 'BRL'
      ? historicalAnchors?.fxBuckets.BRL
      : currency === 'EUR'
        ? historicalAnchors?.fxBuckets.EUR
        : undefined;

  // USD locale or missing bucket data → gracefully delegate to the smoothed
  // hedge engine. For USD this is byte-identical to the non-hedge lesson
  // engine; for non-USD without buckets the smoothed model is the best
  // available approximation.
  if (currency === 'USD' || !buckets || buckets.length === 0 || !historicalAnchors) {
    return calculateCompoundProjectionHedged(input);
  }

  const monthlyEquivalent = convertCadenceToMonthly(input.amount, input.cadence);
  const bankRate = snapshot.rates.bankRates[input.locale]?.savings ?? 0;
  const endDate = historicalAnchors.lastResearchUpdate;
  // Anchor end-rate: the final FX rate from the last bucket — the bucket
  // walk reconverts at this rate. Equivalent to spot rate at endDate.
  const endRate = buckets[buckets.length - 1]!.avgRate;

  const series: ScenarioSeries[] = [
    // Bank stays in local currency — no FX hedge regardless of mode.
    buildLocalSeries('bank', bankRate, input.amount, monthlyEquivalent, input.cadence, input.years),
    buildPathDependentSeries(
      'conservative',
      SCENARIO_RATES.conservative,
      input.amount,
      monthlyEquivalent,
      input.cadence,
      input.years,
      buckets,
      endDate,
      endRate
    ),
    buildPathDependentSeries(
      'historical',
      SCENARIO_RATES.historical,
      input.amount,
      monthlyEquivalent,
      input.cadence,
      input.years,
      buckets,
      endDate,
      endRate
    ),
    buildPathDependentSeries(
      'optimistic',
      SCENARIO_RATES.optimistic,
      input.amount,
      monthlyEquivalent,
      input.cadence,
      input.years,
      buckets,
      endDate,
      endRate
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

function buildLocalSeries(
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

function buildPathDependentSeries(
  scenario: SeriesKey,
  annualUsdRatePercent: number,
  amount: number,
  monthlyContribution: number,
  cadence: Cadence,
  years: number,
  buckets: readonly FxBucket[],
  endDate: string,
  endRate: number
): ScenarioSeries {
  const usdYield = annualUsdRatePercent / 100;

  if (isOneTime(cadence)) {
    // Lump-sum retrospective: convert at start bucket → compound USD → reconvert at endRate.
    const yearlyValues: number[] = [amount];
    for (let y = 1; y <= years; y++) {
      const startDate = computeStartDate(endDate, y);
      const startBucket = findBucketForDate(buckets, startDate);
      const usdPrincipal = amount / startBucket.avgRate;
      const usdValue = usdPrincipal * Math.pow(1 + usdYield, y);
      yearlyValues.push(usdValue * endRate);
    }
    return {
      scenario,
      rate: annualUsdRatePercent,
      yearlyValues,
      finalValue: yearlyValues[yearlyValues.length - 1] ?? 0,
    };
  }

  // Monthly DCA retrospective: each year-y datapoint asks "what if I had
  // started a y-year DCA ending today?" Phase B's bucket-walk does exactly
  // this; we call it once per year with months = y × 12.
  const yearlyValues: number[] = [0];
  for (let y = 1; y <= years; y++) {
    const startDate = computeStartDate(endDate, y);
    const result = calculateMonthlyPathDependentHedge({
      monthlyContributionLocal: monthlyContribution,
      usdAnnualYield: usdYield,
      startDate,
      months: y * 12,
      buckets,
      endRate,
    });
    yearlyValues.push(result.finalBalanceLocal);
  }
  return {
    scenario,
    rate: annualUsdRatePercent,
    yearlyValues,
    finalValue: yearlyValues[yearlyValues.length - 1] ?? 0,
  };
}

/** Walk `years × 12` months back from `endDate` to find the start of the DCA window. */
function computeStartDate(endDate: string, years: number): string {
  const end = new Date(`${endDate}T00:00:00Z`);
  const startYear = end.getUTCFullYear() - years;
  const startMonth = end.getUTCMonth();
  const d = new Date(Date.UTC(startYear, startMonth, 1));
  return d.toISOString().slice(0, 10);
}

function findBucketForDate(buckets: readonly FxBucket[], iso: string): FxBucket {
  for (const b of buckets) {
    if (iso >= b.startDate && iso <= b.endDate) return b;
  }
  // C9 close (2026-05-25): pre-fix, this returned `buckets[0]!` silently — a
  // coupling assumption that only held while bucket coverage exactly matched
  // `MAX_RETROSPECTIVE_YEARS`. A future refresh that shortened coverage would
  // silently use the wrong FX rate. validateInput's 16-year cap is the
  // upstream invariant; if a date still escapes it, fail loudly instead of
  // silently using BRL 2010 rates for a 1990 query.
  throw new InvalidCalculatorInputError(
    'years',
    `derived start date ${iso} falls outside FX bucket coverage (${buckets[0]?.startDate ?? '?'} → ${buckets[buckets.length - 1]?.endDate ?? '?'})`
  );
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
  if (input.years < INPUT_BOUNDS.years.min || input.years > MAX_RETROSPECTIVE_YEARS) {
    throw new InvalidCalculatorInputError(
      'years',
      `path-dependent retrospective requires years between ${INPUT_BOUNDS.years.min} and ${MAX_RETROSPECTIVE_YEARS} (bucket coverage cap)`
    );
  }
}
