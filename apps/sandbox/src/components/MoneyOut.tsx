'use client';

import { useState } from 'react';
import Decimal from 'decimal.js';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { useLedger } from '@/hooks/useLedger';
import { useFormatters } from '@/hooks/useFormatters';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { FEE_RATES } from '@diboas/banking';
import { LucideIcon } from './LucideIcon';
import styles from './MoneyOut.module.css';

/**
 * The money doors on /move. Exported so the composed-id gate (CID-1,
 * `i18n/__tests__/composedIds.test.ts`) resolves `move.${id}` / `move.${id}Title` /
 * `move.${id}Body` against the catalogs: an id added here without its three keys
 * in all four locales fails the suite instead of rendering raw ids (the
 * 2026-08-25 `earn` defect, PENDING_ALL 5.155 — the earn door is /weekly).
 */
export const MONEY_OUT_ACTIONS = ['add', 'withdraw'] as const;
type Action = (typeof MONEY_OUT_ACTIONS)[number];

const ICON: Record<Action, string> = { add: 'plus', withdraw: 'upload' };
const DISABLED: ReadonlySet<Action> = new Set<Action>(['withdraw']);
/** The round number the fee example is worked against (`5.200`). A constant,
 *  not a literal in the copy — the copy must never carry a currency amount. */
const WORKED_EXAMPLE_BASE = new Decimal(100);

/**
 * Move / money-out (R5; mockup 34; W-9c). The money families are present but
 * disabled in practice mode: each opens an honest explainer sheet (what it does
 * in the real app + why it's unavailable here), never a dead control (W-2). The
 * Withdraw explainer discloses the real 0.48% cash-out fee (W-9 / FEES.md). No
 * upsell nag; the reworded practice note drops the kill-listed "risk-free".
 * I-0a (2026-09-07): the `earn` tile is gone — its keys were deleted as orphans on
 * 2026-08-25 while the composed id kept rendering them raw.
 */
export function MoneyOut() {
  const state = useLedger();
  /* `5.200` — the withdrawal-fee example must be in the LEDGER's currency, not
     the interface locale's. The currency is frozen at claim time and never
     follows the interface language, which the LocaleSwitcher and Settings both
     let the user change: claiming at /de then reading /en/move rendered
     "$0.48 per $100" against a EUR ledger. Every other amount in this app
     already goes through `useFormatters(state.currency)`; this one string was
     the exception (the registered CUR-1 gate class). */
  const { money } = useFormatters(state.currency);
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

  const actions = MONEY_OUT_ACTIONS.map((id) => ({ id, disabled: DISABLED.has(id) }));

  return (
    <section className={styles.wrap} aria-labelledby="move-title">
      {/*
        The screen's heading, and the region's accessible name.

        Both were missing. `/move` was the ONE screen of fourteen with no
        heading element at all, so heading navigation landed on nothing — and
        `aria-labelledby="move-title"` pointed at the balance NUMBER, which made
        the region's accessible name literally "0.00". A value is not a label,
        and an amount announced with no noun is the very thing the labelled-
        amount rule exists to prevent.

        Visually hidden rather than shown: every other screen carries a visible
        title, but this one's approved design leads with the balance card, and
        changing that is a design decision this fix has no mandate for. The copy
        is the destination's own existing name (`nav.move`, present in all four
        locales) — no new string is authored here.
      */}
      <h1 id="move-title" className="srOnly">
        <FormattedMessage id="nav.move" />
      </h1>
      <div className={styles.balanceCard}>
        <div className={styles.balanceText}>
          <span className={styles.balanceLabel}>
            <FormattedMessage id="move.balance" />
          </span>
          <span className={styles.balance}>
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
                  {/* Worked example, derived: the rate from the constants, both
                      amounts from the LEDGER currency. The catalogs supply only
                      each locale's connector word, never a currency symbol. */}
                  <FormattedMessage
                    id="move.withdrawFeePer"
                    values={{
                      fee: money(FEE_RATES.ramp.times(WORKED_EXAMPLE_BASE).toFixed(2)),
                      base: money(WORKED_EXAMPLE_BASE.toFixed(2)),
                    }}
                  />
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
