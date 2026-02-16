/**
 * PreDemo Format Utilities
 *
 * Shared currency formatting for the PreDemo domain
 */

export function formatCurrency(amount: number, decimals = 2, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}
