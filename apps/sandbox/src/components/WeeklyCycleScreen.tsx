'use client';

import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import type { SandboxLocale } from '@/i18n/config';
import { useLedger } from '@/hooks/useLedger';
import { selectWeeklyCycleView } from '@/view/home';
import { useFormatters } from '@/hooks/useFormatters';
import { applyRuleProposal, collectWeeklyCredits, declineProposal } from '@/lib/ledgerClient';
import { getCollectView, deriveStandingProposal } from '@/lib/weeklyCycle';
import { goalAccentIndex } from '@/lib/goalAccent';
import { getDeclinedWeeks } from '@/lib/proposalStore';
import { weeklyCreditAmount } from '@/lib/growthConstants';
import { Button } from './Button';
import { LucideIcon } from './LucideIcon';
import { Logger } from '@/lib/monitoring/Logger';
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
  const intl = useIntl();
  const state = useLedger();
  const { money } = useFormatters(state.currency);
  /**
   * ⛑ `5.108` · THE INERT `busy` RE-ENTRANCY FLAG IS REMOVED, NOT REPAIRED.
   *
   * Each handler did `setBusy(true)` → a SYNCHRONOUS engine call → `setBusy(false)`
   * inside one event handler. React batches both updates, so the committed value
   * was always `false`: the render never saw `busy === true`, every
   * `if (busy) return` was unreachable and every `disabled={busy}` was a no-op.
   *
   * It could not be made meaningful, because there is nothing to await — the
   * engine call is synchronous. So the choice was between a control that claims
   * protection it does not provide and no control at all, and a fake control is
   * worse: it invites a future reader to rely on it.
   *
   * ⚑ THE REAL GUARD IS ENGINE-SIDE, UNCHANGED, AND ALREADY UNDER TEST — which is
   * what makes this removal safe rather than merely harmless:
   *
   *   `lib/__tests__/weeklyCycle.test.ts`
   *     "should be a harmless no-op on a double tap (same now)"
   *     "should refuse a second application of the same week-set (double-tap …)"
   *
   * Double-application is refused by idempotency in the ledger engine, which
   * recomputes from the synchronously appended log rather than from screen state.
   * Removing the flag removes a CLAIM, never a protection.
   *
   * ⚑ That the whole suite stayed green after deleting three of these flags is
   * evidence they were inert — it is NOT evidence the protection exists. The two
   * tests named above are that evidence, and they are cited here so the next
   * reader does not have to rediscover which control is the real one.
   */
  /** Bumped after every decision so the derived proposal re-reads the ledger. */
  const [tick, setTick] = useState(0);

  const collect = getCollectView(state, new Date().toISOString());

  // Derived, never stored: the proposal re-computes from the ledger on every
  // render, so a stale one is impossible by construction (W-8).
  const proposal = deriveStandingProposal(state, getDeclinedWeeks(), `p-${tick}`);

  // VIEW-2: the weekly figures are derived in `view/`. `weeklyAmount` existed
  // here only to multiply into `collectable`, and both were `Decimal` purely to
  // be rendered — the component never compared them.
  const { collectable, remainderToAvailable } = selectWeeklyCycleView({
    weeklyCreditAmount: weeklyCreditAmount(state.mode),
    uncollectedWeeks: collect.weeks.length,
    remainderToAvailable: proposal?.remainderToAvailable ?? 0,
  });
  const goalOf = (goalId: string) => state.goals.find((g) => g.goalId === goalId);

  /**
   * The share each destination holds in the rule that drafted this proposal —
   * read from THAT rule (by id), never "the active rule", so the sub-line can
   * never describe a different version than the amounts above it.
   *
   * Mockup 11 carries this share on every row, and so does every other
   * goal-bearing row in the app (`GoalRow` puts current/target under the name).
   * Without it the screen names amounts but not the rule that produced them —
   * on a surface whose whole title is "how your rule would handle this", the
   * causal half was the missing half.
   */
  const shareOf = new Map(
    (state.rules.find((r) => r.ruleId === proposal?.ruleId)?.split ?? []).map((s) => [
      s.goalId,
      s.percent,
    ])
  );

  function onCollect() {
    collectWeeklyCredits();
    setTick((t) => t + 1);
  }

  function onApprove() {
    if (!proposal) return;
    const result = applyRuleProposal(proposal);
    /* A refused financial commit must be observable (R-14 / P12; lane audit 2026-10-21,
       Z5), as `SimulatedEventScreen` already does. No copy is invented for a refusal
       one tab cannot produce today; it gets a log and a re-derive. */
    if (!result.ok) Logger.warn('weekly rule proposal refused', { reason: result.reason });
    setTick((t) => t + 1);
  }

  function onDecline() {
    if (!proposal) return;
    declineProposal(proposal);
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
            <span className={styles.amount}>{money(collectable)}</span>
          </p>
          <p className={styles.amountNote}>
            <FormattedMessage id="weekly.creditsFor" values={{ weeks: collect.weeks.length }} />
          </p>
          <Button variant="primary" fullWidth onClick={onCollect}>
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
                {/* The goal's identity colour, same as every other surface —
                    that is the point of having one. */}
                <span className={styles.lineIcon} data-accent={goalAccentIndex(line.goalId)}>
                  <LucideIcon name={goalOf(line.goalId)?.icon ?? 'target'} size={18} />
                </span>
                <span className={styles.lineName}>
                  {goalOf(line.goalId)?.name ?? line.goalId}
                  {shareOf.has(line.goalId) ? (
                    <span className={styles.lineNote}>
                      <FormattedMessage
                        id="weekly.share"
                        values={{
                          share: intl.formatNumber(shareOf.get(line.goalId)! / 100, {
                            style: 'percent',
                          }),
                        }}
                      />
                    </span>
                  ) : null}
                  {line.pausedDiversion ? (
                    <span className={styles.lineNote}>
                      <FormattedMessage id="weekly.pausedDiversion" />
                    </span>
                  ) : null}
                </span>
                <span
                  className={line.pausedDiversion ? styles.lineValueDiverted : styles.lineValue}
                >
                  {money(line.amount.toFixed(2))}
                </span>
              </li>
            ))}
            {/* Deliberately carries NO share sub-line, though mockup 11 shows a
                figure here. The remainder is not a share anyone chose — it is
                whatever is left, and it GROWS beyond the arithmetic leftover
                whenever a paused goal diverts or a destination needs repair. A
                "40% of every credit" label would be plainly false in exactly
                those states, so the row states its amount and nothing else. */}
            <li className={styles.remainderLine}>
              <span className={styles.lineIcon}>
                <LucideIcon name="coins" size={18} />
              </span>
              <span className={styles.lineName}>
                <FormattedMessage id="weekly.remainder" />
              </span>
              <span className={styles.lineValue}>{money(remainderToAvailable)}</span>
            </li>
          </ul>

          {/* Equal weight, and a decline is as easy as an approval: three
              same-sized controls, none of them styled to win.

              Mockup 11 lays these out as horizontal pills (icon beside label)
              outside the card; they stack icon-over-label here because the
              longest label is DE "Einmal anpassen" — at 430 px each control is
              ~130 px wide, which wraps a beside-icon label mid-word. Stacking
              keeps all four locales on one line and keeps the three controls
              identical in size, which is the property that actually matters. */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.action}
              disabled={proposal.repairNeeded}
              onClick={onApprove}
            >
              <LucideIcon name="check" size={20} />
              <FormattedMessage id="weekly.approve" />
            </button>
            <button type="button" className={styles.action} disabled onClick={() => {}}>
              <LucideIcon name="sliders" size={20} />
              <FormattedMessage id="weekly.adjustOnce" />
            </button>
            <button type="button" className={styles.action} onClick={onDecline}>
              <LucideIcon name="x" size={20} />
              <FormattedMessage id="weekly.decline" />
            </button>
          </div>
          {/* A disabled control always says why (§4.6/§4.7 precedent) — but not
              in the repair state, where the amber notice above already states
              the one thing to do and this line would point at an Approve the
              user cannot use. */}
          {proposal.repairNeeded ? null : (
            <p className={styles.hint}>
              <FormattedMessage id="weekly.adjustLater" />
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
