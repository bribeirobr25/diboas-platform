'use client';

import Decimal from 'decimal.js';
import { FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import { getStrategy } from '@diboas/defi';
import type { LedgerEvent } from '@diboas/banking';
import { useLedger } from '@/hooks/useLedger';
import { useFormatters } from '@/hooks/useFormatters';
import { LucideIcon, type IconName } from './LucideIcon';
import styles from './HistoryScreen.module.css';

type Sign = 'pos' | 'neg' | null;

/** Per-event display: an icon, and the signed amount (money-in green +,
 *  money-out dark -, config/no-value events a dash). */
function display(event: LedgerEvent): { icon: IconName; amount: string | null; sign: Sign } {
  switch (event.type) {
    case 'PlayMoneyGranted':
      return { icon: 'gift', amount: event.amount, sign: 'pos' };
    case 'AccrualApplied': {
      // §4.8: earnings are SIGNED now — a growth strategy replaying a real
      // price fall produces a negative. Hardcoding 'pos' + a rising arrow
      // would render a loss dressed as a gain, which is the exact dishonesty
      // the price overlay exists to remove.
      const down = Number(event.earnings) < 0;
      return {
        icon: down ? 'trending-down' : 'trending-up',
        amount: event.earnings,
        sign: down ? 'neg' : 'pos',
      };
    }
    case 'StrategyExited':
      return { icon: 'arrow-left', amount: event.grossAmount, sign: 'pos' };
    case 'StrategyEntered':
      return { icon: 'trending-up', amount: event.amount, sign: 'neg' };
    case 'GoalFunded':
      return { icon: 'target', amount: event.amount, sign: 'neg' };
    case 'RecurringContributionApplied':
      return { icon: 'repeat', amount: event.amount, sign: 'neg' };
    case 'GoalCreated':
      return { icon: 'target', amount: null, sign: null };
    case 'RecurringSet':
      return { icon: 'repeat', amount: null, sign: null };
    case 'JobsSplitSet':
      return { icon: 'list', amount: null, sign: null };
    case 'TimeAdvanced':
      return { icon: 'clock', amount: null, sign: null };
    // D-e lifecycle: zero-value transitions show no amount; the two moves
    // (drop, cash release) surface the money returning to Available.
    case 'GoalPaused':
      return { icon: 'pause', amount: null, sign: null };
    case 'GoalResumed':
      return { icon: 'play', amount: null, sign: null };
    case 'GoalDropped':
      return { icon: 'x', amount: event.cashReleased, sign: 'pos' };
    case 'GoalAccomplished':
      return { icon: 'check', amount: null, sign: null };
    case 'PositionReassigned':
      return { icon: 'arrow-right-left', amount: null, sign: null };
    case 'GoalTargetChanged':
      return { icon: 'pencil', amount: null, sign: null };
    case 'GoalCashReleased':
      return { icon: 'wallet', amount: event.amount, sign: 'pos' };
    // D-r rule CRUD: all zero-value (a rule holds no money) — no amount shown.
    case 'RuleCreated':
      return { icon: 'list', amount: null, sign: null };
    case 'RuleUpdated':
      return { icon: 'pencil', amount: null, sign: null };
    case 'RulePaused':
      return { icon: 'pause', amount: null, sign: null };
    case 'RuleResumed':
      return { icon: 'play', amount: null, sign: null };
    case 'RuleDeleted':
      return { icon: 'x', amount: null, sign: null };
    // §2.3 weekly cycle: both credits are money-in; RuleApplied is the
    // zero-value approval marker (its money shows on the GoalFunded legs).
    case 'WeeklyCreditGranted':
      return { icon: 'calendar', amount: event.amount, sign: 'pos' };
    case 'ComparisonCreditGranted':
      return { icon: 'gift', amount: event.amount, sign: 'pos' };
    case 'RuleApplied':
      return { icon: 'check', amount: null, sign: null };
    // D-s life events (clearly-fictional framing lives in the copy): expense
    // out, income in — both tagged source='system' in the ledger.
    case 'SimulatedExpensePaid':
      return { icon: 'zap', amount: event.amount, sign: 'neg' };
    case 'SimulatedIncomeReceived':
      return { icon: 'coins', amount: event.amount, sign: 'pos' };
  }
}

/**
 * The trail (B3; mockup 18) — every ledger event in plain words, newest first,
 * with a per-event icon and signed amount. Completeness invariant: every event
 * type has a line (the P.5 gate); an unknown type falls through visibly. Days
 * are honest sandbox sim-days (calendar dates arrive with the real-time model).
 */
export function HistoryScreen() {
  const intl = useIntl();
  const state = useLedger();
  const { money } = useFormatters(state.currency);

  const goalName = (goalId: string) =>
    state.goals.find((g) => g.goalId === goalId)?.name ?? goalId.slice(0, 8);

  // A rule's split in plain words: "50% Trip, 30% Car" (W-19c — the split is
  // always visible in the trail).
  const splitSummary = (split: { goalId: string; percent: number }[]) =>
    split.map((s) => `${s.percent}% ${goalName(s.goalId)}`).join(', ');

  const strategyNameByPosition = (positionId: string) => {
    const position = state.positions.find((p) => p.positionId === positionId);
    const strategy = position ? getStrategy(position.strategyId) : undefined;
    return strategy
      ? intl.formatMessage({ id: `catalog.strategies.${strategy.i18nKey}.name` })
      : (position?.strategyId ?? positionId.slice(0, 8));
  };

  function line(event: LedgerEvent): string {
    switch (event.type) {
      case 'PlayMoneyGranted':
        return intl.formatMessage({ id: 'history.granted' }, { amount: money(event.amount) });
      case 'JobsSplitSet':
        return intl.formatMessage(
          { id: 'history.split' },
          {
            floor: event.floorPercent,
            cushion: event.cushionPercent,
            working: event.workingPercent,
          }
        );
      case 'GoalCreated':
        return intl.formatMessage({ id: 'history.goalCreated' }, { name: event.name });
      case 'GoalFunded':
        return intl.formatMessage(
          { id: 'history.funded' },
          { amount: money(event.amount), name: goalName(event.goalId) }
        );
      case 'StrategyEntered': {
        const strategy = getStrategy(event.strategyId);
        const name = strategy
          ? intl.formatMessage({ id: `catalog.strategies.${strategy.i18nKey}.name` })
          : event.strategyId;
        return intl.formatMessage(
          { id: 'history.entered' },
          { amount: money(event.amount), strategy: name, fee: money(event.networkFee) }
        );
      }
      case 'AccrualApplied': {
        const position = state.positions.find((p) => p.positionId === event.positionId);
        return intl.formatMessage(
          { id: 'history.accrued' },
          {
            name: position ? goalName(position.goalId) : event.positionId.slice(0, 8),
            amount: money(event.earnings),
          }
        );
      }
      case 'StrategyExited':
        return intl.formatMessage(
          { id: 'history.exited' },
          {
            strategy: strategyNameByPosition(event.positionId),
            gross: money(event.grossAmount),
            fee: money(event.exitFee),
          }
        );
      case 'RecurringSet':
        return event.monthlyAmount === '0.00' || event.monthlyAmount === '0'
          ? intl.formatMessage({ id: 'history.recurringCleared' }, { name: goalName(event.goalId) })
          : intl.formatMessage(
              { id: 'history.recurringSet' },
              { amount: money(event.monthlyAmount), name: goalName(event.goalId) }
            );
      case 'RecurringContributionApplied':
        return intl.formatMessage(
          { id: 'history.recurringContribution' },
          { amount: money(event.amount), name: goalName(event.goalId) }
        );
      case 'TimeAdvanced':
        // Two different things wear this event type, and the trail must not
        // confuse them: `machine` is the user driving the time machine,
        // `real` is WS-F settling wall-clock days the user was simply away
        // for. Both said "Time machine: N days forward", which told people
        // they had done something they never did. (`source` is optional on
        // legacy events; the emitter's default is `machine`.)
        return intl.formatMessage(
          { id: event.source === 'real' ? 'history.timeSettled' : 'history.timeAdvanced' },
          { days: event.days }
        );
      case 'GoalPaused':
        return intl.formatMessage({ id: 'history.goalPaused' }, { name: goalName(event.goalId) });
      case 'GoalResumed':
        return intl.formatMessage({ id: 'history.goalResumed' }, { name: goalName(event.goalId) });
      case 'GoalDropped':
        return intl.formatMessage(
          { id: 'history.goalDropped' },
          { name: goalName(event.goalId), amount: money(event.cashReleased) }
        );
      case 'GoalAccomplished':
        return intl.formatMessage(
          { id: 'history.goalAccomplished' },
          { name: goalName(event.goalId) }
        );
      case 'PositionReassigned':
        return intl.formatMessage(
          { id: 'history.positionReassigned' },
          { from: goalName(event.fromGoalId), to: goalName(event.toGoalId) }
        );
      case 'GoalTargetChanged':
        return intl.formatMessage(
          { id: 'history.goalTargetChanged' },
          {
            name: goalName(event.goalId),
            old: money(event.oldTarget),
            new: money(event.newTarget),
          }
        );
      case 'GoalCashReleased':
        return intl.formatMessage(
          { id: 'history.goalCashReleased' },
          { amount: money(event.amount), name: goalName(event.goalId) }
        );
      case 'RuleCreated':
        return intl.formatMessage(
          { id: 'history.ruleCreated' },
          { split: splitSummary(event.split) }
        );
      case 'RuleUpdated':
        return intl.formatMessage(
          { id: 'history.ruleUpdated' },
          { split: splitSummary(event.split) }
        );
      case 'RulePaused':
        return intl.formatMessage({ id: 'history.rulePaused' });
      case 'RuleResumed':
        return intl.formatMessage({ id: 'history.ruleResumed' });
      case 'RuleDeleted':
        return intl.formatMessage({ id: 'history.ruleDeleted' });
      case 'WeeklyCreditGranted':
        return intl.formatMessage(
          { id: 'history.weeklyCredit' },
          { week: event.week, amount: money(event.amount) }
        );
      case 'ComparisonCreditGranted':
        return intl.formatMessage(
          { id: 'history.comparisonCredit' },
          { amount: money(event.amount) }
        );
      case 'RuleApplied':
        return intl.formatMessage({ id: 'history.ruleApplied' }, { weeks: event.weekSet.length });
      case 'SimulatedExpensePaid':
        return intl.formatMessage({ id: 'history.simExpense' }, { amount: money(event.amount) });
      case 'SimulatedIncomeReceived':
        return intl.formatMessage({ id: 'history.simIncome' }, { amount: money(event.amount) });
    }
  }

  const events = [...state.events].reverse();
  const feesPaid = new Decimal(state.networkFeesPaid).plus(state.exitFeesPaid);

  return (
    <section className={styles.wrap} aria-labelledby="history-title">
      <h1 id="history-title" className={styles.title}>
        <FormattedMessage id="history.title" />
      </h1>
      <p className={styles.reconcile}>
        <LucideIcon name="shield-check" size={20} />
        <FormattedMessage id="history.subtitle" />
      </p>
      {feesPaid.gt(0) ? (
        <p className={styles.feeDrag}>
          <FormattedMessage
            id="history.feeDrag"
            values={{
              amount: <span className={styles.feeAmount}>{money(feesPaid.toFixed(2))}</span>,
            }}
          />
        </p>
      ) : null}

      {events.length === 0 ? (
        <p className={styles.empty}>
          <FormattedMessage id="history.empty" />
        </p>
      ) : (
        <ol className={styles.list}>
          {events.map((event) => {
            const d = display(event);
            return (
              <li key={event.eventId} className={styles.item}>
                <span className={styles.icon}>
                  <LucideIcon name={d.icon} size={20} />
                </span>
                <span className={styles.body}>
                  <span className={styles.day}>
                    <FormattedMessage id="history.day" values={{ day: event.simDay }} />
                  </span>
                  <span className={styles.text}>{line(event)}</span>
                </span>
                <span className={styles.amount} data-sign={d.sign ?? 'none'}>
                  {d.amount ? (
                    <>
                      {d.sign === 'neg' ? '−' : '+'}
                      {/* ABS: §4.8 made `earnings` signed, so a negative amount
                          would otherwise print its own minus after the prefix
                          ("−-5.00"). The prefix owns the sign; the number owns
                          the magnitude. */}
                      <FormattedNumber
                        value={new Decimal(d.amount).abs().toNumber()}
                        minimumFractionDigits={2}
                        maximumFractionDigits={2}
                      />
                    </>
                  ) : (
                    '—'
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
