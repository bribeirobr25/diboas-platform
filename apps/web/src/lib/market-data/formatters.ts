/**
 * Market Data Formatters
 *
 * Locale-aware formatting functions for financial values.
 * All formatting uses Intl APIs for proper locale handling.
 */

import type { SupportedLocale } from './types';

const LOCALE_MAP: Record<SupportedLocale, { intlLocale: string; currency: string; symbol: string }> = {
  en: { intlLocale: 'en-US', currency: 'USD', symbol: '$' },
  'pt-BR': { intlLocale: 'pt-BR', currency: 'BRL', symbol: 'R$' },
  de: { intlLocale: 'de-DE', currency: 'EUR', symbol: '\u20AC' },
  es: { intlLocale: 'es-ES', currency: 'EUR', symbol: '\u20AC' },
};

/**
 * Format a rate as a locale-appropriate percentage string.
 * e.g. 0.32 → "0.32%" (en), "0,32%" (de)
 */
export function formatRate(rate: number, locale: SupportedLocale): string {
  const { intlLocale } = LOCALE_MAP[locale];
  return new Intl.NumberFormat(intlLocale, {
    minimumFractionDigits: rate % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rate) + '%';
}

/**
 * Format an approximate rate with tilde prefix.
 * e.g. 7 → "~7%" (en), "~7%" (de)
 */
export function formatApproxRate(rate: number, locale: SupportedLocale): string {
  return '~' + formatRate(rate, locale);
}

/**
 * Format a currency amount with locale symbol and proper grouping.
 * e.g. 116945 → "$116,945" (en), "R$116.945" (pt-BR), "116.945 €" (de)
 */
export function formatCurrency(amount: number, locale: SupportedLocale): string {
  const { intlLocale, currency } = LOCALE_MAP[locale];
  return new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/**
 * Format a currency amount with sign prefix for gains.
 * e.g. 4932 → "+$4,932" (en), "+R$4.932" (pt-BR)
 */
export function formatGain(amount: number, locale: SupportedLocale): string {
  const formatted = formatCurrency(Math.abs(amount), locale);
  return amount >= 0 ? '+' + formatted : '-' + formatted;
}

/**
 * Format a 1-year return from principal + rate.
 * e.g. principal=1000, rate=0.32 → "+$3" (en)
 */
export function formatReturn(principal: number, rate: number, locale: SupportedLocale): string {
  const gain = Math.round(principal * (rate / 100));
  return formatGain(gain, locale);
}

/**
 * Format a compact currency amount for tight spaces (titleSummary).
 * e.g. 101508 → "R$101k" (pt-BR), 4932 → "$4.9k" (en)
 */
export function formatCompactCurrency(amount: number, locale: SupportedLocale): string {
  const { symbol } = LOCALE_MAP[locale];
  const abs = Math.abs(amount);

  if (abs >= 1000) {
    const k = abs / 1000;
    const formatted = k >= 10
      ? Math.round(k).toString() + 'k'
      : k.toFixed(1).replace(/\.0$/, '') + 'k';
    return symbol + formatted;
  }

  return formatCurrency(amount, locale);
}

/**
 * Format a time difference for emergency fund cards.
 * e.g. 15 → "~15 months" (en), "~15 meses" (es), "~15 Monate" (de), "~15 meses" (pt-BR)
 */
export function formatTimeDifference(months: number, locale: SupportedLocale): string {
  const labels: Record<SupportedLocale, string> = {
    en: 'months',
    'pt-BR': 'meses',
    es: 'meses',
    de: 'Monate',
  };
  return `~${months} ${labels[locale]}`;
}

/**
 * Get the locale config for a supported locale.
 */
export function getLocaleConfig(locale: SupportedLocale) {
  return LOCALE_MAP[locale];
}
