/**
 * Comparison Table Input Parameters
 *
 * Defines the principal amount and period for the "$1,000 in 1 year" comparison.
 * Values are computed at render time from these inputs + market data rates.
 *
 * See docs/audit/PREPARING_FOR_ANALYTICS_DATA.md Section 8.
 */

import type { SupportedLocale } from '@/lib/market-data';

export interface ComparisonTableInputs {
  readonly principal: number;
  readonly currency: string;
  readonly period: number; // months
}

export const COMPARISON_TABLE_INPUTS: Record<SupportedLocale, ComparisonTableInputs> = {
  en: { principal: 1000, currency: 'USD', period: 12 },
  'pt-BR': { principal: 1000, currency: 'BRL', period: 12 },
  es: { principal: 1000, currency: 'EUR', period: 12 },
  de: { principal: 1000, currency: 'EUR', period: 12 },
};
