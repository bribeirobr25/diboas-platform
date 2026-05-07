/**
 * Locale-aware currency and percent formatters for the calculator.
 *
 * Uses Intl.NumberFormat — handles separator conventions per locale automatically
 * (US: $1,234.56 / pt-BR: R$ 1.234,56 / es+de: 1.234,56 €).
 */

import type { SupportedLocale } from '@diboas/i18n/config';

const LOCALE_TO_INTL: Readonly<Record<SupportedLocale, string>> = {
  en: 'en-US',
  'pt-BR': 'pt-BR',
  es: 'es-ES',
  de: 'de-DE',
};

const LOCALE_TO_CURRENCY: Readonly<Record<SupportedLocale, string>> = {
  en: 'USD',
  'pt-BR': 'BRL',
  es: 'EUR',
  de: 'EUR',
};

export function getCurrencyCode(locale: SupportedLocale): string {
  return LOCALE_TO_CURRENCY[locale];
}

export function formatCurrency(
  value: number,
  locale: SupportedLocale,
  opts?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(LOCALE_TO_INTL[locale], {
    style: 'currency',
    currency: LOCALE_TO_CURRENCY[locale],
    maximumFractionDigits: 0,
    ...opts,
  }).format(value);
}

export function formatPercent(value: number, locale: SupportedLocale): string {
  return new Intl.NumberFormat(LOCALE_TO_INTL[locale], {
    style: 'percent',
    maximumFractionDigits: 2,
  }).format(value / 100);
}
