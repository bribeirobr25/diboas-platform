/**
 * Goal Card Input Parameters
 *
 * Defines the inputs (contribution, duration, salary reference) for each goal card.
 * Outputs are computed at render time from these inputs + market data rates.
 *
 * See docs/audit/PREPARING_FOR_ANALYTICS_DATA.md Section 7.
 */

import type { SupportedLocale } from '@/lib/market-data';

export type GoalCardKey = 'retirement' | 'emergency' | 'christmas' | 'wealthy';

interface SalaryReference {
  readonly amount: number;
  readonly period: 'month' | 'year';
}

export interface GoalCardInputs {
  readonly initialAmount: number;
  readonly monthlyContribution: Record<SupportedLocale, number>;
  /** 0 = computed via monthsToInflationAdjustedTarget() (emergency fund) */
  readonly months: number;
  readonly salaryReference?: Record<SupportedLocale, SalaryReference>;
  /** Monthly spend per locale — emergency fund only */
  readonly spendReference?: Record<SupportedLocale, number>;
  /** Target = spendReference * targetMultiplier (e.g. 6 months of expenses) */
  readonly targetMultiplier?: number;
}

export const GOAL_CARD_INPUTS: Record<GoalCardKey, GoalCardInputs> = {
  retirement: {
    initialAmount: 0,
    monthlyContribution: { en: 100, 'pt-BR': 100, es: 100, de: 100 },
    months: 360,
    salaryReference: {
      en: { amount: 60000, period: 'year' },
      'pt-BR': { amount: 3467, period: 'month' },
      es: { amount: 35000, period: 'year' },
      de: { amount: 50000, period: 'year' },
    },
  },
  emergency: {
    initialAmount: 0,
    monthlyContribution: { en: 300, 'pt-BR': 270, es: 150, de: 200 },
    months: 0,
    spendReference: { en: 2900, 'pt-BR': 2700, es: 1500, de: 2000 },
    targetMultiplier: 6,
  },
  christmas: {
    initialAmount: 0,
    monthlyContribution: { en: 500, 'pt-BR': 345, es: 290, de: 415 },
    months: 12,
    salaryReference: {
      en: { amount: 60000, period: 'year' },
      'pt-BR': { amount: 3467, period: 'month' },
      es: { amount: 35000, period: 'year' },
      de: { amount: 50000, period: 'year' },
    },
  },
  wealthy: {
    initialAmount: 0,
    monthlyContribution: { en: 460, 'pt-BR': 270, es: 170, de: 220 },
    months: 60,
    salaryReference: {
      en: { amount: 4600, period: 'month' },
      'pt-BR': { amount: 2700, period: 'month' },
      es: { amount: 1700, period: 'month' },
      de: { amount: 2200, period: 'month' },
    },
  },
};

/** Card keys in display order */
export const GOAL_CARD_KEYS: GoalCardKey[] = ['wealthy', 'christmas', 'retirement', 'emergency'];
