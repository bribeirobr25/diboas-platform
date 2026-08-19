import Decimal from 'decimal.js';
import type { LedgerState } from '@diboas/banking';

/**
 * A position's REAL value-over-time series from its own ledger events (§4.2):
 * starts at the entered principal, steps on every accrual and recurring
 * deposit. Honest by construction — no interpolation, no synthetic smoothing;
 * few events = few points (the caller hides the sparkline under 2 points).
 * The dense timeframe chart is G8's work; this is the goal-page glance.
 */
export function positionValueSeries(state: LedgerState, positionId: string): number[] {
  const points: number[] = [];
  let value: Decimal | null = null;
  for (const e of state.events) {
    if (e.type === 'StrategyEntered' && e.positionId === positionId) {
      value = new Decimal(e.amount);
      points.push(value.toNumber());
    } else if (value !== null && e.type === 'AccrualApplied' && e.positionId === positionId) {
      value = value.plus(e.earnings);
      points.push(value.toNumber());
    } else if (
      value !== null &&
      e.type === 'RecurringContributionApplied' &&
      e.positionId === positionId
    ) {
      value = value.plus(e.amount);
      points.push(value.toNumber());
    }
  }
  return points;
}
