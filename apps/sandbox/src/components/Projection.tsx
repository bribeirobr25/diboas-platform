'use client';

import { FormattedMessage } from 'react-intl';
import { SCENARIO_RATES, projectionDisplay } from '@diboas/investing';
import { useFormatters } from '@/hooks/useFormatters';
import { LucideIcon } from './LucideIcon';
import styles from './Projection.module.css';

const PACE_MESSAGE_ID: Record<'within' | 'edge' | 'beyond', string> = {
  within: 'projection.paceWithin',
  edge: 'projection.paceEdge',
  beyond: 'projection.paceBeyond',
};

/**
 * The honest projection (C2): given a target and a monthly contribution, show
 * how long reaching it would take across the scenario envelope, as a RANGE of
 * years, not one deterministic line (UX-60 visualize uncertainty). Whole years
 * only (UX-61 no false precision). A calculator over stated assumptions
 * (UX-62), never a promise (Voice Q3) — the assumed rate range is named and the
 * caveat rides with the figure (UX-63). Renders nothing when there is no
 * monthly amount to project from (the caller decides whether to prompt).
 */
export function Projection({
  target,
  monthlyContribution,
  currentValue = 0,
  horizonMonths,
  currency,
}: {
  target: number;
  monthlyContribution: number;
  /** What the goal already holds (or is about to, in the wizard) — so "from
   *  here" is literal: the range projects the REMAINING gap, not the whole
   *  target from zero (M1 honesty fix). */
  currentValue?: number;
  /** The goal's own timeframe (months). When given, renders the WS-E on-track
   *  pace signal (a comparison, never a guarantee — Voice Q3). */
  horizonMonths?: number;
  currency: 'USD' | 'BRL' | 'EUR';
}) {
  const { money } = useFormatters(currency);
  if (!(monthlyContribution > 0) || !(target > 0)) return null;

  const remaining = target - Math.max(0, currentValue);
  // Already at (or past) the target from here → nothing to project.
  if (remaining <= 0) return null;

  // One pure source of truth for the displayed years AND the pace word, so the
  // two can never contradict at a rounding boundary (F-CLO-B3). "under a year"
  // avoids a false "1 years"; the pace derives from the displayed integers.
  const display = projectionDisplay(remaining, monthlyContribution, horizonMonths);
  if (!display) return null;
  const { underYear, minYears, maxYears, single, pace } = display;

  const baseValues = {
    amount: money(monthlyContribution.toFixed(2)),
    low: SCENARIO_RATES.conservative,
    high: SCENARIO_RATES.optimistic,
    target: money(target.toFixed(2)),
  };

  return (
    <div className={styles.wrap}>
      <p className={styles.heading}>
        <span className={styles.icon}>
          <LucideIcon name="trending-up" size={15} />
        </span>
        <FormattedMessage id="projection.heading" />
      </p>
      <p className={styles.line}>
        {underYear ? (
          <FormattedMessage id="projection.underYear" values={baseValues} />
        ) : single ? (
          <FormattedMessage
            id="projection.singleLine"
            values={{ ...baseValues, years: minYears }}
          />
        ) : (
          <FormattedMessage
            id="projection.rangeLine"
            values={{ ...baseValues, minYears, maxYears }}
          />
        )}
      </p>
      {pace && horizonMonths != null ? (
        <p className={styles.pace}>
          <FormattedMessage id={PACE_MESSAGE_ID[pace]} values={{ months: horizonMonths }} />
        </p>
      ) : null}
      <p className={styles.caveat}>
        <FormattedMessage id="projection.caveat" />
      </p>
    </div>
  );
}
