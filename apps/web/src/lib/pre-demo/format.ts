/**
 * PreDemo Format Utilities
 *
 * Locale-aware currency formatting for the PreDemo domain.
 * Uses centralized LOCALE_CURRENCY_MAP from config/formats.
 */

import type { SupportedLocale } from '@diboas/i18n/server';
import { getCurrencyForLocale, getIntlLocale } from '@/config/formats';

export function formatCurrency(amount: number, decimals = 2, locale: SupportedLocale = 'en'): string {
  const currency = getCurrencyForLocale(locale);
  const intlLocale = getIntlLocale(locale);

  return new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}
