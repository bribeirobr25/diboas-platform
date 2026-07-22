'use client';

import Decimal from 'decimal.js';
import { FormattedMessage, useIntl } from 'react-intl';
import { getStrategy } from '@diboas/defi';
import type { LedgerEvent } from '@diboas/banking';
import { useLedger } from '@/hooks/useLedger';
import { useFormatters } from '@/hooks/useFormatters';
import styles from './HistoryScreen.module.css';

/**
 * The trail — every ledger event rendered in plain words, newest first.
 * Completeness invariant: every event type has a line (the P.5 gate); an
 * unknown type would fall through visibly, never silently.
 */
export function HistoryScreen() {
  const intl = useIntl();
  const state = useLedger();
  const { money } = useFormatters(state.currency);

  const goalName = (goalId: string) =>
    state.goals.find((g) => g.goalId === goalId)?.name ?? goalId.slice(0, 8);

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
        return intl.formatMessage({ id: 'history.timeAdvanced' }, { days: event.days });
    }
  }

  const events = [...state.events].reverse();

  // Fee-drag (WS-E): a neutral, factual transparency line — the running cost of
  // practising, the twin of the provenance stamp. Never a loss-aversion nudge
  // (R-2); hidden when nothing has been spent.
  const feesPaid = new Decimal(state.networkFeesPaid).plus(state.exitFeesPaid);

  return (
    <section className={styles.wrap} aria-labelledby="history-title">
      <h1 id="history-title" className={styles.title}>
        <FormattedMessage id="history.title" />
      </h1>
      <p className={styles.subtitle}>
        <FormattedMessage id="history.subtitle" />
      </p>
      {feesPaid.gt(0) ? (
        <p className={styles.feeDrag}>
          <FormattedMessage id="history.feeDrag" values={{ amount: money(feesPaid.toFixed(2)) }} />
        </p>
      ) : null}
      {events.length === 0 ? (
        <p className={styles.empty}>
          <FormattedMessage id="history.empty" />
        </p>
      ) : (
        <ol className={styles.list}>
          {events.map((event) => (
            <li key={event.eventId} className={styles.item}>
              <span className={styles.day}>
                <FormattedMessage id="history.day" values={{ day: event.simDay }} />
              </span>
              <span className={styles.text}>{line(event)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
