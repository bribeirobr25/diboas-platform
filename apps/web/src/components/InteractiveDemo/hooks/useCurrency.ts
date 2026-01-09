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

  const formatCurrency = useCallback((value: number, decimals = 2) => {
    const adjustedValue = value * currencyMultiplier;
    return `${currencySymbol}${adjustedValue.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  }, [currencySymbol, currencyMultiplier, locale]);

  return {
    isBrazil,
    isUS,
    currencySymbol,
    currencyMultiplier,
    formatCurrency,
  };
}
