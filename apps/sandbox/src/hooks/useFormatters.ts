'use client';

import { useCallback } from 'react';
import { useIntl } from 'react-intl';

/**
 * Locale-aware value formatting (SANDBOX_RULES R-3): currency symbol,
 * position, and separators come from Intl per locale — never concatenated.
 * Decimal strings cross this boundary as display-only numbers.
 */
export function useFormatters(currency: 'USD' | 'BRL' | 'EUR') {
  const intl = useIntl();

  const money = useCallback(
    (value: string | number) =>
      intl.formatNumber(typeof value === 'string' ? Number(value) : value, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }),
    [intl, currency]
  );

  /** Whole-currency (no cents) for compact summary surfaces like the jobs strip. */
  const moneyWhole = useCallback(
    (value: string | number) =>
      intl.formatNumber(typeof value === 'string' ? Number(value) : value, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }),
    [intl, currency]
  );

  const percent = useCallback(
    (value: number, digits = 2) =>
      intl.formatNumber(value, { maximumFractionDigits: digits, minimumFractionDigits: 0 }),
    [intl]
  );

  const date = useCallback(
    (iso: string) => intl.formatDate(new Date(iso), { dateStyle: 'medium' }),
    [intl]
  );

  return { money, moneyWhole, percent, date };
}
