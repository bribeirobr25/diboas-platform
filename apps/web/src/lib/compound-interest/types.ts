/**
 * Compound Interest Domain Types
 *
 * Phase 1: educational calculator inputs/outputs.
 * Read-only dependency on lib/market-data for rates; no inverse coupling.
 */

import type { SupportedLocale } from '@diboas/i18n/config';
import type { ScenarioKey } from './scenarios';

export type Cadence =
  | 'oneTime'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'semiAnnual'
  | 'yearly';

export type SeriesKey = ScenarioKey | 'bank';

export interface CalculatorInput {
  /**
   * For recurring cadences (daily/weekly/monthly/quarterly/semiAnnual/yearly):
   * amount per cadence period in the user's locale currency.
   * For oneTime: principal of the single deposit at t=0.
   */
  amount: number;
  cadence: Cadence;
  /** 1–40 inclusive. Default 12 in the lesson defaults table. */
  years: number;
  locale: SupportedLocale;
}

export interface ScenarioSeries {
  scenario: SeriesKey;
  /** Annual rate as percentage (e.g. 7 for 7%). */
  rate: number;
  /** Year-by-year future value, length = years + 1 (year 0 .. years). */
  yearlyValues: number[];
  finalValue: number;
}

export interface CalculatorOutput {
  /** Cadence amount converted to monthly equivalent (365/52/1 multipliers). */
  monthlyEquivalent: number;
  /** Always [bank, conservative, historical, optimistic] in that order. */
  series: ScenarioSeries[];
  /** Which scenario the chart highlights by default. */
  highlightedScenario: ScenarioKey;
  inputEcho: CalculatorInput;
  /** Epoch ms — used for analytics deduping. */
  computedAt: number;
}

export class InvalidCalculatorInputError extends Error {
  constructor(
    public readonly field: keyof CalculatorInput,
    public readonly reason: string
  ) {
    super(`Invalid ${String(field)}: ${reason}`);
    this.name = 'InvalidCalculatorInputError';
  }
}
