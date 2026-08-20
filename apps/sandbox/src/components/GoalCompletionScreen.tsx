'use client';

import { useState } from 'react';
import Decimal from 'decimal.js';
import { FormattedMessage, useIntl } from 'react-intl';
import type { GoalState, LedgerState } from '@diboas/banking';
import { useFormatters } from '@/hooks/useFormatters';
import { useTakeoverFocus } from '@/hooks/useTakeoverFocus';
import { accomplishGoal, raiseGoalTarget, transferGoalCash } from '@/lib/ledgerClient';
import { goalCurrentValue } from '@/lib/goalValue';
import { LucideIcon } from './LucideIcon';
import styles from './GoalCompletionScreen.module.css';

type Step = 'menu' | 'transfer' | 'raise';

/**
 * G4 goal completion (§4.4; mockup 16) — the full-screen state a REACHED goal
 * offers, never a modal and never automatic: `target_reached` is a derived
 * fact (`current >= target`, never stored), and the goal flips to
 * `accomplished` only by the user's disposition choice (D-e §3 — "the moment
 * belongs to the user, not to arithmetic").
 *
 * The 5 rows → 4 enum values (board §3.1), equal weight, no default, no
 * confetti: *Keep working* → `kept-working` · *Stop strategy* → the exit
 * manifest THEN `held-as-cash` (goal-detail owns that manifest; the row only
 * renders when a position actually exists) · *Hold as cash* → `held-as-cash` ·
 * *Move to another goal* → release + fund + `transferred` · *Raise the target*
 * → `GoalTargetChanged` only, the goal stays ACTIVE and emits no
 * `GoalAccomplished` (growing an ambition is not completing). Withdraw is
 * real-mode only and absent here.
 */
export function GoalCompletionScreen({
  goal,
  state,
  onStopStrategy,
  onClose,
}: {
  goal: GoalState;
  state: LedgerState;
  /** Wired only when the goal has open positions — opens the real exit manifest. */
  onStopStrategy?: () => void;
  onClose: () => void;
}) {
  const intl = useIntl();
  const { money } = useFormatters(state.currency);
  const titleRef = useTakeoverFocus<HTMLHeadingElement>();
  const [step, setStep] = useState<Step>('menu');
  const [newTarget, setNewTarget] = useState('');

  const current = goalCurrentValue(state, goal.goalId);
  const cash = new Decimal(goal.cash);
  const hasPositions = state.positions.some((p) => p.goalId === goal.goalId && p.open);
  const destinations = state.goals.filter((g) => g.goalId !== goal.goalId && g.status === 'active');
  const raiseValue = Number(newTarget) || 0;
  const canRaise = raiseValue > Number(goal.targetAmount);

  return (
    <section className={styles.wrap} aria-labelledby="goalcomplete-title">
      <div className={styles.heroBand} aria-hidden />

      <button type="button" className={styles.backLink} onClick={onClose}>
        <LucideIcon name="arrow-left" size={16} />
        <FormattedMessage id="common.back" />
      </button>

      <div className={styles.head}>
        <span className={styles.goalIcon}>
          <LucideIcon name={goal.icon} size={26} />
        </span>
        <div>
          <h1 id="goalcomplete-title" ref={titleRef} tabIndex={-1} className={styles.title}>
            {goal.name}
          </h1>
          {/* Text + icon, never colour alone (a11y). */}
          <p className={styles.reached} role="status">
            <LucideIcon name="check" size={16} />
            <FormattedMessage id="goalDetail.milestoneTitle" />
          </p>
        </div>
      </div>

      <p className={styles.savedLabel}>
        <FormattedMessage id="goalComplete.saved" />
      </p>
      <p className={styles.savedAmount}>
        <span className={styles.savedBig}>{money(current.toFixed(2))}</span>{' '}
        <span className={styles.savedTarget}>
          <FormattedMessage
            id="goalComplete.ofTarget"
            values={{ target: money(goal.targetAmount) }}
          />
        </span>
      </p>
      <span
        className={styles.progressTrack}
        role="progressbar"
        aria-label={goal.name}
        aria-valuenow={100}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className={styles.progressFill} style={{ width: '100%' }} />
      </span>
      {/* Warm about the BEHAVIOUR (staying consistent), never about an outcome
          or a return — no triumphalism, no gamification (R-2). */}
      <p className={styles.wellDone}>
        <FormattedMessage id="goalComplete.wellDone" />
      </p>

      {step === 'menu' ? (
        <>
          <h2 className={styles.whatNext}>
            <FormattedMessage id="goalComplete.whatNext" />
          </h2>
          <ul className={styles.rows}>
            <li>
              <button
                type="button"
                className={styles.row}
                onClick={() => {
                  accomplishGoal(goal.goalId, 'kept-working');
                  onClose();
                }}
              >
                <span className={styles.rowIcon}>
                  <LucideIcon name="trending-up" size={18} />
                </span>
                <span className={styles.rowBody}>
                  <span className={styles.rowLabel}>
                    <FormattedMessage id="goalComplete.keepWorking" />
                  </span>
                  <span className={styles.rowNote}>
                    <FormattedMessage id="goalComplete.keepWorkingNote" />
                  </span>
                </span>
                <LucideIcon name="chevron-right" size={18} />
              </button>
            </li>

            {hasPositions && onStopStrategy ? (
              <li>
                <button type="button" className={styles.row} onClick={onStopStrategy}>
                  <span className={styles.rowIcon}>
                    <LucideIcon name="pause" size={18} />
                  </span>
                  <span className={styles.rowBody}>
                    <span className={styles.rowLabel}>
                      <FormattedMessage id="goalComplete.stopStrategy" />
                    </span>
                    <span className={styles.rowNote}>
                      <FormattedMessage id="goalComplete.stopStrategyNote" />
                    </span>
                  </span>
                  <LucideIcon name="chevron-right" size={18} />
                </button>
              </li>
            ) : null}

            <li>
              <button
                type="button"
                className={styles.row}
                onClick={() => {
                  accomplishGoal(goal.goalId, 'held-as-cash');
                  onClose();
                }}
              >
                <span className={styles.rowIcon}>
                  <LucideIcon name="wallet" size={18} />
                </span>
                <span className={styles.rowBody}>
                  <span className={styles.rowLabel}>
                    <FormattedMessage id="goalComplete.holdAsCash" />
                  </span>
                  <span className={styles.rowNote}>
                    <FormattedMessage id="goalComplete.holdAsCashNote" />
                  </span>
                </span>
                <LucideIcon name="chevron-right" size={18} />
              </button>
            </li>

            <li>
              <button type="button" className={styles.row} onClick={() => setStep('transfer')}>
                <span className={styles.rowIcon}>
                  <LucideIcon name="arrow-right-left" size={18} />
                </span>
                <span className={styles.rowBody}>
                  <span className={styles.rowLabel}>
                    <FormattedMessage id="goalComplete.moveToGoal" />
                  </span>
                  <span className={styles.rowNote}>
                    <FormattedMessage
                      id="goalComplete.moveToGoalNote"
                      values={{ amount: money(cash.toFixed(2)) }}
                    />
                  </span>
                </span>
                <LucideIcon name="chevron-right" size={18} />
              </button>
            </li>

            <li>
              <button type="button" className={styles.row} onClick={() => setStep('raise')}>
                <span className={styles.rowIcon}>
                  <LucideIcon name="target" size={18} />
                </span>
                <span className={styles.rowBody}>
                  <span className={styles.rowLabel}>
                    <FormattedMessage id="goalComplete.raiseTarget" />
                  </span>
                  <span className={styles.rowNote}>
                    <FormattedMessage id="goalComplete.raiseTargetNote" />
                  </span>
                </span>
                <LucideIcon name="chevron-right" size={18} />
              </button>
            </li>
          </ul>
        </>
      ) : step === 'transfer' ? (
        <div className={styles.substep}>
          <h2 className={styles.whatNext}>
            <FormattedMessage id="goalComplete.transferTitle" />
          </h2>
          {hasPositions ? (
            <p className={styles.substepNote}>
              <FormattedMessage id="goalComplete.transferPositionsStay" />
            </p>
          ) : null}
          {destinations.length === 0 ? (
            <p className={styles.substepNote}>
              <FormattedMessage id="goalComplete.transferEmpty" />
            </p>
          ) : (
            <ul className={styles.rows}>
              {destinations.map((destination) => (
                <li key={destination.goalId}>
                  <button
                    type="button"
                    className={styles.row}
                    onClick={() => {
                      transferGoalCash(goal.goalId, destination.goalId);
                      onClose();
                    }}
                  >
                    <span className={styles.rowIcon}>
                      <LucideIcon name={destination.icon} size={18} />
                    </span>
                    <span className={styles.rowBody}>
                      <span className={styles.rowLabel}>{destination.name}</span>
                    </span>
                    <LucideIcon name="chevron-right" size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className={styles.secondary} onClick={() => setStep('menu')}>
            <FormattedMessage id="common.back" />
          </button>
        </div>
      ) : (
        <div className={styles.substep}>
          <h2 className={styles.whatNext}>
            <FormattedMessage id="goalComplete.raiseTitle" />
          </h2>
          <label className={styles.label} htmlFor="new-target">
            <FormattedMessage id="goalComplete.newTargetLabel" />
          </label>
          <input
            id="new-target"
            className={styles.input}
            type="number"
            inputMode="decimal"
            min={0}
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
          />
          <p className={styles.substepNote}>
            <FormattedMessage
              id="goalComplete.currentTarget"
              values={{ amount: money(goal.targetAmount) }}
            />
          </p>
          <button
            type="button"
            className={styles.primary}
            disabled={!canRaise}
            onClick={() => {
              raiseGoalTarget(goal.goalId, raiseValue);
              onClose();
            }}
          >
            {intl.formatMessage({ id: 'goalComplete.raiseCta' })}
          </button>
          <button type="button" className={styles.secondary} onClick={() => setStep('menu')}>
            <FormattedMessage id="common.back" />
          </button>
        </div>
      )}
    </section>
  );
}
