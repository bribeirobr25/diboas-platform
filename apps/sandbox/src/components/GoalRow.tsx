'use client';

import Link from 'next/link';
import Decimal from 'decimal.js';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import type { GoalState } from '@diboas/banking';
import type { SandboxLocale } from '@/i18n/config';
import { LucideIcon } from './LucideIcon';
import styles from './GoalRow.module.css';

function Amount({ value }: { value: Decimal }) {
  return (
    <FormattedNumber value={value.toNumber()} minimumFractionDigits={2} maximumFractionDigits={2} />
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
  current,
}: {
  locale: SandboxLocale;
  goal: GoalState;
  current: Decimal;
}) {
  const target = new Decimal(goal.targetAmount);
  const ratio = target.gt(0) ? Decimal.min(current.div(target), 1).mul(100).toNumber() : 0;
  const closed = goal.status === 'dropped' || goal.status === 'accomplished';

  return (
    <Link
      href={`/${locale}/goals/${goal.goalId}`}
      className={styles.goalCard}
      data-closed={closed ? 'true' : undefined}
    >
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
        {goal.status !== 'active' ? (
          <span className={styles.statusChip}>
            <FormattedMessage id={`goalsList.status.${goal.status}`} />
          </span>
        ) : null}
      </span>
      <span className={styles.goalStatus} aria-hidden="true">
        <LucideIcon name="chevron-right" size={18} />
      </span>
    </Link>
  );
}
