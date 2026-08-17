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

/**
 * Whether a goal has reached its target — the DERIVED `target_reached` fact
 * (D-e §3, board §3.1): `current ≥ target`, recomputed, NEVER stored. It may
 * honestly un-reach if the market dips, so it is never a sticky flag; the goal
 * flips to the `accomplished` status only by the user's disposition choice.
 * A zero/absent target is never "reached".
 */
export function goalTargetReached(state: LedgerState, goalId: string): boolean {
  const goal = state.goals.find((g) => g.goalId === goalId);
  if (!goal) return false;
  const target = new Decimal(goal.targetAmount);
  if (target.lte(0)) return false;
  return goalCurrentValue(state, goalId).gte(target);
}
