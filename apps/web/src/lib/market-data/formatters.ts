/**
 * Market Data Formatters
 *
 * Locale-aware formatting functions for financial values.
 * All formatting uses Intl APIs for proper locale handling.
 */

import type { SupportedLocale } from './types';

const LOCALE_MAP: Record<
  SupportedLocale,
  { intlLocale: string; currency: string; symbol: string }
> = {
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
  return `${new Intl.NumberFormat(intlLocale, {
    minimumFractionDigits: rate % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rate)}%`;
}

/**
 * Format an approximate rate with tilde prefix.
 * e.g. 7 → "~7%" (en), "~7%" (de)
 */
export function formatApproxRate(rate: number, locale: SupportedLocale): string {
  return `~${formatRate(rate, locale)}`;
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
  return amount >= 0 ? `+${formatted}` : `-${formatted}`;
}
