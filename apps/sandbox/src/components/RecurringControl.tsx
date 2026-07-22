'use client';

import { useState } from 'react';
import Decimal from 'decimal.js';
import { FormattedMessage, useIntl } from 'react-intl';
import type { RecurringSchedule } from '@diboas/banking';
import { useFormatters } from '@/hooks/useFormatters';
import { setRecurring } from '@/lib/ledgerClient';
import { LucideIcon } from './LucideIcon';
import styles from './RecurringControl.module.css';

/**
 * The recurring monthly contribution control on an open position (C3b). Real
 * play money: when set, each due month moves the amount from Working into this
 * position as the clock advances. Describes the mechanism plainly (never a
 * promise about returns — Voice Q3); the honesty note states it is play money,
 * fee-free in the sandbox, and only runs while Working money lasts. When
 * Working is exhausted the schedule is derived-paused (shown calmly, never an
 * alarm).
 */
export function RecurringControl({
  goalId,
  positionId,
  schedule,
  workingBalance,
  currency,
}: {
  goalId: string;
  positionId: string;
  schedule: RecurringSchedule | undefined;
  workingBalance: string;
  currency: 'USD' | 'BRL' | 'EUR';
}) {
  const intl = useIntl();
  const { money } = useFormatters(currency);
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(schedule ? schedule.monthlyAmount : '');

  const working = new Decimal(workingBalance);
  const amountValue = Number(amount) || 0;
  const canConfirm = amountValue > 0;
  // Derived paused: an active schedule that Working money can no longer fund.
  const paused = schedule != null && working.lte(0);

  function confirm() {
    if (!canConfirm) return;
    setRecurring({ goalId, positionId, monthlyAmount: amountValue });
    setEditing(false);
  }

  function turnOff() {
    setRecurring({ goalId, positionId, monthlyAmount: 0 });
    setEditing(false);
    setAmount('');
  }

  // ── The set/edit form ──────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className={styles.wrap}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="recurring-amount">
            <FormattedMessage id="recurring.amountLabel" />
          </label>
          <input
            id="recurring-amount"
            className={styles.input}
            type="number"
            inputMode="decimal"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={intl.formatMessage({ id: 'recurring.amountPlaceholder' })}
          />
        </div>
        <p className={styles.explainer}>
          <FormattedMessage id="recurring.explainer" />
        </p>
        <p className={styles.note}>
          <FormattedMessage id="recurring.note" />
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => setEditing(false)}>
            <FormattedMessage id="common.cancel" />
          </button>
          <button type="button" className={styles.primary} onClick={confirm} disabled={!canConfirm}>
            <FormattedMessage id="recurring.confirm" />
          </button>
        </div>
      </div>
    );
  }

  // ── The active schedule summary ─────────────────────────────────────────────
  if (schedule) {
    return (
      <div className={styles.wrap}>
        <div className={styles.activeRow}>
          <span className={styles.activeIcon}>
            <LucideIcon name="repeat" size={16} />
          </span>
          <span className={styles.activeText}>
            <FormattedMessage
              id="recurring.activeLine"
              values={{ amount: money(schedule.monthlyAmount) }}
            />
          </span>
        </div>
        {paused ? (
          <p className={styles.paused} role="status">
            <FormattedMessage id="recurring.pausedBody" />
          </p>
        ) : null}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.link}
            onClick={() => {
              setAmount(schedule.monthlyAmount);
              setEditing(true);
            }}
          >
            <FormattedMessage id="recurring.edit" />
          </button>
          <button type="button" className={styles.link} onClick={turnOff}>
            <FormattedMessage id="recurring.turnOff" />
          </button>
        </div>
      </div>
    );
  }

  // ── The setup affordance ────────────────────────────────────────────────────
  return (
    <button type="button" className={styles.setupCta} onClick={() => setEditing(true)}>
      <LucideIcon name="repeat" size={16} />
      <FormattedMessage id="recurring.setupCta" />
    </button>
  );
}
