/**
 * Shared currency configuration and formatting utilities.
 * Single source of truth — used by CalculatorFactory and GoalCalculator.
 */

export const CURRENCY_CONFIG: Record<string, { currency: string; locale: string; symbol: string }> = {
  en: { currency: 'USD', locale: 'en-US', symbol: '$' },
  de: { currency: 'EUR', locale: 'de-DE', symbol: '€' },
  es: { currency: 'EUR', locale: 'es-ES', symbol: '€' },
  'pt-BR': { currency: 'BRL', locale: 'pt-BR', symbol: 'R$' },
};

/**
 * Parse a locale-aware numeric string (handles both comma and period decimals).
 * Accepts "2,5" (DE/PT-BR) and "2.5" (EN/ES) → returns 2.5
 */
export function parseLocaleNumber(value: string): number {
  const cleaned = value.replace(/[^0-9.,]/g, '');
  const hasComma = cleaned.includes(',');
  const hasPeriod = cleaned.includes('.');
  if (hasComma && hasPeriod) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
    }
    return parseFloat(cleaned.replace(/,/g, '')) || 0;
  }
  if (hasComma) {
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      return parseFloat(cleaned.replace(',', '.')) || 0;
    }
    return parseFloat(cleaned.replace(/,/g, '')) || 0;
  }
  return parseFloat(cleaned) || 0;
}

/**
 * Format a decimal number for display in a locale-aware way.
 */
export function formatDecimal(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
