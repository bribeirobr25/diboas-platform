'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';
import { CURRENCY_SYMBOL, type SandboxLocale } from '@/i18n/config';
import { useLedger } from '@/hooks/useLedger';
import { useFormatters } from '@/hooks/useFormatters';
import { resolveSimulatedExpense } from '@/lib/ledgerClient';
import { Logger } from '@/lib/monitoring/Logger';
import {
  affordableExpenseOptions,
  dueSimulatedEvent,
  expenseImpacts,
  toCents,
  type ExpenseImpact,
} from '@/lib/simulatedEvents';
import { Button } from './Button';
import { ExpenseImpactCard } from './ExpenseImpactCard';
import { LucideIcon } from './LucideIcon';
import { Manifest } from './Manifest';
import styles from './SimulatedEventScreen.module.css';

type Stage = 'presented' | 'preview';

/** The mark for each option row — the option's own meaning, not decoration. */
const OPTION_ICON = {
  coverFromAvailable: 'wallet',
  useReserve: 'shield',
  split: 'git-branch',
} as const;

/**
 * G11 — the simulated event (§4.11; mockups 25 + 26, spec
 * `SANDBOX_SPEC_D-S_SIMULATED_EVENTS_2026-08-08.md`).
 *
 * A **life event, never a market event** (H-3.4): the practice world's
 * circumstances change, prices never do — the sandbox's credibility rests on
 * market data staying real, so nothing here touches it.
 *
 * The three properties that make this surface honest, in order of how easy
 * they'd be to lose:
 *
 * 1. **Clearly fictional, structurally** — the practice-scenario band and
 *    "nothing real happened" are part of the layout, not a footnote. No fear
 *    copy, no alarm colour, no countdown (veto row 10): a tabletop exercise,
 *    not a fire drill.
 * 2. **Impact preview BEFORE any choice** (14.8) — you see what each option
 *    does to your money before you pick one, and the picking is a separate,
 *    confirmable act (W-7).
 * 3. **Using the reserve is never judged.** It is what a reserve is FOR, so
 *    the row says "the reserve did its job" and carries no warning styling,
 *    no "are you sure", and no relegation below the other option.
 *
 * Postponing is not a button, because it is not a decision: it is simply
 * leaving. The event keeps waiting, week after week, with no nag and no
 * expiry (RD-9 postponed-forever) — the Home card is how it waits.
 */
export function SimulatedEventScreen({ locale }: { locale: SandboxLocale }) {
  const intl = useIntl();
  const router = useRouter();
  const state = useLedger();
  // The LEDGER's currency, never the locale's (the §4.7 defect): a reader
  // who switches locale still holds the currency they were granted.
  const currencySymbol = CURRENCY_SYMBOL[state.currency];
  const { money } = useFormatters(state.currency);
  const [stage, setStage] = useState<Stage>('presented');
  const [confirming, setConfirming] = useState<ExpenseImpact | null>(null);
  /**
   * The split amount per goal, as TYPED (a string, so a half-entered "1" or an
   * empty field stays exactly what the user left there). Starts empty for
   * every goal: a pre-filled share would be diBoaS deciding how much of your
   * reserve to spend, which is the whole reason the split is user-entered
   * (P2BD-17) — and the same no-default rule the rules builder follows.
   */
  const [splitInput, setSplitInput] = useState<Record<string, string>>({});

  const due = dueSimulatedEvent(state, new Date().toISOString());
  const options = due ? affordableExpenseOptions(state, due.amount) : null;
  // Quantized to cents HERE, once, so the preview, the manifest and the
  // committed event can never be three different numbers (see `toCents`).
  const splitAmounts = Object.fromEntries(
    Object.entries(splitInput)
      .map(([goalId, raw]) => [goalId, toCents(Number(raw))] as const)
      .filter((entry): entry is readonly [string, number] => entry[1] != null)
  );
  const impacts = due && options ? expenseImpacts(state, due.amount, options, splitAmounts) : [];
  const goalOf = (goalId?: string) => state.goals.find((g) => g.goalId === goalId);

  function commit() {
    if (!due || !confirming) return;
    const result = resolveSimulatedExpense({
      eventInstanceId: due.eventInstanceId,
      eventType: due.definition.type,
      amount: due.amount,
      via:
        confirming.option === 'useReserve' && confirming.goalId
          ? { path: 'reserve', goalId: confirming.goalId }
          : confirming.option === 'split' && confirming.goalId
            ? {
                path: 'split',
                goalId: confirming.goalId,
                fromGoal: splitAmounts[confirming.goalId],
              }
            : { path: 'available' },
    });
    setConfirming(null);
    if (result.ok) {
      router.push(`/${locale}`);
      return;
    }
    /* CORRECTED 2026-08-21 (audit). This previously claimed a refusal meant
       "the balance moved under the preview (another tab, a deposit)" and that
       re-deriving would re-present the REAL options. Both halves were wrong,
       and I wrote them: the ledger is memory-authoritative (`ledger/core.ts`
       hydrates once and reads the in-process log) and NOTHING registers a
       `storage` listener anywhere in the app — verified — so another tab is
       invisible here. Nothing else can move money while this sheet is open
       either, which makes the refusal unreachable from this UI today.

       So no user-facing copy is invented for it: a message for a state that
       cannot occur is a fake surface, the same trap as a fake control. What
       it gets instead is a LOG (P12: a refused financial commit must be
       observable) and a re-derive. This becomes user-visible work the moment
       either premise changes — a cross-tab listener, or the Phase-2
       persistence cutover making the store externally mutable. */
    Logger.warn('simulated-event resolve refused', {
      reason: result.reason,
      eventInstanceId: due.eventInstanceId,
      option: confirming.option,
    });
    setStage('presented');
  }

  if (!due) {
    /* Resolved, or not yet due. Never a dead end (row 19): say which, and
       leave by the door the user came in through. */
    return (
      <section className={styles.wrap} aria-labelledby="event-title">
        <h1 id="event-title" className={styles.title}>
          <FormattedMessage id="simEvent.noneTitle" />
        </h1>
        <p className={styles.subtitle}>
          <FormattedMessage id="simEvent.noneBody" />
        </p>
        <Button variant="secondary" fullWidth onClick={() => router.push(`/${locale}`)}>
          <FormattedMessage id="simEvent.backHome" />
        </Button>
      </section>
    );
  }

  const amount = money(due.amount.toFixed(2));

  return (
    <section className={styles.wrap} aria-labelledby="event-title">
      <h1 id="event-title" className={styles.title}>
        <FormattedMessage id={stage === 'presented' ? 'simEvent.title' : 'simEvent.previewTitle'} />
      </h1>
      <p className={styles.subtitle}>
        <FormattedMessage
          id={stage === 'presented' ? 'simEvent.subtitle' : 'simEvent.previewSubtitle'}
        />
      </p>

      {/* The fictional frame is a BAND, not a footnote — it is the first thing
          read and it never scrolls away from the money. */}
      <div className={styles.scenario}>
        <span className={styles.scenarioIcon}>
          <LucideIcon name="receipt" size={26} />
        </span>
        <div>
          <p className={styles.scenarioLabel}>
            <FormattedMessage id="simEvent.practiceScenario" />
          </p>
          <p className={styles.scenarioHeadline}>
            <FormattedMessage id="simEvent.headline" values={{ amount }} />
          </p>
          <p className={styles.scenarioNote}>
            <FormattedMessage id="simEvent.nothingReal" />
          </p>
        </div>
      </div>

      {impacts.length === 0 ? (
        /* D-s §2: "an expense event never forces balances negative". With
           nothing affordable the event simply waits — stated as a fact about
           the balance, never as a failure, and with no operable control that
           would pretend otherwise. */
        <div className={styles.waiting}>
          <p className={styles.waitingTitle}>
            <FormattedMessage id="simEvent.waitingTitle" />
          </p>
          <p className={styles.waitingBody}>
            <FormattedMessage id="simEvent.waitingBody" />
          </p>
        </div>
      ) : stage === 'presented' ? (
        <>
          <h2 className={styles.sectionLabel}>
            <FormattedMessage id="simEvent.howHandle" />
          </h2>
          <ul className={styles.options}>
            {impacts.map((impact) => (
              <li key={`${impact.option}:${impact.goalId ?? ''}`} className={styles.option}>
                <span className={styles.optionIcon}>
                  <LucideIcon name={OPTION_ICON[impact.option]} size={20} />
                </span>
                <span className={styles.optionBody}>
                  <span className={styles.optionName}>
                    <FormattedMessage
                      id={`simEvent.option.${impact.option}`}
                      values={{ goal: goalOf(impact.goalId)?.name ?? '' }}
                    />
                  </span>
                  <span className={styles.optionNote}>
                    <FormattedMessage id={`simEvent.optionNote.${impact.option}`} />
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {/* ONE control to the preview, because the preview shows every
              option at once — a per-row "Preview impact" (mockup 25) would ask
              the user to choose before seeing, which inverts 14.8's order. */}
          <Button variant="primary" fullWidth onClick={() => setStage('preview')}>
            <FormattedMessage id="simEvent.previewImpact" />
          </Button>
          {/* Mockup 25 closes with "…you can try again" — which would be FALSE
              here: D-s §4 ruled R1 as one live sandbox with NO reset, so a
              resolved event is resolved for good. What IS true is the thing
              worth saying anyway: the decision is real practice, the money
              isn't. */}
          <p className={styles.footnote}>
            <LucideIcon name="info" size={14} />
            <FormattedMessage id="simEvent.purpose" />
          </p>
        </>
      ) : (
        <>
          {/* Above the cards, not below them (mockup 26 puts it at the top):
              a reader who wants to reconsider should not have to scroll past
              every option to find the way back. */}
          <button type="button" className={styles.back} onClick={() => setStage('presented')}>
            <LucideIcon name="chevron-left" size={16} />
            <FormattedMessage id="simEvent.back" />
          </button>
          <ul className={styles.impacts}>
            {impacts.map((impact) => (
              <ExpenseImpactCard
                key={`${impact.option}:${impact.goalId ?? ''}`}
                impact={impact}
                goal={goalOf(impact.goalId)}
                currency={state.currency}
                currencySymbol={currencySymbol}
                expenseAmount={due.amount}
                splitValue={impact.goalId ? (splitInput[impact.goalId] ?? '') : ''}
                onSplitChange={(goalId, raw) =>
                  setSplitInput((prev) => ({ ...prev, [goalId]: raw }))
                }
                onChoose={setConfirming}
              />
            ))}
          </ul>
          <p className={styles.footnote}>
            <LucideIcon name="info" size={14} />
            <FormattedMessage id="simEvent.projectionsNote" />
          </p>
        </>
      )}

      {confirming ? (
        <Manifest
          titleId="simEvent.confirmTitle"
          /* A split comes from TWO places, so the manifest itemizes both — the
             FC-15 discipline: the signing surface states exactly what moves
             and from where, never a rounded-up single source. */
          rows={[
            { labelId: 'simEvent.manifest.event', value: <FormattedMessage id="simEvent.name" /> },
            { labelId: 'simEvent.manifest.amount', value: amount },
            ...(confirming.option === 'split' && confirming.goalId
              ? [
                  {
                    labelId: 'simEvent.manifest.fromReserve',
                    value: `${goalOf(confirming.goalId)?.name ?? ''} · ${money(
                      splitAmounts[confirming.goalId].toFixed(2)
                    )}`,
                  },
                  {
                    labelId: 'simEvent.manifest.fromAvailable',
                    value: money((due.amount - splitAmounts[confirming.goalId]).toFixed(2)),
                  },
                ]
              : [
                  {
                    labelId: 'simEvent.manifest.from',
                    value:
                      confirming.option === 'useReserve'
                        ? (goalOf(confirming.goalId)?.name ?? '')
                        : intl.formatMessage({ id: 'simEvent.available' }),
                  },
                ]),
          ]}
          ctaId="simEvent.manifest.cta"
          reassuranceId="simEvent.manifest.reassurance"
          onApprove={commit}
          onCancel={() => setConfirming(null)}
        />
      ) : null}
    </section>
  );
}
