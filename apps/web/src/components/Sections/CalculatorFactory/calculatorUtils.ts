/**
 * Calculator utility functions, constants, and types.
 * Extracted from CalculatorFactory.tsx for file-size compliance.
 *
 * CURRENCY_CONFIG, parseLocaleNumber, and formatDecimal are re-exported
 * from @/lib/currency (single source of truth).
 */

export { CURRENCY_CONFIG, parseLocaleNumber, formatDecimal } from '@/lib/currency';
import { futureValue, apyToMonthlyRate } from '@/lib/utils/financialMath';

/** diBoaS receive fee — Receive Payments is FREE per Fee Lab v3.4 */
export const DIBOAS_RECEIVE_FEE = 0;

export const SCENARIO_RATES = { conservative: 4, historical: 7, optimistic: 10 } as const;
export const PERIOD_MULTIPLIERS = { month: 1 / 12, sixMonths: 0.5, year: 1 } as const;

export type PeriodKey = keyof typeof PERIOD_MULTIPLIERS;
export type ScenarioKey = keyof typeof SCENARIO_RATES;

export const SCENARIO_KEYS: ScenarioKey[] = ['conservative', 'historical', 'optimistic'];

/** Compute Step 2 result for a given scenario rate (compound interest) */
export function computeStep2(
  isCashflow: boolean,
  field1: number,
  field2: number,
  periodMultiplier: number,
  scenarioRate: number,
): number {
  const months = Math.round(periodMultiplier * 12);
  const rate = apyToMonthlyRate(scenarioRate);

  if (isCashflow) {
    // Fee savings arrive monthly — they are the PMT, not the initial amount
    const monthlySavings = field1 * ((field2 - DIBOAS_RECEIVE_FEE) / 100) * 30;
    return Math.round(futureValue(0, monthlySavings, rate, months));
  }

  // Treasury: idle cash is a lump sum from day 1 — return only the GROWTH
  return Math.round(futureValue(field1, 0, rate, months) - field1);
}

export type ScenarioRateOverrides = Partial<Record<ScenarioKey, number>>;

/** Resolve scenario rates with optional overrides (e.g., from analytics API). */
export function resolveScenarioRates(overrides?: ScenarioRateOverrides): Record<ScenarioKey, number> {
  if (!overrides) return { ...SCENARIO_RATES };
  return {
    conservative: (overrides.conservative && overrides.conservative > 0) ? overrides.conservative : SCENARIO_RATES.conservative,
    historical: (overrides.historical && overrides.historical > 0) ? overrides.historical : SCENARIO_RATES.historical,
    optimistic: (overrides.optimistic && overrides.optimistic > 0) ? overrides.optimistic : SCENARIO_RATES.optimistic,
  };
}

/** Compute Step 1 value */
export function computeStep1(
  isCashflow: boolean,
  field1: number,
  field2: number,
  periodMultiplier: number,
): number {
  if (isCashflow) {
    return Math.round(field1 * (field2 / 100) * 30 * periodMultiplier * 12);
  }
  return Math.round(field1 * (field2 / 100) * periodMultiplier);
}
