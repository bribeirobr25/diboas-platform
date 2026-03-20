/**
 * Dream Mode - Constants
 *
 * Configuration constants for Dream Mode calculations and display
 * Data sourced from DeFiLlama historical analysis (May 2022 - Dec 2025)
 */

/**
 * Bank rate sources by locale for CLO compliance
 * - EN (US): Federal Reserve (FDIC National Average Savings)
 * - DE/ES: European Central Bank (ECB Deposit Facility Rate)
 * - PT-BR: Brazilian Central Bank (Poupanca / Selic-linked savings)
 */
export const BANK_RATE_SOURCES: Record<string, {
  rate: number;
  currencyDepreciation: number;
  source: string;
  translationKey: string;
}> = {
  en: {
    rate: 0.45,
    currencyDepreciation: 0,
    source: 'Federal Reserve',
    translationKey: 'dreamMode.results.bank_source_us',
  },
  de: {
    rate: 3.25,
    currencyDepreciation: 0,
    source: 'ECB Statistics',
    translationKey: 'dreamMode.results.bank_source_eu',
  },
  es: {
    rate: 3.25,
    currencyDepreciation: 0,
    source: 'ECB Statistics',
    translationKey: 'dreamMode.results.bank_source_eu',
  },
  'pt-BR': {
    rate: 7.50,
    currencyDepreciation: 0.06,
    source: 'Banco Central do Brasil',
    translationKey: 'dreamMode.results.bank_source_br',
  },
} as const;

export const DEFAULT_BANK_RATE_SOURCE = BANK_RATE_SOURCES['en'];
