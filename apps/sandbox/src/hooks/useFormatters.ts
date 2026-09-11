'use client';

import { useCallback } from 'react';
import { useIntl } from 'react-intl';

/**
 * Locale-aware value formatting (SANDBOX_RULES R-3): currency symbol,
 * position, and separators come from Intl per locale — never concatenated.
 * Decimal strings cross this boundary as display-only numbers.
 */
/**
 * Zero is unsigned. Any value that DISPLAYS as zero at the given precision is
 * formatted as zero, never "-$0.00".
 *
 * A signed zero reached a money surface on 2026-09-11 (the split preview, from
 * a −1.4e-14 float residue). The domain fix removed that residue, but the rule
 * belongs here too, because every figure in the app passes through this seam
 * and a sign on nothing is always wrong. A REAL negative — a loss, a debit —
 * keeps its minus: only magnitudes below half the last displayed digit fold.
 */
function unsignedZero(value: number, fractionDigits: number): number {
  return Math.abs(value) < 0.5 * 10 ** -fractionDigits ? 0 : value;
}

export function useFormatters(currency: 'USD' | 'BRL' | 'EUR') {
  const intl = useIntl();

  const money = useCallback(
    (value: string | number) =>
      intl.formatNumber(unsignedZero(typeof value === 'string' ? Number(value) : value, 2), {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }),
    [intl, currency]
  );

  /** Whole-currency (no cents) for compact summary surfaces like the jobs strip. */
  const moneyWhole = useCallback(
    (value: string | number) =>
      intl.formatNumber(unsignedZero(typeof value === 'string' ? Number(value) : value, 0), {
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
    // Date-ONLY strings (e.g. FIXTURE_AS_OF '2026-07-18') parse as UTC
    // midnight per the ES spec, which renders the PREVIOUS day in any
    // UTC-negative timezone (the whole Americas — an off-by-one on a
    // compliance stamp). Appending T00:00:00 makes the parse LOCAL, so the
    // named day renders everywhere. Full timestamps pass through unchanged
    // (they are moments, not dates).
    (iso: string) =>
      intl.formatDate(new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00` : iso), {
        dateStyle: 'medium',
      }),
    [intl]
  );

  return { money, moneyWhole, percent, date };
}
