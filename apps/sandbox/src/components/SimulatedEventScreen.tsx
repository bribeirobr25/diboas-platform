'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';
import { CURRENCY_SYMBOL, type SandboxLocale } from '@/i18n/config';
import { useLedger } from '@/hooks/useLedger';
import { useFormatters } from '@/hooks/useFormatters';
import { resolveSimulatedExpense } from '@/lib/ledgerClient';
import {
  affordableExpenseOptions,
  dueSimulatedEvent,
  expenseImpacts,
  type ExpenseImpact,
} from '@/lib/simulatedEvents';
import { Button } from './Button';
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
  const splitAmounts = Object.fromEntries(
    Object.entries(splitInput)
      .map(([goalId, raw]) => [goalId, Number(raw)] as const)
      .filter(([, n]) => Number.isFinite(n) && n > 0)
  );
  const impacts = due && options ? expenseImpacts(state, due.amount, options, splitAmounts) : [];
  const goalOf = (goalId?: string) => state.goals.find((g) => g.goalId === goalId);

  /** A split is choosable only once the typed share sits inside its bounds. */
  function splitReady(impact: ExpenseImpact): boolean {
    if (impact.option !== 'split' || !impact.bounds || !impact.goalId) return true;
    const entered = splitAmounts[impact.goalId];
    return entered != null && entered >= impact.bounds.min && entered <= impact.bounds.max;
  }

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
    // A refusal means the balance moved under the preview (another tab, a
    // deposit): the derivation re-runs from the ledger and re-presents the
    // real options — never a silent no-op on a money surface (P7).
    if (result.ok) router.push(`/${locale}`);
    else setStage('presented');
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
            {impacts.map((impact) => {
              const goal = goalOf(impact.goalId);
              return (
                <li key={`${impact.option}:${impact.goalId ?? ''}`} className={styles.impact}>
                  <div className={styles.impactHead}>
                    <span className={styles.optionIcon}>
                      <LucideIcon name={OPTION_ICON[impact.option]} size={20} />
                    </span>
                    <span className={styles.optionName}>
                      <FormattedMessage
                        id={`simEvent.option.${impact.option}`}
                        values={{ goal: goal?.name ?? '' }}
                      />
                    </span>
                    {/* Labelled as a projection, always (Q3: never a promise). */}
                    <span className={styles.projectionTag}>
                      <FormattedMessage id="simEvent.projection" />
                    </span>
                  </div>
                  <dl className={styles.figures}>
                    <div className={styles.figure}>
                      <dt>
                        <FormattedMessage id="simEvent.available" />
                      </dt>
                      <dd>
                        <span className={impact.pending ? styles.after : styles.before}>
                          {money(impact.availableBefore.toFixed(2))}
                        </span>
                        {/* No arrow, no "after", until there IS one. */}
                        {impact.pending ? null : (
                          <>
                            <LucideIcon name="arrow-right" size={14} />
                            <span className={styles.after}>
                              {money(impact.availableAfter.toFixed(2))}
                            </span>
                          </>
                        )}
                      </dd>
                    </div>
                    {impact.goalCashBefore != null && impact.goalCashAfter != null ? (
                      <div className={styles.figure}>
                        <dt>{goal?.name}</dt>
                        <dd>
                          <span className={impact.pending ? styles.after : styles.before}>
                            {money(impact.goalCashBefore.toFixed(2))}
                          </span>
                          {impact.pending ? null : (
                            <>
                              <LucideIcon name="arrow-right" size={14} />
                              <span className={styles.after}>
                                {money(impact.goalCashAfter.toFixed(2))}
                              </span>
                            </>
                          )}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  {impact.option === 'split' && impact.bounds && impact.goalId ? (
                    /* The user's own division (P2BD-17). A typed field, not a
                       slider: UX-16 puts sliders on casual bounded inputs and
                       precise money on a keypad. diBoaS states the BOUNDS —
                       which are arithmetic — and nothing else: no default, no
                       midpoint, no "suggested" mark, because any number here
                       would be advice about someone's reserve. */
                    <div className={styles.splitField}>
                      <label className={styles.splitLabel} htmlFor={`split-${impact.goalId}`}>
                        <FormattedMessage
                          id="simEvent.splitLabel"
                          values={{ goal: goal?.name ?? '' }}
                        />
                      </label>
                      <div className={styles.amountInput}>
                        <span className={styles.amountPrefix} aria-hidden>
                          {currencySymbol}
                        </span>
                        <input
                          id={`split-${impact.goalId}`}
                          className={styles.amountField}
                          type="number"
                          inputMode="decimal"
                          min={impact.bounds.min}
                          max={impact.bounds.max}
                          step="0.01"
                          value={splitInput[impact.goalId] ?? ''}
                          onChange={(e) =>
                            setSplitInput((prev) => ({
                              ...prev,
                              [impact.goalId!]: e.target.value,
                            }))
                          }
                          placeholder="0.00"
                          aria-describedby={`split-range-${impact.goalId}`}
                        />
                      </div>
                      {/* The range is stated up front, not discovered by being
                          rejected — and the rest-from-Available is spelled out
                          so the split is never a number without a meaning. */}
                      <p id={`split-range-${impact.goalId}`} className={styles.splitRange}>
                        <FormattedMessage
                          id="simEvent.splitRange"
                          values={{
                            min: money(impact.bounds.min.toFixed(2)),
                            max: money(impact.bounds.max.toFixed(2)),
                          }}
                        />
                      </p>
                      {splitReady(impact) ? (
                        <p className={styles.splitRest}>
                          <FormattedMessage
                            id="simEvent.splitRest"
                            values={{
                              rest: money((due.amount - splitAmounts[impact.goalId]).toFixed(2)),
                            }}
                          />
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {impact.option === 'useReserve' ? (
                    /* Neutral, never consoling and never warning: it is what a
                       reserve is for. No amber, no "are you sure". */
                    <p className={styles.didItsJob}>
                      <FormattedMessage id="simEvent.reserveDidItsJob" />
                    </p>
                  ) : null}
                  <Button
                    variant="secondary"
                    fullWidth
                    disabled={!splitReady(impact)}
                    onClick={() => setConfirming(impact)}
                    aria-label={intl.formatMessage(
                      { id: 'simEvent.chooseLabel' },
                      {
                        option: intl.formatMessage(
                          { id: `simEvent.option.${impact.option}` },
                          { goal: goal?.name ?? '' }
                        ),
                      }
                    )}
                  >
                    <FormattedMessage id="simEvent.choose" />
                  </Button>
                  {/* A disabled control always says why (the §4.6/§4.7/§4.9
                      precedent) — here the range line above is the answer, so
                      this only names the missing step. */}
                  {!splitReady(impact) ? (
                    <p className={styles.splitHint}>
                      <FormattedMessage id="simEvent.splitHint" />
                    </p>
                  ) : null}
                </li>
              );
            })}
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
