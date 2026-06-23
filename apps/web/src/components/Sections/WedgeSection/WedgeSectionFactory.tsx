'use client';

/**
 * WedgeSection — the per-market "truth" entry surface (Phase 4 redesign).
 *
 * One engine, four expressions: each locale enters through a different,
 * live-data-bound market truth (config in `config/wedge.ts`, figure resolved by
 * `useMarketWedge`). Presentational only; all copy is transcreated i18n and the
 * headline figure is market-data-bound (never hardcoded).
 */

import { WedgeSectionDefault } from './variants/Default';

type WedgeSectionVariant = 'default';

interface WedgeSectionProps {
  variant?: WedgeSectionVariant;
  /** Gates the `wedge_shown` impression event (default true). */
  enableAnalytics?: boolean;
  className?: string;
}

export function WedgeSection({ variant = 'default', ...props }: WedgeSectionProps) {
  switch (variant) {
    case 'default':
    default:
      return <WedgeSectionDefault {...props} />;
  }
}
