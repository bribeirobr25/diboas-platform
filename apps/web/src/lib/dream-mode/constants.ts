/**
 * Dream Mode - Constants
 *
 * Configuration constants for Dream Mode calculations and display
 * Data sourced from DeFiLlama historical analysis (May 2022 - Dec 2025)
 */

/**
 * Exchange rate config for locales where yield currency differs from local currency.
 * Null/undefined = yield currency matches local currency (no conversion needed).
 */
export interface ExchangeRateConfig {
  readonly localCurrency: string;
  readonly yieldCurrency: string;
  readonly currentRate: number;
  readonly annualDepreciation: number;
  readonly maxDepreciationYears: number;
  readonly rateDate: string;
  readonly depreciationBasis: string;
}

/**
 * Locale-specific financial configuration for bank rate comparisons.
 */
export interface LocaleFinancialConfig {
  readonly rate: number;
  readonly source: string;
  readonly translationKey: string;
  readonly exchangeRate?: ExchangeRateConfig;
}

/**
 * Bank rate sources by locale for CLO compliance
 * - EN (US): Federal Reserve (FDIC National Average Savings)
 * - DE/ES: European Central Bank (ECB Deposit Facility Rate)
 * - PT-BR: Brazilian Central Bank (Poupanca / Selic-linked savings)
 */
export const BANK_RATE_SOURCES: Record<string, LocaleFinancialConfig> = {
  en: {
    rate: 0.45,
    source: 'Federal Reserve',
    translationKey: 'dreamMode.results.bank_source_us',
  },
  de: {
    rate: 3.25,
    source: 'ECB Statistics',
    translationKey: 'dreamMode.results.bank_source_eu',
  },
  es: {
    rate: 3.25,
    source: 'ECB Statistics',
    translationKey: 'dreamMode.results.bank_source_eu',
  },
  'pt-BR': {
    rate: 7.50,
    source: 'Banco Central do Brasil',
    translationKey: 'dreamMode.results.bank_source_br',
    exchangeRate: {
      localCurrency: 'BRL',
      yieldCurrency: 'USD',
      currentRate: 5.2546,
      annualDepreciation: 0.12,
      maxDepreciationYears: 3,
      rateDate: '2026-03-15',
      depreciationBasis: '2-year average BRL/USD',
    },
  },
};

export const DEFAULT_BANK_RATE_SOURCE = BANK_RATE_SOURCES['en'];
