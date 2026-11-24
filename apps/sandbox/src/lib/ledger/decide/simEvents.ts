/**
 * S1a (plan P12): the simulated-expense decision (row 19). A mechanical rewrite of
 * `ledger/simEvents.ts` (D9); the resolution record becomes an effect the adapter executes after
 * the append, stamping `resolvedAt` at that moment as today (D6).
 */
import Decimal from 'decimal.js';
import { type LedgerEvent } from '@diboas/banking';
import { stamp } from './stamp';
import { emitted, noop, type Decision, type DecisionContext } from './types';

export type ResolveExpenseResult =
  { ok: true } | { ok: false; reason: 'alreadyResolved' | 'notAffordable' };
type Refusal = Extract<ResolveExpenseResult, { ok: false }>['reason'];
const refuse = (reason: Refusal) =>
  noop<ResolveExpenseResult, Refusal>({ ok: false, reason }, reason);

export type ResolveExpenseInput = {
  eventInstanceId: string;
  eventType: string;
  amount: number;
  via:
    | { path: 'available' }
    | { path: 'reserve'; goalId: string }
    | { path: 'split'; goalId: string; fromGoal: number };
};

export function decideResolveSimulatedExpense(
  input: ResolveExpenseInput,
  ctx: DecisionContext
): Decision<ResolveExpenseResult, Refusal> {
  const state = ctx.readState();
  if (!state.initialized || state.resolvedEventInstances.includes(input.eventInstanceId))
    return refuse('alreadyResolved');
  // Finiteness FIRST: NaN passes every Decimal comparison below.
  if (!Number.isFinite(input.amount)) return refuse('notAffordable');
  if (input.via.path === 'split' && !Number.isFinite(input.via.fromGoal))
    return refuse('notAffordable');
  const amount = new Decimal(input.amount);
  if (amount.lte(0)) return refuse('notAffordable');
  const correlationId = ctx.newId();
  const events: LedgerEvent[] = [];

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
    if (!usable || fromGoal.lte(0) || fromGoal.gt(amount) || new Decimal(goal.cash).lt(fromGoal))
      return refuse('notAffordable');
    if (via.path === 'split' && fromGoal.gte(amount)) return refuse('notAffordable');
    events.push({
      ...stamp(correlationId, ctx),
      type: 'GoalCashReleased',
      goalId: goal.goalId,
      amount: fromGoal.toFixed(2),
      expectedVersion: goal.version,
    });
  }
  // Available pays whatever the reserve did not, and must hold it BEFORE the release lands.
  if (new Decimal(state.buckets.working).lt(amount.minus(fromGoal))) return refuse('notAffordable');

  events.push({
    ...stamp(correlationId, ctx),
    type: 'SimulatedExpensePaid',
    eventInstanceId: input.eventInstanceId,
    amount: amount.toFixed(2),
    source: 'system',
  });
  return emitted({ ok: true }, events, [
    {
      type: 'SimulatedEventResolved',
      eventInstanceId: input.eventInstanceId,
      eventType: input.eventType,
      choice:
        input.via.path === 'reserve'
          ? 'useReserve'
          : input.via.path === 'split'
            ? 'split'
            : 'coverFromAvailable',
      correlationId,
    },
  ]);
}
