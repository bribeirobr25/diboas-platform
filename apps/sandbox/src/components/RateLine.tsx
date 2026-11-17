'use client';

import { FormattedMessage } from 'react-intl';
import { useDateFormat } from '@/hooks/useFormatters';
import type { StrategyRateDisplay } from '@/view/strategy';

type Displayable = Extract<StrategyRateDisplay, { displayable: true }>;

/**
 * A strategy's pool-rate line: the number and the words that state its origin
 * and age, always together (CAT-2, `5.814`).
 *
 * The line's kind and message id are decided in `view/strategy.ts` alone; this
 * component only formats them. It names no message id itself, so no surface can
 * pick a rate line by origin again (guard 8). The date is the raw `asOf`,
 * formatted in the reader's locale; kinds without a `{date}` carry none.
 */
export function RateLine({ display }: { display: Displayable }) {
  const formatDate = useDateFormat();
  const { label, apy } = display;
  return (
    <FormattedMessage
      id={label.id}
      values={{
        apy: apy.toDecimalPlaces(2).toNumber(),
        ...(label.asOf !== null ? { date: formatDate(label.asOf) } : {}),
      }}
    />
  );
}
