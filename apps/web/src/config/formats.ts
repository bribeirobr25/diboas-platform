/**
 * Formats Configuration
 * Configuration Management: Centralized formatting constants
 * Internationalization: Locale-aware format definitions
 * Single Source of Truth: All date, currency, and number formats
 */

import { SupportedLocale } from '@diboas/i18n/server';

/**
 * Date format patterns
 */
export const DATE_FORMATS = {
  // ISO standard format
  ISO: 'YYYY-MM-DD',
  ISO_DATETIME: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  
  // Display formats
  DISPLAY_SHORT: 'MMM D, YYYY',
  DISPLAY_LONG: 'MMMM D, YYYY',
  DISPLAY_WITH_TIME: 'MMM D, YYYY h:mm A',
  
  // Locale-specific formats
  US_SHORT: 'MM/DD/YYYY',
  EU_SHORT: 'DD/MM/YYYY',
  
  // Relative time units
  RELATIVE_TIME_UNITS: ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'] as const,
} as const;

/**
 * Currency configurations
 */
export const CURRENCY_CONFIG = {
  // Default currency
  DEFAULT: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'USD',
  
  // Supported currencies
  SUPPORTED: ['USD', 'EUR', 'GBP', 'JPY', 'BRL', 'BTC', 'ETH'] as const,
  
  // Currency symbols
  SYMBOLS: {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    BRL: 'R$',
    BTC: '₿',
    ETH: 'Ξ'
  } as const,
  
  // Decimal places per currency
  DECIMALS: {
    USD: 2,
    EUR: 2,
    GBP: 2,
    JPY: 0,
    BRL: 2,
    BTC: 8,
    ETH: 18
  } as const,
} as const;

/**
 * Number format patterns
 */
export const NUMBER_FORMATS = {
  // Decimal separators by locale
  DECIMAL_SEPARATOR: {
    'en': '.',
    'pt-BR': ',',
    'es': ',',
    'de': ','
  } as const,
  
  // Thousand separators by locale
  THOUSAND_SEPARATOR: {
    'en': ',',
    'pt-BR': '.',
    'es': '.',
    'de': '.'
  } as const,
  
  // Percentage display
  PERCENTAGE_DECIMALS: 1,
  
  // Large number abbreviations
  ABBREVIATIONS: {
    THOUSAND: 'K',
    MILLION: 'M',
    BILLION: 'B',
    TRILLION: 'T'
  } as const,
} as const;

/**
 * Get locale-specific date format
 */
export function getDateFormatForLocale(locale: SupportedLocale): string {
  const formats: Record<SupportedLocale, string> = {
    'en': DATE_FORMATS.US_SHORT,
    'pt-BR': DATE_FORMATS.EU_SHORT,
    'es': DATE_FORMATS.EU_SHORT,
    'de': DATE_FORMATS.EU_SHORT
  };
  
  return formats[locale] || DATE_FORMATS.ISO;
}

/**
 * Get locale-specific currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_CONFIG.SYMBOLS[currency as keyof typeof CURRENCY_CONFIG.SYMBOLS] || currency;
}

/**
 * Get currency decimal places
 */
export function getCurrencyDecimals(currency: string): number {
  return CURRENCY_CONFIG.DECIMALS[currency as keyof typeof CURRENCY_CONFIG.DECIMALS] || 2;
}

/**
 * Format ISO date string for storage
 */
export function formatISODate(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Format date for display based on locale
 */
export function formatDisplayDate(date: Date, locale: SupportedLocale = 'en'): string {
  // This is a simple implementation - in production, use a proper date library
  return date.toLocaleDateString(locale);
}

/**
 * Format currency value
 */
export function formatCurrency(
  amount: number,
  currency: string = CURRENCY_CONFIG.DEFAULT,
  locale: SupportedLocale = 'en'
): string {
  const decimals = getCurrencyDecimals(currency);
  const symbol = getCurrencySymbol(currency);
  
  // Format number with locale
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
  
  // Add currency symbol (simplified - use Intl.NumberFormat with currency in production)
  return `${symbol}${formatted}`;
}

/**
 * Format large numbers with abbreviations
 */
export function formatLargeNumber(num: number, decimals: number = 1): string {
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (abs >= 1e12) {
    return sign + (abs / 1e12).toFixed(decimals) + NUMBER_FORMATS.ABBREVIATIONS.TRILLION;
  }
  if (abs >= 1e9) {
    return sign + (abs / 1e9).toFixed(decimals) + NUMBER_FORMATS.ABBREVIATIONS.BILLION;
  }
  if (abs >= 1e6) {
    return sign + (abs / 1e6).toFixed(decimals) + NUMBER_FORMATS.ABBREVIATIONS.MILLION;
  }
  if (abs >= 1e3) {
    return sign + (abs / 1e3).toFixed(decimals) + NUMBER_FORMATS.ABBREVIATIONS.THOUSAND;
  }
  
  return num.toString();
}

/**
 * Get number format for locale
 */
export function getNumberFormat(locale: SupportedLocale) {
  return {
    decimal: NUMBER_FORMATS.DECIMAL_SEPARATOR[locale] || '.',
    thousand: NUMBER_FORMATS.THOUSAND_SEPARATOR[locale] || ','
  };
}

// Export types
export type DateFormat = typeof DATE_FORMATS[keyof typeof DATE_FORMATS];
export type SupportedCurrency = typeof CURRENCY_CONFIG.SUPPORTED[number];
export type CurrencySymbol = typeof CURRENCY_CONFIG.SYMBOLS[keyof typeof CURRENCY_CONFIG.SYMBOLS];