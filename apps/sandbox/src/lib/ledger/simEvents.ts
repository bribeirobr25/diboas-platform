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
  { ok: true } | { ok: false; reason: 'alreadyResolved' | 'notAffordable' };

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
  via:
    | { path: 'available' }
    | { path: 'reserve'; goalId: string }
    /** The user's OWN division (P2BD-17): `fromGoal` comes out of the reserve,
     *  the rest out of Available. diBoaS never picks the ratio. */
    | { path: 'split'; goalId: string; fromGoal: number };
}): ResolveExpenseResult {
  const state = getLedgerState();
  if (!state.initialized || state.resolvedEventInstances.includes(input.eventInstanceId))
    return { ok: false, reason: 'alreadyResolved' };
  // Finiteness FIRST, because every comparison below is a Decimal comparison
  // and NaN passes all of them: `NaN.lte(0)`, `NaN.gt(amount)`, `cash.lt(NaN)`
  // are each false, so a NaN would sail through every affordability guard and
  // append `amount: "NaN"` to the ledger. (`new Decimal(undefined)` throws
  // outright — from inside a click handler.) The UI cannot produce either
  // today, but this is an exported money API and its own contract promises
  // commit-time re-validation; `ledger/rules.ts` sets the same precedent for
  // user-entered amounts.
  if (!Number.isFinite(input.amount)) return { ok: false, reason: 'notAffordable' };
  if (input.via.path === 'split' && !Number.isFinite(input.via.fromGoal))
    return { ok: false, reason: 'notAffordable' };
  const amount = new Decimal(input.amount);
  if (amount.lte(0)) return { ok: false, reason: 'notAffordable' };
  const correlationId = generateId();
  const events: LedgerEvent[] = [];

  // One shape for all three paths: how much the reserve covers. `available`
  // is zero-from-goal and `reserve` is all-of-it, so the split is not a third
  // mechanism — it is the same one with the endpoints opened up.
  const fromGoal =
    input.via.path === 'available'
      ? new Decimal(0)
      : input.via.path === 'reserve'
        ? amount
        : new Decimal(input.via.fromGoal);

  const via = input.via;
  if (via.path !== 'available') {
    const goal = state.goals.find((g) => g.goalId === via.goalId);
    const usable = goal && (goal.status === 'active' || goal.status === 'paused');
    // A split must genuinely be one: a share of zero (or the whole thing) is
    // one of the other two paths and must arrive as that path, so the record
    // and the trail describe what the user actually chose.
    if (!usable || fromGoal.lte(0) || fromGoal.gt(amount) || new Decimal(goal.cash).lt(fromGoal))
      return { ok: false, reason: 'notAffordable' };
    if (via.path === 'split' && fromGoal.gte(amount)) return { ok: false, reason: 'notAffordable' };
    events.push({
      ...base(correlationId),
      type: 'GoalCashReleased',
      goalId: goal.goalId,
      amount: fromGoal.toFixed(2),
      expectedVersion: goal.version,
    });
  }
  // Available pays whatever the reserve did not — and must hold it BEFORE the
  // release lands, since the release is what tops it up.
  if (new Decimal(state.buckets.working).lt(amount.minus(fromGoal)))
    return { ok: false, reason: 'notAffordable' };

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
    choice:
      input.via.path === 'reserve'
        ? 'useReserve'
        : input.via.path === 'split'
          ? 'split'
          : 'coverFromAvailable',
    resolvedAt: new Date().toISOString(),
  });
  return { ok: true };
}
