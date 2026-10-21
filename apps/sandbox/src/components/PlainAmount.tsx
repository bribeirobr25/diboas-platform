'use client';

import { FormattedNumber } from 'react-intl';
import { unsignedZero } from '@/hooks/useFormatters';

/**
 * A two-decimal figure WITHOUT a currency symbol (lane audit 2026-10-21, C9): Home, the
 * goal row and the goals list each kept an identical private copy, and none applied the
 * zero rule every money figure passes through (`unsignedZero`), so a rounded `-0` would
 * have printed "-0.00" on those surfaces only. One component, one rule.
 */
export function PlainAmount({ value }: { value: string | number | { toNumber(): number } }) {
  const n =
    typeof value === 'string'
      ? Number(value)
      : typeof value === 'number'
        ? value
        : value.toNumber();
  return (
    <FormattedNumber
      value={unsignedZero(n, 2)}
      minimumFractionDigits={2}
      maximumFractionDigits={2}
    />
  );
}
