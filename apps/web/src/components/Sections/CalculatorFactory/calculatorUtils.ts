/**
 * Calculator utility functions, constants, and types.
 * Extracted from CalculatorFactory.tsx for file-size compliance.
 *
 * CURRENCY_CONFIG, parseLocaleNumber, and formatDecimal are re-exported
 * from @/lib/currency (single source of truth).
 */

export { CURRENCY_CONFIG, parseLocaleNumber, formatDecimal } from '@/lib/currency';

/** diBoaS receive fee — Receive Payments is FREE per Fee Lab v3.4 */
export const DIBOAS_RECEIVE_FEE = 0;

export const SCENARIO_RATES = { conservative: 4, historical: 7, optimistic: 10 } as const;
export const PERIOD_MULTIPLIERS = { month: 1 / 12, sixMonths: 0.5, year: 1 } as const;

export type PeriodKey = keyof typeof PERIOD_MULTIPLIERS;
export type ScenarioKey = keyof typeof SCENARIO_RATES;

export const SCENARIO_KEYS: ScenarioKey[] = ['conservative', 'historical', 'optimistic'];

/** Compute Step 2 result for a given scenario rate */
export function computeStep2(
  isCashflow: boolean,
  field1: number,
  field2: number,
  periodMultiplier: number,
  scenarioRate: number,
): number {
  if (isCashflow) {
    const savings = field1 * ((field2 - DIBOAS_RECEIVE_FEE) / 100) * 30 * periodMultiplier * 12;
    const growth = savings * (scenarioRate / 100) * periodMultiplier;
    return Math.round(savings + growth);
  }
  return Math.round(field1 * (scenarioRate / 100) * periodMultiplier);
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
