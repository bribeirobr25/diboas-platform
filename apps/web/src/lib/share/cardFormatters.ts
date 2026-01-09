/**
 * Card Formatters
 *
 * Formatting utilities for card rendering
 */

import type { CardLocale } from './types';

/**
 * Locale mapping for Intl formatting
 */
const LOCALE_MAP: Record<CardLocale, string> = {
  en: 'en-US',
  de: 'de-DE',
  'pt-BR': 'pt-BR',
  es: 'es-ES',
};

/**
 * Format currency amount with locale
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale: CardLocale
): string {
  return new Intl.NumberFormat(LOCALE_MAP[locale], {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with locale
 */
export function formatNumber(value: number, locale: CardLocale): string {
  return new Intl.NumberFormat(LOCALE_MAP[locale]).format(value);
}
