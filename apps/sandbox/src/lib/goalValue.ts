import Decimal from 'decimal.js';
import type { LedgerState } from '@diboas/banking';

/**
 * A goal's current value = its uninvested cash + the current value of its open
 * positions (principal + accrued). The single source of truth for "how much is
 * in this goal right now", shared by Home, Goal-detail, and the goals-list —
 * previously duplicated inline in each, which is how a value-omission bug slips
 * in (Home/Move once dropped goal cash). Pure; returns a Decimal so callers do
 * their own ratio/format math.
 */
export function goalCurrentValue(state: LedgerState, goalId: string): Decimal {
  const goal = state.goals.find((g) => g.goalId === goalId);
  if (!goal) return new Decimal(0);
  let total = new Decimal(goal.cash);
  for (const p of state.positions) {
    if (p.goalId === goalId && p.open) {
      total = total.plus(p.principal).plus(p.accrued);
    }
  }
  return total;
}
