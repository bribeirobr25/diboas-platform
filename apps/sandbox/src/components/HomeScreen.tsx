'use client';

import Link from 'next/link';
import Decimal from 'decimal.js';
import { FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import type { LedgerState } from '@diboas/banking';
import type { SandboxLocale } from '@/i18n/config';
import { goalCurrentValue } from '@/lib/goalValue';
import { GoalRow } from './GoalRow';
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
 * NB — Bucket mapping (DEFERRED_BACKEND_LEDGER): the mockup's money-jobs model
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
        {state.goals.length > 0 ? (
          <Link href={`/${locale}/goals`} className={styles.viewAll}>
            <FormattedMessage id="home.viewAll" />
          </Link>
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
          {state.goals.map((goal) => (
            <li key={goal.goalId}>
              <GoalRow
                locale={locale}
                goal={goal}
                current={goalCurrentValue(state, goal.goalId)}
                hasOpenPositions={state.positions.some((p) => p.goalId === goal.goalId && p.open)}
              />
            </li>
          ))}
        </ul>
      )}

      <Link href={`/${locale}/goals/new`} className={styles.createGoal}>
        <LucideIcon name="plus" size={18} />
        <FormattedMessage id="home.createGoal" />
      </Link>
    </section>
  );
}
