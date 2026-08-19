/**
 * §2.4 D-s simulated-event actions: the resolve commit (P2BD-4 extraction).
 * Composed over the `ledger/core` seam; consumed via the `ledgerClient`
 * barrel. Semantics unchanged.
 */

import Decimal from 'decimal.js';
import { type LedgerEvent } from '@diboas/banking';
import { generateId } from '../ids';
import { recordResolution } from '../simulatedEventStore';
import { appendAll, base, getLedgerState } from './core';

export type ResolveExpenseResult =
  | { ok: true }
  | { ok: false; reason: 'alreadyResolved' | 'notAffordable' };

/**
 * Resolve the R1 unexpected-expense event with the user's chosen path (after
 * the W-7 confirm — this is the commit, not the offer). Affordability is
 * RE-validated here (the balance may have changed since the impact preview —
 * fail-safe re-present, never a negative balance):
 * - `available`: one `SimulatedExpensePaid` from Available;
 * - `reserve`: `GoalCashReleased` (the full amount, from the chosen goal) +
 *   the expense debit, one correlationId — "the reserve did its job".
 * Idempotent per `eventInstanceId` (engine guard + the platform record).
 * The platform-side choice record (catalogue-version-pinned) rides along.
 */
export function resolveSimulatedExpense(input: {
  eventInstanceId: string;
  eventType: string;
  amount: number;
  via: { path: 'available' } | { path: 'reserve'; goalId: string };
}): ResolveExpenseResult {
  const state = getLedgerState();
  if (!state.initialized || state.resolvedEventInstances.includes(input.eventInstanceId))
    return { ok: false, reason: 'alreadyResolved' };
  const amount = new Decimal(input.amount);
  if (amount.lte(0)) return { ok: false, reason: 'notAffordable' };
  const correlationId = generateId();
  const events: LedgerEvent[] = [];

  if (input.via.path === 'reserve') {
    const reserveGoalId = input.via.goalId;
    const goal = state.goals.find((g) => g.goalId === reserveGoalId);
    const usable = goal && (goal.status === 'active' || goal.status === 'paused');
    if (!usable || new Decimal(goal.cash).lt(amount)) return { ok: false, reason: 'notAffordable' };
    events.push({
      ...base(correlationId),
      type: 'GoalCashReleased',
      goalId: goal.goalId,
      amount: amount.toFixed(2),
      expectedVersion: goal.version,
    });
  } else if (new Decimal(state.buckets.working).lt(amount)) {
    return { ok: false, reason: 'notAffordable' };
  }

  events.push({
    ...base(correlationId),
    type: 'SimulatedExpensePaid',
    eventInstanceId: input.eventInstanceId,
    amount: amount.toFixed(2),
    source: 'system',
  });
  appendAll(events);
  recordResolution({
    eventInstanceId: input.eventInstanceId,
    eventType: input.eventType,
    choice: input.via.path === 'reserve' ? 'useReserve' : 'coverFromAvailable',
    resolvedAt: new Date().toISOString(),
  });
  return { ok: true };
}
