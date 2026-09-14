'use client';

import Link from 'next/link';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import type { GoalState, LedgerState } from '@diboas/banking';
import type { SandboxLocale } from '@/i18n/config';
import { goalAccentIndex } from '@/lib/goalAccent';
import { selectGoalRowView } from '@/view/home';
import { LucideIcon } from './LucideIcon';
import styles from './GoalRow.module.css';

function Amount({ value }: { value: string }) {
  return (
    <FormattedNumber value={Number(value)} minimumFractionDigits={2} maximumFractionDigits={2} />
  );
}

/**
 * The shared goal row (extracted from HomeScreen — §4 item 1, DRY): icon,
 * name, current/target, progress bar, chevron. Used by Home and the
 * goals-list host. A non-active goal carries a calm status chip (W-17d
 * full-visibility: paused goals are visible-but-inactive, never hidden,
 * never shamed). NO pace claim renders anywhere — absent over false
 * (board §6a) until a ruled pace derivation exists.
 */
export function GoalRow({
  locale,
  goal,
  state,
  hasOpenPositions = false,
}: {
  locale: SandboxLocale;
  goal: GoalState;
  /**
   * VIEW-2: the row receives the ledger STATE and derives nothing itself. It
   * previously took `current: Decimal` as a prop, so a Decimal crossed the
   * component boundary from two different call sites and the ratio rule was
   * re-implemented here — the same clamp `selectGoalProgress` already owns.
   */
  state: LedgerState;
  /** Whether the goal has open positions — gates the honest half of the
   *  paused duality line ("Money still working" must never render when
   *  nothing is working). */
  hasOpenPositions?: boolean;
}) {
  const {
    current,
    target,
    ratioPercent: ratio,
    closed,
    paused,
  } = selectGoalRowView(state, goal.goalId);

  return (
    <Link
      href={`/${locale}/goals/${goal.goalId}`}
      className={styles.goalCard}
      data-closed={closed ? 'true' : undefined}
    >
      {/* The goal's own identity colour (founder 2026-08-21, mockup 02), so
          the same goal is recognisable at a glance on every surface. A paused
          goal keeps its calm neutral treatment — the pause is the message. */}
      <span
        className={paused ? styles.goalIconPaused : styles.goalIcon}
        data-accent={paused ? undefined : goalAccentIndex(goal.goalId)}
      >
        <LucideIcon name={paused ? 'pause' : goal.icon} size={22} />
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
        {closed ? (
          <span className={styles.statusChip}>
            <FormattedMessage id={`goalsList.status.${goal.status}`} />
          </span>
        ) : null}
      </span>
      {paused ? (
        // Mockup 02's paused duality, stated honestly: the second line only
        // when positions are actually still working (W-17d, never a false claim).
        <span className={styles.pausedStatus}>
          <span className={styles.pausedLine}>
            <FormattedMessage id="goalsList.pausedLine1" />
          </span>
          {hasOpenPositions ? (
            <span className={styles.pausedSub}>
              <FormattedMessage id="goalsList.pausedLine2" />
            </span>
          ) : null}
        </span>
      ) : null}
      <span className={styles.goalStatus} aria-hidden="true">
        <LucideIcon name="chevron-right" size={18} />
      </span>
    </Link>
  );
}
