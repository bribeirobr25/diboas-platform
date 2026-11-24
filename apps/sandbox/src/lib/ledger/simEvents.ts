/**
 * §2.4 D-s simulated-event actions: the resolve commit (P2BD-4 extraction).
 * Composed over the `ledger/core` seam; consumed via the `ledgerClient`
 * barrel. Semantics unchanged.
 */

import { recordResolution } from '../simulatedEventStore';
import { browserContext } from './browserContext';
import { appendAll } from './core';
import {
  decideResolveSimulatedExpense,
  type ResolveExpenseInput,
  type ResolveExpenseResult,
} from './decide/simEvents';

export type { ResolveExpenseResult };

/**
 * Resolve the R1 unexpected-expense event with the user's chosen path (after
 * the W-7 confirm — this is the commit, not the offer). Affordability is
 * RE-validated (fail-safe re-present, never a negative balance). Idempotent per
 * `eventInstanceId`. The platform-side choice record rides along, after the
 * append, stamped at that moment. Decision: `decideResolveSimulatedExpense`.
 */
export function resolveSimulatedExpense(input: ResolveExpenseInput): ResolveExpenseResult {
  const decision = decideResolveSimulatedExpense(input, browserContext);
  if (decision.append) appendAll(decision.append);
  for (const effect of decision.effects) {
    if (effect.type === 'SimulatedEventResolved')
      recordResolution({
        eventInstanceId: effect.eventInstanceId,
        eventType: effect.eventType,
        choice: effect.choice,
        resolvedAt: new Date().toISOString(),
      });
  }
  return decision.result;
}
