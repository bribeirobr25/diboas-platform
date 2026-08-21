'use client';

import { useState } from 'react';
import Decimal from 'decimal.js';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { useLedger } from '@/hooks/useLedger';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { FEE_RATES } from '@diboas/banking';
import { LucideIcon } from './LucideIcon';
import styles from './MoneyOut.module.css';

type Action = 'add' | 'earn' | 'withdraw';

const ICON: Record<Action, string> = { add: 'plus', earn: 'gift', withdraw: 'upload' };

/**
 * Move / money-out (R5; mockup 34; W-9c). The money families are present but
 * disabled in practice mode: each opens an honest explainer sheet (what it does
 * in the real app + why it's unavailable here), never a dead control (W-2). The
 * Withdraw explainer discloses the real 0.48% cash-out fee (W-9 / FEES.md). No
 * upsell nag; the reworded practice note drops the kill-listed "risk-free".
 */
export function MoneyOut() {
  const state = useLedger();
  const [sheet, setSheet] = useState<Action | null>(null);

  // Total play money = all buckets + open positions + uninvested goal cash.
  // goal.cash must be included or funded-goal money vanishes from the total.
  const balance = new Decimal(state.buckets.floor)
    .plus(state.buckets.cushion)
    .plus(state.buckets.working)
    .plus(
      state.positions
        .filter((p) => p.open)
        .reduce((s, p) => s.plus(p.principal).plus(p.accrued), new Decimal(0))
    )
    .plus(state.goals.reduce((s, g) => s.plus(g.cash), new Decimal(0)));

  const actions: { id: Action; disabled?: boolean }[] = [
    { id: 'add' },
    { id: 'earn' },
    { id: 'withdraw', disabled: true },
  ];

  return (
    <section className={styles.wrap} aria-labelledby="move-title">
      <div className={styles.balanceCard}>
        <div className={styles.balanceText}>
          <span className={styles.balanceLabel}>
            <FormattedMessage id="move.balance" />
          </span>
          <span id="move-title" className={styles.balance}>
            <FormattedNumber
              value={balance.toNumber()}
              minimumFractionDigits={2}
              maximumFractionDigits={2}
            />
          </span>
          <span className={styles.balanceUnit}>
            <FormattedMessage id="move.credits" />
          </span>
        </div>
        <span className={styles.balanceIcon}>
          <LucideIcon name="wallet" size={26} />
        </span>
      </div>

      <div className={styles.actions}>
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            className={styles.action}
            data-disabled={a.disabled ? 'true' : undefined}
            onClick={() => setSheet(a.id)}
          >
            <span className={styles.actionIcon}>
              <LucideIcon name={ICON[a.id]} size={22} />
            </span>
            <span className={styles.actionLabel}>
              <FormattedMessage id={`move.${a.id}`} />
            </span>
            <LucideIcon name="chevron-right" size={18} className={styles.actionChevron} />
          </button>
        ))}
      </div>

      <p className={styles.info}>
        <LucideIcon name="shield" size={14} />
        <FormattedMessage id="move.practiceNote" />
      </p>

      {sheet ? (
        <BottomSheet titleId={`move.${sheet}Title`} onClose={() => setSheet(null)}>
          <div className={styles.sheetIconWrap}>
            <span className={styles.sheetIcon}>
              <LucideIcon name={ICON[sheet]} size={26} />
            </span>
          </div>
          <p className={styles.sheetBody}>
            <FormattedMessage id={`move.${sheet}Body`} />
          </p>
          {sheet === 'withdraw' ? (
            <div className={styles.feeRow}>
              <span className={styles.feeLabel}>
                <LucideIcon name="percent" size={18} />
                <FormattedMessage id="move.withdrawFee" />
              </span>
              <span className={styles.feeValue}>
                <span className={styles.feePct}>
                  {/* From the fee CONSTANTS, never a literal — fees.ts states
                      the rule: "a fee value appearing as a string literal in a
                      component is a bug by definition (R-3)". Localized so de
                      renders 0,48 %. */}
                  <FormattedNumber
                    value={FEE_RATES.ramp.toNumber()}
                    style="percent"
                    minimumFractionDigits={2}
                    maximumFractionDigits={2}
                  />
                </span>
                <span className={styles.feePer}>
                  <FormattedMessage id="move.withdrawFeePer" />
                </span>
              </span>
            </div>
          ) : null}
          <Button variant="primary" fullWidth onClick={() => setSheet(null)}>
            <FormattedMessage id="move.okay" />
          </Button>
        </BottomSheet>
      ) : null}
    </section>
  );
}
