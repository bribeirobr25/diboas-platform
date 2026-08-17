'use client';

import Link from 'next/link';
import Decimal from 'decimal.js';
import { FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import type { LedgerState } from '@diboas/banking';
import type { SandboxLocale } from '@/i18n/config';
import { goalCurrentValue } from '@/lib/goalValue';
import { LucideIcon } from './LucideIcon';
import styles from './HomeScreen.module.css';

/** Plain 2-decimal number (no currency symbol) — the mockup frames play money as
 *  a labelled "Play balance", not a currency. */
function Amount({ value }: { value: Decimal }) {
  return (
    <FormattedNumber value={value.toNumber()} minimumFractionDigits={2} maximumFractionDigits={2} />
  );
}

/** The big play-balance hero: integer bold, the decimal+cents muted and smaller
 *  (mockup 02). Locale-correct — the decimal separator comes from the formatter. */
function BalanceAmount({ value }: { value: Decimal }) {
  const intl = useIntl();
  const parts = intl.formatNumberToParts(value.toNumber(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (
    <>
      {parts.map((p, i) =>
        p.type === 'fraction' || p.type === 'decimal' ? (
          <span key={i} className={styles.balanceCents}>
            {p.value}
          </span>
        ) : (
          <span key={i}>{p.value}</span>
        )
      )}
    </>
  );
}

/**
 * Home — "your money's jobs" (B1; mockup 02). Play-balance hero, the
 * Available/Working/Emergency split, the goals list with progress + status, and
 * Create goal. The top bar + tab bar are the AppChrome shell.
 *
 * ⚠ Bucket mapping (DEFERRED_BACKEND_LEDGER): the mockup's money-jobs model
 * (available/working/emergency) is mapped onto the current ledger buckets
 * (floor/cushion/working) — available = undeployed (working+floor), working =
 * money committed to goals (uninvested goal cash + open positions' value),
 * emergency = cushion. The exact model + figures land with the D-r allocation
 * events; the goal "paused" status lands with D-e.
 *
 * The three tones sum to playBalance: funding a goal moves cash out of the
 * working bucket into goal.cash (engine GoalFunded), so goal.cash MUST be
 * counted here or the headline total silently understates the user's money.
 */
export function HomeScreen({ locale, state }: { locale: SandboxLocale; state: LedgerState }) {
  const available = new Decimal(state.buckets.working).plus(state.buckets.floor);
  const positionsValue = state.positions
    .filter((p) => p.open)
    .reduce((sum, p) => sum.plus(p.principal).plus(p.accrued), new Decimal(0));
  const goalCash = state.goals.reduce((sum, g) => sum.plus(g.cash), new Decimal(0));
  const working = positionsValue.plus(goalCash);
  const emergency = new Decimal(state.buckets.cushion);
  const playBalance = available.plus(working).plus(emergency);

  return (
    <section className={styles.wrap} aria-labelledby="home-title">
      <div className={styles.balanceBlock}>
        <p className={styles.balanceLabel}>
          <FormattedMessage id="home.playBalance" />
        </p>
        <h1 id="home-title" className={styles.balance}>
          <BalanceAmount value={playBalance} />
        </h1>
      </div>

      <div className={styles.split}>
        <div className={styles.splitCol}>
          <span className={styles.splitLabel}>
            <FormattedMessage id="home.available" />
          </span>
          <span className={`${styles.splitValue} ${styles.toneAvailable}`}>
            <Amount value={available} />
          </span>
        </div>
        <div className={styles.splitCol}>
          <span className={styles.splitLabel}>
            <FormattedMessage id="home.working" />
          </span>
          <span className={`${styles.splitValue} ${styles.toneWorking}`}>
            <Amount value={working} />
          </span>
        </div>
        <div className={styles.splitCol}>
          <span className={styles.splitLabel}>
            <FormattedMessage id="home.emergencyReserve" />
          </span>
          <span className={`${styles.splitValue} ${styles.toneEmergency}`}>
            <Amount value={emergency} />
          </span>
        </div>
      </div>

      <div className={styles.goalsHead}>
        <h2 className={styles.goalsTitle}>
          <FormattedMessage id="home.goalsTitle" />
        </h2>
        {/* "View all" -> goals list, which isn't built yet: disabled until it
            ships (founder 2026-08-16). All goals already render below in R1. */}
        {state.goals.length > 0 ? (
          <span className={styles.viewAll} data-disabled="true" aria-disabled="true">
            <FormattedMessage id="home.viewAll" />
          </span>
        ) : null}
      </div>

      {state.goals.length === 0 ? (
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
        <ul className={styles.goals}>
          {state.goals.map((goal) => {
            const current = goalCurrentValue(state, goal.goalId);
            const target = new Decimal(goal.targetAmount);
            const ratio = target.gt(0)
              ? Decimal.min(current.div(target), 1).mul(100).toNumber()
              : 0;
            return (
              <li key={goal.goalId}>
                <Link href={`/${locale}/goals/${goal.goalId}`} className={styles.goalCard}>
                  <span className={styles.goalIcon}>
                    <LucideIcon name={goal.icon} size={22} />
                  </span>
                  <span className={styles.goalBody}>
                    <span className={styles.goalName}>{goal.name}</span>
                    <span className={styles.goalAmounts}>
                      <Amount value={current} /> / <Amount value={target} />
                    </span>
                    <span
                      className={styles.progressTrack}
                      role="progressbar"
                      aria-label={goal.name}
                      aria-valuenow={Math.round(ratio)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <span className={styles.progressFill} style={{ width: `${ratio}%` }} />
                    </span>
                  </span>
                  <span className={styles.goalStatus} aria-hidden="true">
                    {/* No "on track" claim until pace status is derived from D-e
                        (goals-list increment) — a static label would be false. */}
                    <LucideIcon name="chevron-right" size={18} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Link href={`/${locale}/goals/new`} className={styles.createGoal}>
        <LucideIcon name="plus" size={18} />
        <FormattedMessage id="home.createGoal" />
      </Link>
    </section>
  );
}
