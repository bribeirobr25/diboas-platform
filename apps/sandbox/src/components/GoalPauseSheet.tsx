'use client';

import { FormattedMessage } from 'react-intl';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { LucideIcon } from './LucideIcon';
import styles from './GoalPauseSheet.module.css';

/**
 * GoalPauseSheet — the W-17d pause confirmation (Phase B; mockup 15). The
 * BINDING naming duality rendered: pause is a PLAN-level act (stops the weekly
 * plan + reminders); the invested money keeps working. The two-line state
 * preview "Plan paused · Invested money still working" makes it honest (a label
 * that never implies the money stopped). Offers the existing Stop in the same
 * breath (with the honest 0.39% exit-fee note) for users who want out of
 * protocol risk. Calm, no guilt/dark-pattern friction.
 *
 * Reuses the accessible BottomSheet (focus trap + Escape + return-focus). SEAM:
 * onConfirm fires the GoalPaused seam (D-e); onDismiss closes.
 */
export function GoalPauseSheet({
  onConfirm,
  onDismiss,
  onStopStrategy,
}: {
  onConfirm?: () => void;
  onDismiss: () => void;
  /** Wired when the goal has open positions (G3): opens the REAL exit
   *  manifest — the fee is disclosed in the alsoStop line before the tap. */
  onStopStrategy?: () => void;
}) {
  return (
    <BottomSheet titleId="goalPause.title" onClose={onDismiss} tone="light">
      <p className={styles.body}>
        <FormattedMessage id="goalPause.body" />
      </p>

      {/* The two-line honest state preview (the naming duality). */}
      <div className={styles.state}>
        <span className={styles.statePlan}>
          <LucideIcon name="clock" size={16} />
          <FormattedMessage id="goalPause.statePlan" />
        </span>
        <span className={styles.stateMoney}>
          <LucideIcon name="sprout" size={16} />
          <FormattedMessage id="goalPause.stateMoney" />
        </span>
      </div>

      <p className={styles.alsoStop}>
        <FormattedMessage id="goalPause.alsoStop" />
      </p>
      {onStopStrategy ? (
        <button type="button" className={styles.stopLink} onClick={onStopStrategy}>
          <FormattedMessage id="goalPause.stopCta" />
        </button>
      ) : null}

      <div className={styles.actions}>
        <Button variant="primary" fullWidth onClick={() => onConfirm?.()}>
          <FormattedMessage id="goalPause.pause" />
        </Button>
        <Button variant="secondary" fullWidth onClick={onDismiss}>
          <FormattedMessage id="goalPause.keepGoing" />
        </Button>
      </div>
    </BottomSheet>
  );
}
