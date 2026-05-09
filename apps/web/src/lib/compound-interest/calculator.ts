/**
 * Compound Interest Calculator engine.
 *
 * Composes calculateMonthlyContributions() from lib/market-data/formulas.ts —
 * never re-implements compound math (CLAUDE.md prevention rule #1).
 *
 * Educational scope: scenarioRates only (4/7/10) + locale bank rate.
 * No diBoaS Safety/Balance/Growth APYs — those are product-marketing
 * claims and intentionally kept off the educational tool (GTM Playbook §6.7).
 *
 * No currency hedge: this is a "how compound interest works" lesson, not
 * a real-purchasing-power projection. annualInflation is always 0 in the
 * underlying formula call (same rationale as the hedge exclusion).
 */

import { calculateMonthlyContributions } from '@/lib/market-data/formulas';
import { marketDataService } from '@/lib/market-data/service';
import { convertCadenceToMonthly } from './cadence';
import { SCENARIO_RATES } from './scenarios';
import { INPUT_BOUNDS } from './constants';
import {
  type CalculatorInput,
  type CalculatorOutput,
  type ScenarioSeries,
  type SeriesKey,
  InvalidCalculatorInputError,
} from './types';

const HIGHLIGHTED_DEFAULT = 'historical' as const;

export function calculateCompoundProjection(input: CalculatorInput): CalculatorOutput {
  validateInput(input);

  const monthlyEquivalent = convertCadenceToMonthly(input.amount, input.cadence);

  const bankRate =
    marketDataService.getSync().rates.bankRates[input.locale]?.savings ?? 0;

  const series: ScenarioSeries[] = [
    buildSeries('bank', bankRate, monthlyEquivalent, input.years),
    buildSeries('conservative', SCENARIO_RATES.conservative, monthlyEquivalent, input.years),
    buildSeries('historical', SCENARIO_RATES.historical, monthlyEquivalent, input.years),
    buildSeries('optimistic', SCENARIO_RATES.optimistic, monthlyEquivalent, input.years),
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
  monthlyContribution: number,
  years: number,
): ScenarioSeries {
  const yearlyValues: number[] = [0];
  for (let y = 1; y <= years; y++) {
    const result = calculateMonthlyContributions(
      monthlyContribution,
      annualRatePercent / 100,
      0,
      y * 12,
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
      `must be between ${INPUT_BOUNDS.amount.min} and ${INPUT_BOUNDS.amount.max}`,
    );
  }
  if (!Number.isFinite(input.years) || !Number.isInteger(input.years)) {
    throw new InvalidCalculatorInputError('years', 'must be an integer');
  }
  if (input.years < INPUT_BOUNDS.years.min || input.years > INPUT_BOUNDS.years.max) {
    throw new InvalidCalculatorInputError(
      'years',
      `must be between ${INPUT_BOUNDS.years.min} and ${INPUT_BOUNDS.years.max}`,
    );
  }
}
