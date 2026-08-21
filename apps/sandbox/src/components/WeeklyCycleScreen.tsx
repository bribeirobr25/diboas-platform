'use client';

import { useState } from 'react';
import Decimal from 'decimal.js';
import { FormattedMessage } from 'react-intl';
import type { SandboxLocale } from '@/i18n/config';
import { useLedger } from '@/hooks/useLedger';
import { useFormatters } from '@/hooks/useFormatters';
import { applyRuleProposal, collectWeeklyCredits, declineProposal } from '@/lib/ledgerClient';
import { getCollectView, deriveStandingProposal } from '@/lib/weeklyCycle';
import { getDeclinedWeeks } from '@/lib/proposalStore';
import { weeklyCreditAmount } from '@/lib/growthConstants';
import { Button } from './Button';
import { LucideIcon } from './LucideIcon';
import styles from './WeeklyCycleScreen.module.css';

/**
 * G10 — the weekly cycle (§4.10; mockup 11, Stage-D G10).
 *
 * Two moments, in order: **collect** what time has already accrued, then decide
 * what your rule does with it.
 *
 * WG-1 is the governing constraint and it is a mechanic, not a copy rule.
 * Credits accrue on the **real calendar regardless of login** — the audit
 * finding (FEEDBACK_ARCHITECTURE §5.4) was that a first-session-of-the-week
 * grant is structurally a login bonus, and the ruled fix was to make it a fact
 * of time instead. So this screen must never re-introduce the reward loop it
 * removed: **no streak, no achievement, no celebration, and deliberately NOT
 * the mockup's gift-box illustration** — a present is the most literal reward
 * framing there is, and it would undo the mechanic fix visually. What is shown
 * is the plain fact: time passed, this much accrued, here is what your rule
 * would do.
 *
 * The three decisions are equal-weight (Approve · Adjust once · Decline) and a
 * decline is silent — no nag, no re-ask, and the weeks simply stay unresolved.
 */
export function WeeklyCycleScreen({ locale }: { locale: SandboxLocale }) {
  const state = useLedger();
  const { money } = useFormatters(state.currency);
  const [busy, setBusy] = useState(false);
  /** Bumped after every decision so the derived proposal re-reads the ledger. */
  const [tick, setTick] = useState(0);

  const collect = getCollectView(state, new Date().toISOString());
  const weeklyAmount = new Decimal(weeklyCreditAmount(state.mode));
  const collectable = weeklyAmount.mul(collect.weeks.length);

  // Derived, never stored: the proposal re-computes from the ledger on every
  // render, so a stale one is impossible by construction (W-8).
  const proposal = deriveStandingProposal(state, getDeclinedWeeks(), `p-${tick}`);
  const goalOf = (goalId: string) => state.goals.find((g) => g.goalId === goalId);

  function onCollect() {
    if (busy) return;
    setBusy(true);
    collectWeeklyCredits();
    setBusy(false);
    setTick((t) => t + 1);
  }

  function onApprove() {
    if (busy || !proposal) return;
    setBusy(true);
    applyRuleProposal(proposal);
    setBusy(false);
    setTick((t) => t + 1);
  }

  function onDecline() {
    if (busy || !proposal) return;
    setBusy(true);
    declineProposal(proposal);
    setBusy(false);
    setTick((t) => t + 1);
  }

  return (
    <section className={styles.wrap} aria-labelledby="weekly-title">
      <h1 id="weekly-title" className={styles.title}>
        <FormattedMessage id="weekly.title" />
      </h1>
      <p className={styles.subtitle}>
        <FormattedMessage id="weekly.subtitle" />
      </p>

      {/* ── Collect ─────────────────────────────────────────────────────── */}
      {collect.ceilingPaused ? (
        /* FT-19: the pause is stated as a neutral fact about the practice
           balance, never as a penalty or a target the user failed to hit. */
        <div className={styles.card}>
          <p className={styles.cardTitle}>
            <FormattedMessage id="weekly.pausedTitle" />
          </p>
          <p className={styles.cardBody}>
            <FormattedMessage id="weekly.pausedBody" />
          </p>
        </div>
      ) : collect.weeks.length > 0 ? (
        <div className={styles.card}>
          <p className={styles.cardTitle}>
            <FormattedMessage id="weekly.readyTitle" />
          </p>
          <p className={styles.amountRow}>
            <LucideIcon name="coins" size={22} />
            <span className={styles.amount}>{money(collectable.toFixed(2))}</span>
          </p>
          <p className={styles.amountNote}>
            <FormattedMessage id="weekly.creditsFor" values={{ weeks: collect.weeks.length }} />
          </p>
          <Button variant="primary" fullWidth disabled={busy} onClick={onCollect}>
            <FormattedMessage id="weekly.collect" />
          </Button>
        </div>
      ) : (
        <div className={styles.card}>
          <p className={styles.cardTitle}>
            <FormattedMessage id="weekly.nothingTitle" />
          </p>
          <p className={styles.cardBody}>
            <FormattedMessage id="weekly.nothingBody" />
          </p>
        </div>
      )}

      {/* ── The rule's proposal ─────────────────────────────────────────── */}
      {proposal ? (
        <div className={styles.card}>
          <p className={styles.cardTitle}>
            <FormattedMessage id="weekly.proposalTitle" />
          </p>

          {proposal.repairNeeded ? (
            /* D-r §5: a destination that closed is a QUESTION, not a blocker —
               calm amber, never alarm red, and nothing else is prevented. */
            <p className={styles.repair}>
              <LucideIcon name="info" size={16} />
              <FormattedMessage id="weekly.repairNeeded" />
            </p>
          ) : null}

          <ul className={styles.lines}>
            {proposal.lines.map((line) => (
              <li key={line.goalId} className={styles.line}>
                {/* The goal's OWN icon — mockup 11 carries a mark per row, and
                    every other goal-bearing surface renders `goal.icon`, so a
                    generic one here would read as a different goal. */}
                <span className={styles.lineIcon}>
                  <LucideIcon name={goalOf(line.goalId)?.icon ?? 'target'} size={18} />
                </span>
                <span className={styles.lineName}>
                  {goalOf(line.goalId)?.name ?? line.goalId}
                  {line.pausedDiversion ? (
                    <span className={styles.lineNote}>
                      <FormattedMessage id="weekly.pausedDiversion" />
                    </span>
                  ) : null}
                </span>
                <span className={styles.lineValue}>{money(line.amount.toFixed(2))}</span>
              </li>
            ))}
            <li className={styles.remainderLine}>
              <span className={styles.lineIcon}>
                <LucideIcon name="coins" size={18} />
              </span>
              <span className={styles.lineName}>
                <FormattedMessage id="weekly.remainder" />
              </span>
              <span className={styles.lineValue}>
                {money(new Decimal(proposal.remainderToAvailable).toFixed(2))}
              </span>
            </li>
          </ul>

          {/* Equal weight, and a decline is as easy as an approval: three
              same-sized controls, none of them styled to win. */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.action}
              disabled={busy || proposal.repairNeeded}
              onClick={onApprove}
            >
              <LucideIcon name="check" size={20} />
              <FormattedMessage id="weekly.approve" />
            </button>
            <button type="button" className={styles.action} disabled onClick={() => {}}>
              <LucideIcon name="sliders" size={20} />
              <FormattedMessage id="weekly.adjustOnce" />
            </button>
            <button type="button" className={styles.action} disabled={busy} onClick={onDecline}>
              <LucideIcon name="x" size={20} />
              <FormattedMessage id="weekly.decline" />
            </button>
          </div>
          {/* A disabled control always says why (§4.6/§4.7 precedent). */}
          <p className={styles.hint}>
            <FormattedMessage id="weekly.adjustLater" />
          </p>
        </div>
      ) : null}
    </section>
  );
}
