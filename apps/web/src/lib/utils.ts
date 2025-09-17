import { CURRENCY_CONFIG, NUMBER_FORMATS } from '@/config/formats';

/**
 * Utility function to conditionally join class names
 * Similar to clsx but lightweight
 */
export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(
  amount: number,
  currency: string = CURRENCY_CONFIG.DEFAULT,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatPercentage(value: number, decimals: number = NUMBER_FORMATS.PERCENTAGE_DECIMALS): string {
  return `${value.toFixed(decimals)}%`;
}

// Re-export color utilities
export * from './utils/colors';