'use client';

import Link from 'next/link';
import Decimal from 'decimal.js';
import { FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import type { LedgerState } from '@diboas/banking';
import type { SandboxLocale } from '@/i18n/config';
import { goalCurrentValue } from '@/lib/goalValue';
import { dueSimulatedEvent } from '@/lib/simulatedEvents';
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
        {/* ABSENT OVER FALSE (board §6a, the rule this app already applies to
            pace claims). The emergency bucket's ONLY writer was `JobsSplitSet`,
            emitted by the MVP-0 first-run chain that was deleted in the R1
            re-audit — nothing produces it now, so this column could only ever
            read 0.00. Shown, it actively misleads: a user whose goal is LITERALLY
            named "Emergency fund" and holds $2,653 was told their emergency
            reserve was zero, right above it. The column returns by itself the
            day a producer exists (mockup 02's three-column design intact). */}
        {emergency.gt(0) ? (
          <div className={styles.splitCol}>
            <span className={styles.splitLabel}>
              <FormattedMessage id="home.emergencyReserve" />
            </span>
            <span className={`${styles.splitValue} ${styles.toneEmergency}`}>
              <Amount value={emergency} />
            </span>
          </div>
        ) : null}
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

      {/* G11 entry (§4.11) — and the POSTPONED state itself (mockup 45 is not
          a usable reference: it is a different product, a meditation app, so
          this is built from the Home grammar instead).

          Conditional, unlike the tiles below it, because it describes
          something that is actually waiting — and it is the only honest way
          to render "postponed-forever" (RD-9): a postponement is the ABSENCE
          of a resolution, so the card simply keeps being here. It must never
          gain a countdown, a badge, a count, or a second reminder — the moment
          it nags, it stops being a scenario the user can ignore. */}
      {dueSimulatedEvent(state, new Date().toISOString()) ? (
        <Link href={`/${locale}/practice-event`} className={styles.timeMachine}>
          <span className={styles.timeMachineIcon}>
            <LucideIcon name="receipt" size={20} />
          </span>
          <span className={styles.timeMachineBody}>
            <span className={styles.timeMachineTitle}>
              <FormattedMessage id="home.eventTitle" />
            </span>
            <span className={styles.timeMachineNote}>
              <FormattedMessage id="home.eventNote" />
            </span>
          </span>
          <LucideIcon name="chevron-right" size={18} />
        </Link>
      ) : null}

      {/* G10 entry (§4.10). Learned from G9: a route with no entry point is a
          dead surface, so the tile lands with the screen, not after an audit. */}
      <Link href={`/${locale}/weekly`} className={styles.timeMachine}>
        <span className={styles.timeMachineIcon}>
          <LucideIcon name="coins" size={20} />
        </span>
        <span className={styles.timeMachineBody}>
          <span className={styles.timeMachineTitle}>
            <FormattedMessage id="home.weeklyTitle" />
          </span>
          <span className={styles.timeMachineNote}>
            <FormattedMessage id="home.weeklyNote" />
          </span>
        </span>
        <LucideIcon name="chevron-right" size={18} />
      </Link>

      {/* G9 entry (§4.9). The builder had NO entry point when it shipped —
          reachable by URL only, which makes a surface dead no matter how well
          it works. G10's weekly ceremony may add its own contextual link to
          editing the system; creating one has to be reachable before then. */}
      <Link href={`/${locale}/rules`} className={styles.timeMachine}>
        <span className={styles.timeMachineIcon}>
          <LucideIcon name="sliders" size={20} />
        </span>
        <span className={styles.timeMachineBody}>
          <span className={styles.timeMachineTitle}>
            <FormattedMessage id="home.systemTitle" />
          </span>
          <span className={styles.timeMachineNote}>
            <FormattedMessage id="home.systemNote" />
          </span>
        </span>
        <LucideIcon name="chevron-right" size={18} />
      </Link>

      {/* G12 entry (§4.12). Always present: the report has an honest empty
          state, and the month is worth seeing while it is still running. */}
      <Link href={`/${locale}/month`} className={styles.timeMachine}>
        <span className={styles.timeMachineIcon}>
          <LucideIcon name="bar-chart" size={20} />
        </span>
        <span className={styles.timeMachineBody}>
          <span className={styles.timeMachineTitle}>
            <FormattedMessage id="home.monthTitle" />
          </span>
          <span className={styles.timeMachineNote}>
            <FormattedMessage id="home.monthNote" />
          </span>
        </span>
        <LucideIcon name="chevron-right" size={18} />
      </Link>

      {/* G8 entry (§4.8). Always present, never conditional on holding a
          position: the screen has an honest empty state that explains itself,
          and hiding the concept until money is at work would teach the lesson
          in the wrong order. `timeMachineNote` says the replay shows "what the
          market actually did" — a claim that only became TRUE with the price
          overlay; before it, the replay was yield-only and could never fall. */}
      <Link href={`/${locale}/time-machine`} className={styles.timeMachine}>
        <span className={styles.timeMachineIcon}>
          <LucideIcon name="history" size={20} />
        </span>
        <span className={styles.timeMachineBody}>
          <span className={styles.timeMachineTitle}>
            <FormattedMessage id="home.timeMachineTitle" />
          </span>
          <span className={styles.timeMachineNote}>
            <FormattedMessage id="home.timeMachineNote" />
          </span>
          <span className={styles.timeMachineDay}>
            <FormattedMessage id="home.simDay" values={{ day: state.simDay }} />
          </span>
        </span>
        <LucideIcon name="chevron-right" size={18} />
      </Link>
    </section>
  );
}
