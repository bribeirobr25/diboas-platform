/**
 * §2.4 D-s simulated-event actions: the resolve commit (P2BD-4 extraction).
 * Composed over the `ledger/core` seam; consumed via the `ledgerClient`
 * barrel. Since S1a (plan P12) an adapter: the rule is in `decide/simEvents.ts`.
 * Semantics unchanged.
 */

import { applyDecision } from './applyDecision';
import { browserContext } from './browserContext';
import {
  decideResolveSimulatedExpense,
  type ExpenseEnv,
  type ExpenseIntent,
  type ResolveExpenseResult,
} from './decide/simEvents';

export type { ResolveExpenseResult };

/**
 * Resolve the R1 unexpected-expense event with the user's chosen path (the
 * W-7 commit). Idempotent per `eventInstanceId`; the platform-side choice
 * record (catalogue-version-pinned) rides along after the append, stamped at
 * that moment. Decision: `decideResolveSimulatedExpense`.
 *
 * Reads the caller's input once, here, before the decision (S1a; today's code
 * read `eventType` and `via` again after the append — no caller can change its
 * input in between, since each passes a fresh literal).
 */
export function resolveSimulatedExpense(input: ExpenseIntent & ExpenseEnv): ResolveExpenseResult {
  const { via, eventInstanceId, eventType, amount } = input;
  return applyDecision(
    decideResolveSimulatedExpense({ via }, { eventInstanceId, eventType, amount }, browserContext)
  );
}
