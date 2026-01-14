/**
 * Currency Hook
 *
 * Handles currency formatting based on locale
 */

import { useCallback, useMemo } from 'react';

interface UseCurrencyOptions {
  locale: string;
}

export function useCurrency({ locale }: UseCurrencyOptions) {
  const isBrazil = locale === 'pt-BR';
  const isUS = locale === 'en';

  const { currencySymbol, currencyMultiplier } = useMemo(() => ({
    currencySymbol: isBrazil ? 'R$' : isUS ? '$' : '€',
    currencyMultiplier: isBrazil ? 6 : 1, // Approximate EUR to BRL (USD ~= EUR for demo)
  }), [isBrazil, isUS]);

  // Format with currency conversion (for calculated values like balance, interest)
  const formatCurrency = useCallback((value: number, decimals = 2) => {
    const adjustedValue = value * currencyMultiplier;
    return `${currencySymbol}${adjustedValue.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  }, [currencySymbol, currencyMultiplier, locale]);

  // Format without conversion (for fixed amounts like user input options)
  const formatCurrencyRaw = useCallback((value: number, decimals = 2) => {
    return `${currencySymbol}${value.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  }, [currencySymbol, locale]);

  return {
    isBrazil,
    isUS,
    currencySymbol,
    currencyMultiplier,
    formatCurrency,
    formatCurrencyRaw,
  };
}
