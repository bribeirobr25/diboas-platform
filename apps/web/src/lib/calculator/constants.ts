/**
 * Future You Calculator - Constants
 *
 * Configuration for growth calculations
 */

import type { CalculatorConfig, RateScenario, ProjectionTimeframe } from './types';

/**
 * Default calculator configuration
 * Per CMO v2 spec: min $5, max $500000, step $5, default $20
 */
export const CALCULATOR_CONFIG: CalculatorConfig = {
  defaultCurrency: 'EUR',
  defaultInitialAmount: 0,
  defaultMonthlyContribution: 20,
  minInitialAmount: 0,
  maxInitialAmount: 1000000,
  minMonthlyContribution: 5,
  maxMonthlyContribution: 500000,
  monthlyContributionStep: 5, // Per CMO v2 spec
  defiApy: 8.0, // 8% APY for DeFi (Conservative per CMO v2 spec)
  bankApy: 0.5, // 0.5% APY for traditional savings (ECB average)
} as const;

/**
 * DeFi rate scenario
 */
export const DEFI_SCENARIO: RateScenario = {
  id: 'defi',
  name: 'DeFi Yield',
  apy: CALCULATOR_CONFIG.defiApy,
  description: 'Average stablecoin lending rate',
  isBank: false,
};

/**
 * Bank rate scenario
 */
export const BANK_SCENARIO: RateScenario = {
  id: 'bank',
  name: 'Traditional Bank',
  apy: CALCULATOR_CONFIG.bankApy,
  description: 'Average savings account rate',
  isBank: true,
};

/**
 * Timeframe configurations in days (short-term + long-term)
 */
export const TIMEFRAME_DAYS: Record<ProjectionTimeframe, number> = {
  // Short-term (for Dream Mode)
  '1week': 7,
  '1month': 30,
  '1year': 365,
  '5years': 1825,
  // Long-term (for Future You Calculator)
  '10years': 3650,
  '20years': 7300,
} as const;

/**
 * Long-term timeframes for Future You Calculator
 */
export const LONG_TERM_TIMEFRAMES: ('5years' | '10years' | '20years')[] = [
  '5years',
  '10years',
  '20years',
] as const;

/**
 * Timeframe labels by locale (short-term + long-term)
 */
export const TIMEFRAME_LABELS: Record<string, Record<ProjectionTimeframe, string>> = {
  en: {
    '1week': '1 Week',
    '1month': '1 Month',
    '1year': '1 Year',
    '5years': '5 Years',
    '10years': '10 Years',
    '20years': '20 Years',
  },
  de: {
    '1week': '1 Woche',
    '1month': '1 Monat',
    '1year': '1 Jahr',
    '5years': '5 Jahre',
    '10years': '10 Jahre',
    '20years': '20 Jahre',
  },
  'pt-BR': {
    '1week': '1 Semana',
    '1month': '1 Mês',
    '1year': '1 Ano',
    '5years': '5 Anos',
    '10years': '10 Anos',
    '20years': '20 Anos',
  },
  es: {
    '1week': '1 Semana',
    '1month': '1 Mes',
    '1year': '1 Año',
    '5years': '5 Años',
    '10years': '10 Años',
    '20years': '20 Años',
  },
} as const;

/**
 * Locale-based configuration for currency and bank rates
 * Different countries have different savings rates and currencies
 */
export const LOCALE_CONFIG: Record<string, { currency: string; bankApy: number }> = {
  en: { currency: 'USD', bankApy: 0.45 },      // US high-yield savings (FDIC)
  de: { currency: 'EUR', bankApy: 2.59 },      // EU ECB rate
  es: { currency: 'EUR', bankApy: 2.59 },      // EU ECB rate
  'pt-BR': { currency: 'BRL', bankApy: 6.71 }, // Brazil poupança (Selic-based)
} as const;

/**
 * Get locale-specific configuration
 */
export function getLocaleConfig(locale: string): { currency: string; bankApy: number } {
  return LOCALE_CONFIG[locale] || LOCALE_CONFIG['en'];
}

/**
 * Currency configurations
 */
export const CURRENCY_CONFIG: Record<string, { symbol: string; locale: string }> = {
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' },
  BRL: { symbol: 'R$', locale: 'pt-BR' },
  GBP: { symbol: '£', locale: 'en-GB' },
} as const;

/**
 * Calculator analytics events
 */
export const CALCULATOR_EVENTS = {
  CALCULATOR_OPENED: 'calculator_opened',
  CALCULATION_PERFORMED: 'calculation_performed',
  TIMEFRAME_CHANGED: 'calculator_timeframe_changed',
  INPUT_CHANGED: 'calculator_input_changed',
  SHARE_RESULT: 'calculator_share_result',
  CTA_CLICKED: 'calculator_cta_clicked',
} as const;
