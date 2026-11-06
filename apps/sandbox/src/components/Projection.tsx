'use client';

import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { PROJECTION_POLICY } from '@diboas/investing';
import { useFormatters } from '@/hooks/useFormatters';
import type { ModelledAmount, Pace, ProjectionView, When } from '@/view/projection';
import { CoinGeckoAttribution } from './CoinGeckoAttribution';
import { LucideIcon } from './LucideIcon';
import styles from './Projection.module.css';

const PACE_MESSAGE_ID: Record<Pace, string> = {
  within: 'projection.paceWithin',
  edge: 'projection.paceEdge',
  beyond: 'projection.paceBeyond',
};

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

/**
 * The goal projection from OBSERVED pool rates (PR 2; private docs
 * `audit/WEBAPP_PLANS_2026-11-04/P3_PROJECTION_PR2.md`, wording approved 2026-11-05 v2).
 *
 * Renders only: the routing and the arithmetic are `selectGoalProjection`'s (VIEW-1); this
 * component formats — money in whole units, rates always to one decimal (a whole rate too), the oldest
 * leg's age as a relative time with `numeric: 'always'` ("1 day ago", never "yesterday").
 * Every outcome carries the tag, the disclosures and the caveat (CI-N4, Voice Q3). One polite
 * live region holds the changing body, so "loading" and then the result are announced (A11Y-05).
 */
export function Projection({
  view,
  target,
  currency,
  showAttribution,
}: {
  view: ProjectionView;
  target: string;
  currency: 'USD' | 'BRL' | 'EUR';
  /** The screen decides: one CoinGecko attribution per screen (P3 §2). */
  showAttribution: boolean;
}) {
  const intl = useIntl();
  const { moneyWhole, percent } = useFormatters(currency);
  // The moment the block is read; the age line is relative to it (no clock read per render).
  const [readAt] = useState(() => Date.now());
  if (view.kind === 'none') return null;

  const rate = (p: number) =>
    percent(p / 100, {
      minimumFractionDigits: PROJECTION_POLICY.rateDecimals,
      maximumFractionDigits: PROJECTION_POLICY.rateDecimals,
    });
  const cash = (m: ModelledAmount) => moneyWhole(m.amount);
  const when = (w: When) =>
    w.kind === 'underYear'
      ? intl.formatMessage({ id: 'projection.when.underYear' })
      : w.kind === 'single'
        ? intl.formatMessage({ id: 'projection.when.single' }, { years: w.years })
        : intl.formatMessage(
            { id: 'projection.when.range' },
            { minYears: w.minYears, maxYears: w.maxYears }
          );
  const age = (day: string) => {
    const ms = Math.max(0, readAt - Date.parse(`${day}T00:00:00Z`));
    const rtf = new Intl.RelativeTimeFormat(intl.locale, { numeric: 'always' });
    // A day-dated snapshot is at most this old; under a day, hours (never "0 days ago").
    return ms >= DAY_MS
      ? rtf.format(-Math.floor(ms / DAY_MS), 'day')
      : rtf.format(-Math.max(1, Math.floor(ms / HOUR_MS)), 'hour');
  };

  let body: React.ReactNode;
  if (view.kind === 'loading') {
    body = (
      <p className={styles.line}>
        <FormattedMessage id="projection.loading" />
      </p>
    );
  } else if (view.kind === 'unavailable') {
    body = (
      <p className={styles.line}>
        <FormattedMessage id="projection.unavailable" />
      </p>
    );
  } else {
    const range = {
      low: rate(view.range.lowPercent),
      high: rate(view.range.highPercent),
      window: view.range.windowMonths,
      target,
    };
    let line: React.ReactNode;
    let plan: ModelledAmount | null = null;
    if (view.kind === 'live') {
      plan = view.withPlan;
      line = plan ? (
        <FormattedMessage
          id="projection.live.withPlan"
          values={{ ...range, amount: cash(plan), when: when(view.when) }}
        />
      ) : (
        <FormattedMessage
          id="projection.live.noPlan"
          values={{ ...range, when: when(view.when) }}
        />
      );
    } else if (view.line === null) {
      // Case 3, no plan, no months left: the growth note and the disclosures carry the block.
      line = null;
    } else if (view.line.kind === 'withPlan') {
      plan = view.line.amount;
      line = (
        <FormattedMessage
          id="projection.simulated.withPlan"
          values={{ ...range, amount: cash(plan), when: when(view.line.when) }}
        />
      );
    } else if (view.line.kind === 'needed') {
      const a = view.line.amounts;
      const amounts =
        'kind' in a
          ? cash(a)
          : intl.formatMessage(
              { id: 'projection.amountRange' },
              { min: cash(a.min), max: cash(a.max) }
            );
      line = (
        <FormattedMessage
          id="projection.simulated.needed"
          values={{ ...range, amounts, months: view.line.monthsLeft }}
        />
      );
    } else if (view.line.kind === 'neededUpTo') {
      line = (
        <FormattedMessage
          id="projection.simulated.neededUpTo"
          values={{ ...range, max: cash(view.line.max), months: view.line.monthsLeft }}
        />
      );
    } else {
      line = (
        <FormattedMessage
          id="projection.simulated.alreadyEnough"
          values={{ ...range, months: view.line.monthsLeft }}
        />
      );
    }
    body = (
      <>
        <p className={styles.tag}>
          <FormattedMessage id="projection.tag" />
        </p>
        {view.kind === 'simulated' && view.growthNote ? (
          <p className={styles.line}>
            <FormattedMessage id="projection.growthNote" />
          </p>
        ) : null}
        {line ? <p className={styles.line}>{line}</p> : null}
        {view.kind === 'live' ? (
          <p className={styles.today}>
            {view.today.kind === 'single' ? (
              <FormattedMessage
                id="projection.live.today"
                values={{ rate: rate(view.today.ratePercent), age: age(view.today.asOf) }}
              />
            ) : (
              <FormattedMessage
                id="projection.live.todayRange"
                values={{
                  low: rate(view.today.lowPercent),
                  high: rate(view.today.highPercent),
                  age: age(view.today.asOf),
                }}
              />
            )}
          </p>
        ) : null}
        {view.kind === 'live' && view.pace ? (
          <p className={styles.pace}>
            <FormattedMessage
              id={PACE_MESSAGE_ID[view.pace.status]}
              values={{ months: view.pace.monthsLeft }}
            />
          </p>
        ) : null}
        <details className={styles.method}>
          <summary className={styles.methodSummary}>
            <FormattedMessage id="projection.method.summary" />
          </summary>
          <p className={styles.caveat}>
            <FormattedMessage id="projection.method.body" />
          </p>
          {plan ? (
            <p className={styles.caveat}>
              <FormattedMessage id="projection.method.plan" values={{ amount: cash(plan) }} />
            </p>
          ) : null}
        </details>
        <p className={styles.caveat}>
          <FormattedMessage id="projection.disclosure" />
        </p>
        <p className={styles.caveat}>
          <FormattedMessage id="projection.disclosureUsdPools" />
        </p>
        <p className={styles.caveat}>
          <FormattedMessage id="projection.caveat" />
        </p>
        {showAttribution ? <CoinGeckoAttribution /> : null}
      </>
    );
  }

  return (
    <section className={styles.wrap} data-testid="goal-projection">
      <p className={styles.heading}>
        <span className={styles.icon}>
          <LucideIcon name="trending-up" size={15} />
        </span>
        <FormattedMessage id="projection.heading" />
      </p>
      <div className={styles.body} aria-live="polite">
        {body}
      </div>
    </section>
  );
}
