/**
 * Calculator utility functions, constants, and types.
 * Extracted from CalculatorFactory.tsx for file-size compliance.
 */

export const CURRENCY_CONFIG: Record<string, { currency: string; locale: string; symbol: string }> = {
  en: { currency: 'USD', locale: 'en-US', symbol: '$' },
  de: { currency: 'EUR', locale: 'de-DE', symbol: '€' },
  es: { currency: 'EUR', locale: 'es-ES', symbol: '€' },
  'pt-BR': { currency: 'BRL', locale: 'pt-BR', symbol: 'R$' },
};

/** diBoaS receive fee — Receive Payments is FREE per Fee Lab v3.4 */
export const DIBOAS_RECEIVE_FEE = 0;

export const SCENARIO_RATES = { conservative: 4, historical: 7, optimistic: 10 } as const;
export const PERIOD_MULTIPLIERS = { month: 1 / 12, sixMonths: 0.5, year: 1 } as const;

export type PeriodKey = keyof typeof PERIOD_MULTIPLIERS;
export type ScenarioKey = keyof typeof SCENARIO_RATES;

export const SCENARIO_KEYS: ScenarioKey[] = ['conservative', 'historical', 'optimistic'];

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

/** Compute Step 2 result for a given scenario rate */
export function computeStep2(
  isCashflow: boolean,
  field1: number,
  field2: number,
  periodMultiplier: number,
  scenarioRate: number,
): number {
  if (isCashflow) {
    const savings = field1 * ((field2 - DIBOAS_RECEIVE_FEE) / 100) * 30 * periodMultiplier * 12;
    const growth = savings * (scenarioRate / 100) * periodMultiplier;
    return Math.round(savings + growth);
  }
  return Math.round(field1 * (scenarioRate / 100) * periodMultiplier);
}

/** Compute Step 1 value */
export function computeStep1(
  isCashflow: boolean,
  field1: number,
  field2: number,
  periodMultiplier: number,
): number {
  if (isCashflow) {
    return Math.round(field1 * (field2 / 100) * 30 * periodMultiplier * 12);
  }
  return Math.round(field1 * (field2 / 100) * periodMultiplier);
}
