'use client';

import { useState } from 'react';
import Link from 'next/link';
import Decimal from 'decimal.js';
import { FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import type { GoalState, LedgerState } from '@diboas/banking';
import type { SandboxLocale } from '@/i18n/config';
import { useLedger } from '@/hooks/useLedger';
import { goalCurrentValue } from '@/lib/goalValue';
import { GoalRow } from './GoalRow';
import { LucideIcon } from './LucideIcon';
import { SegmentedToggle } from './SegmentedToggle';
import styles from './GoalsListScreen.module.css';

function Amount({ value }: { value: Decimal }) {
  return (
    <FormattedNumber value={value.toNumber()} minimumFractionDigits={2} maximumFractionDigits={2} />
  );
}

/** Detailed view: one goal's source-separated money story (contributions vs
 *  strategy value vs lifetime earnings — never presented as one blob, the
 *  G12/UX-63 source-separation principle applied at list level). */
function GoalDetailCard({
  locale,
  goal,
  state,
}: {
  locale: SandboxLocale;
  goal: GoalState;
  state: LedgerState;
}) {
  const openValue = state.positions
    .filter((p) => p.goalId === goal.goalId && p.open)
    .reduce((sum, p) => sum.plus(p.principal).plus(p.accrued), new Decimal(0));
  return (
    <div className={styles.detailCard}>
      <Link href={`/${locale}/goals/${goal.goalId}`} className={styles.detailHead}>
        <span className={styles.detailIcon}>
          <LucideIcon name={goal.icon} size={18} />
        </span>
        <span className={styles.detailName}>{goal.name}</span>
        {goal.status !== 'active' ? (
          <span className={styles.statusChipInline}>
            <FormattedMessage id={`goalsList.status.${goal.status}`} />
          </span>
        ) : null}
        <LucideIcon name="chevron-right" size={16} />
      </Link>
      <dl className={styles.sourceRows}>
        <dt>
          <FormattedMessage id="goalsList.inGoal" />
        </dt>
        <dd>
          <Amount value={new Decimal(goal.cash)} />
        </dd>
        <dt>
          <FormattedMessage id="goalsList.working" />
        </dt>
        <dd>
          <Amount value={openValue} />
        </dd>
        <dt>
          <FormattedMessage id="goalsList.earned" />
        </dt>
        <dd>
          <Amount value={new Decimal(goal.earnings)} />
        </dd>
      </dl>
    </div>
  );
}

/**
 * Goals-list / portfolio host (§4 item 1; Stage-D: unmocked → derived from the
 * Home goal-row pattern). Simple = the shared GoalRow list; Detailed = per-goal
 * source-separation. Open goals (active + paused, W-17d visible-but-inactive)
 * lead; closed goals (accomplished/dropped) sit in a quiet subsection —
 * history stays visible (R-4), never celebrated or shamed. Read-only over the
 * projection; no sort, no filter (equal weight); no KPI strip (that's G12).
 */
export function GoalsListScreen({ locale }: { locale: SandboxLocale }) {
  const state = useLedger();
  const intl = useIntl();
  const [view, setView] = useState<'simple' | 'detailed'>('simple');

  const open = state.goals.filter((g) => g.status === 'active' || g.status === 'paused');
  const closed = state.goals.filter((g) => g.status === 'accomplished' || g.status === 'dropped');

  return (
    <section className={styles.wrap} aria-labelledby="goals-title">
      <h1 id="goals-title" className={styles.title}>
        <FormattedMessage id="goalsList.title" />
      </h1>
      <p className={styles.subtitle}>
        <FormattedMessage id="goalsList.subtitle" />
      </p>

      {open.length === 0 && closed.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <LucideIcon name="sprout" size={26} />
          </span>
          <p className={styles.emptyTitle}>
            <FormattedMessage id="home.noGoalsTitle" />
          </p>
          <p className={styles.emptyBody}>
            <FormattedMessage id="home.noGoalsBody" />
          </p>
        </div>
      ) : (
        <>
          <div className={styles.toggleRow}>
            <SegmentedToggle
              value={view}
              onChange={setView}
              ariaLabel={intl.formatMessage({ id: 'goalsList.viewToggle' })}
              segments={[
                { id: 'simple', label: intl.formatMessage({ id: 'goalsList.simple' }) },
                { id: 'detailed', label: intl.formatMessage({ id: 'goalsList.detailed' }) },
              ]}
            />
          </div>

          <ul className={styles.goals}>
            {open.map((goal) => (
              <li key={goal.goalId}>
                {view === 'simple' ? (
                  <GoalRow
                    locale={locale}
                    goal={goal}
                    current={goalCurrentValue(state, goal.goalId)}
                    hasOpenPositions={state.positions.some(
                      (p) => p.goalId === goal.goalId && p.open
                    )}
                  />
                ) : (
                  <GoalDetailCard locale={locale} goal={goal} state={state} />
                )}
              </li>
            ))}
          </ul>

          {closed.length > 0 ? (
            <>
              <h2 className={styles.closedTitle}>
                <FormattedMessage id="goalsList.closedTitle" />
              </h2>
              <ul className={styles.goals}>
                {closed.map((goal) => (
                  <li key={goal.goalId}>
                    <GoalRow
                      locale={locale}
                      goal={goal}
                      current={goalCurrentValue(state, goal.goalId)}
                    />
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      )}

      <Link href={`/${locale}/goals/new`} className={styles.createGoal}>
        <LucideIcon name="plus" size={18} />
        <FormattedMessage id="home.createGoal" />
      </Link>
    </section>
  );
}
