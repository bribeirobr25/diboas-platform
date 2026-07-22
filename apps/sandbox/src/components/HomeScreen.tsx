'use client';

import Link from 'next/link';
import { useState } from 'react';
import Decimal from 'decimal.js';
import { FormattedMessage, useIntl } from 'react-intl';
import type { LedgerState } from '@diboas/banking';
import type { SandboxLocale } from '@/i18n/config';
import { useFormatters } from '@/hooks/useFormatters';
import { fetchHistories } from '@/hooks/useMarket';
import { advanceTime, resetSandbox } from '@/lib/ledgerClient';
import { resetProfile } from '@/lib/profileStore';
import { BottomSheet } from './BottomSheet';
import { CostAdjustSheet } from './CostAdjustSheet';
import { LucideIcon } from './LucideIcon';
import { MirrorStrip } from './MirrorStrip';
import styles from './HomeScreen.module.css';

/** Goal progress = cash + open positions' current value, against the target. */
function goalCurrent(state: LedgerState, goalId: string): Decimal {
  const goal = state.goals.find((g) => g.goalId === goalId);
  if (!goal) return new Decimal(0);
  let total = new Decimal(goal.cash);
  for (const p of state.positions) {
    if (p.goalId === goalId && p.open) total = total.plus(p.principal).plus(p.accrued);
  }
  return total;
}

/**
 * Home — the not-a-bank surface (R-3): GOALS are the hero; jobs appear as a
 * compact purpose strip (no single total-balance number, ever). The time
 * machine is an "Advance time" control that opens a bottom sheet.
 */
export function HomeScreen({
  locale,
  state,
  settledDays = 0,
}: {
  locale: SandboxLocale;
  state: LedgerState;
  /** WS-F: real days settled on this load (>0 shows the "while you were away" beat). */
  settledDays?: number;
}) {
  const intl = useIntl();
  const { money } = useFormatters(state.currency);
  const [advancing, setAdvancing] = useState(false);
  const [timeSheet, setTimeSheet] = useState(false);
  const [costSheet, setCostSheet] = useState(false);

  function handleReset() {
    if (window.confirm(intl.formatMessage({ id: 'common.resetConfirm' }))) {
      resetSandbox();
      resetProfile();
    }
  }

  async function advance(days: number) {
    setAdvancing(true);
    try {
      const histories = await fetchHistories(Math.max(state.simDay + days + 30, 120));
      advanceTime(days, histories);
    } catch {
      // Providers fail open server-side; a hard fetch failure leaves time unadvanced.
    } finally {
      setAdvancing(false);
      setTimeSheet(false);
    }
  }

  return (
    <section className={styles.wrap} aria-labelledby="home-title">
      <header className={styles.head}>
        <h1 id="home-title" className={styles.title}>
          <FormattedMessage id="home.title" />
        </h1>
        <button type="button" className={styles.timePill} onClick={() => setTimeSheet(true)}>
          <LucideIcon name="clock" size={15} />
          <FormattedMessage id="home.simDay" values={{ day: state.simDay }} />
        </button>
      </header>

      {settledDays > 0 && state.positions.some((p) => p.open) ? (
        <p className={styles.awayBeat} role="status">
          <LucideIcon name="clock" size={14} />
          <FormattedMessage id="home.awayBeat" values={{ days: settledDays }} />
        </p>
      ) : null}

      {/* Your picture (illustrative mirror, if income given) — context, not a
          split of the play money (D-M1). */}
      <MirrorStrip locale={locale} onAdjust={() => setCostSheet(true)} />

      {/* The Working play money to deploy — the hero for action. */}
      <div className={styles.workingBalance}>
        <span className={styles.workingBalanceLabel}>
          <LucideIcon name="sprout" size={15} />
          <FormattedMessage id="home.workingCard" />
        </span>
        <span className={styles.workingBalanceAmount}>{money(state.buckets.working)}</span>
        <span className={styles.workingBalanceNote}>
          <FormattedMessage id="home.workingBalanceNote" />
        </span>
      </div>

      <div className={styles.goalsHead}>
        <h2 className={styles.sectionTitle}>
          <FormattedMessage id="home.goalsTitle" />
        </h2>
        <Link href={`/${locale}/goals/new`} className={styles.newGoal}>
          <LucideIcon name="plus" size={16} />
          <FormattedMessage id="home.newGoal" />
        </Link>
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
          <Link href={`/${locale}/goals/new`} className={styles.emptyCta}>
            <FormattedMessage id="home.newGoal" />
          </Link>
        </div>
      ) : (
        <ul className={styles.goals}>
          {state.goals.map((goal) => {
            const current = goalCurrent(state, goal.goalId);
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
                    <span className={styles.goalProgressText}>
                      <FormattedMessage
                        id="goalDetail.progress"
                        values={{
                          current: money(current.toFixed(2)),
                          target: money(goal.targetAmount),
                        }}
                      />
                    </span>
                    <span
                      className={styles.progressTrack}
                      role="progressbar"
                      aria-valuenow={Math.round(ratio)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <span className={styles.progressFill} style={{ width: `${ratio}%` }} />
                    </span>
                  </span>
                  <span className={styles.goalPct}>{Math.round(ratio)}%</span>
                  <LucideIcon name="chevron-right" size={18} className={styles.goalChevron} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <button type="button" className={styles.reset} onClick={handleReset}>
        <FormattedMessage id="common.resetSandbox" />
      </button>

      {timeSheet ? (
        <BottomSheet titleId="home.timeMachineTitle" onClose={() => setTimeSheet(false)}>
          <p className={styles.timeNote}>
            <FormattedMessage id="home.timeMachineNote" />
          </p>
          <div className={styles.timeButtons}>
            <button
              type="button"
              className={styles.timeButton}
              onClick={() => void advance(30)}
              disabled={advancing}
            >
              <FormattedMessage id="home.advanceMonth" />
            </button>
            <button
              type="button"
              className={styles.timeButton}
              onClick={() => void advance(365)}
              disabled={advancing}
            >
              <FormattedMessage id="home.advanceYear" />
            </button>
          </div>
        </BottomSheet>
      ) : null}

      {costSheet ? <CostAdjustSheet locale={locale} onClose={() => setCostSheet(false)} /> : null}
    </section>
  );
}
