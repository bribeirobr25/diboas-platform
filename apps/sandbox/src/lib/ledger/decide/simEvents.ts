/**
 * S1a (plan P12): the simulated-expense decision (row 19). A mechanical rewrite of
 * `ledger/simEvents.ts` (D9); the platform-side choice record becomes an effect the adapter runs
 * after the append, stamping `resolvedAt` at that moment as today (D6).
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

/** What the person chose (Appendix A row 19). */
export type ExpenseIntent = {
  via:
    | { path: 'available' }
    | { path: 'reserve'; goalId: string }
    /** The user's OWN division (P2BD-17): `fromGoal` comes out of the reserve, the rest out of
     *  Available. diBoaS never picks the ratio. */
    | { path: 'split'; goalId: string; fromGoal: number };
};
/** The event itself, which the platform defines (a server re-sources it, Appendix A row 19). */
export type ExpenseEnv = { eventInstanceId: string; eventType: string; amount: number };

/**
 * Resolve the R1 unexpected-expense event with the user's chosen path (after the W-7 confirm —
 * this is the commit, not the offer). Affordability is RE-validated here (the balance may have
 * changed since the impact preview — fail-safe re-present, never a negative balance):
 * - `available`: one `SimulatedExpensePaid` from Available;
 * - `reserve`: `GoalCashReleased` (the full amount, from the chosen goal) + the expense debit, one
 *   correlationId — "the reserve did its job";
 * - `split`: the same, with the user's own share from the goal.
 * Idempotent per `eventInstanceId` (engine guard + the platform record).
 */
export function decideResolveSimulatedExpense(
  intent: ExpenseIntent,
  env: ExpenseEnv,
  ctx: DecisionContext
): Decision<ResolveExpenseResult, Refusal> {
  const state = ctx.readState();
  if (!state.initialized || state.resolvedEventInstances.includes(env.eventInstanceId))
    return refuse('alreadyResolved');
  // Finiteness FIRST, because every comparison below is a Decimal comparison and NaN passes all of
  // them: `NaN.lte(0)`, `NaN.gt(amount)`, `cash.lt(NaN)` are each false, so a NaN would sail
  // through every affordability guard and append `amount: "NaN"` to the ledger.
  // (`new Decimal(undefined)` throws outright — from inside a click handler.) The UI cannot
  // produce either today, but this is an exported money API and its own contract promises
  // commit-time re-validation; the rule decisions set the same precedent for user-entered amounts.
  if (!Number.isFinite(env.amount)) return refuse('notAffordable');
  if (intent.via.path === 'split' && !Number.isFinite(intent.via.fromGoal))
    return refuse('notAffordable');
  const amount = new Decimal(env.amount);
  if (amount.lte(0)) return refuse('notAffordable');
  const correlationId = ctx.newId();
  const events: LedgerEvent[] = [];

  // One shape for all three paths: how much the reserve covers. `available` is zero-from-goal and
  // `reserve` is all-of-it, so the split is not a third mechanism — it is the same one with the
  // endpoints opened up.
  const fromGoal =
    intent.via.path === 'available'
      ? new Decimal(0)
      : intent.via.path === 'reserve'
        ? amount
        : new Decimal(intent.via.fromGoal);

  const via = intent.via;
  if (via.path !== 'available') {
    const goal = state.goals.find((g) => g.goalId === via.goalId);
    const usable = goal && (goal.status === 'active' || goal.status === 'paused');
    // A split must genuinely be one: a share of zero (or the whole thing) is one of the other two
    // paths and must arrive as that path, so the record and the trail describe what the user
    // actually chose.
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
  // Available pays whatever the reserve did not — and must hold it BEFORE the release lands, since
  // the release is what tops it up.
  if (new Decimal(state.buckets.working).lt(amount.minus(fromGoal))) return refuse('notAffordable');

  events.push({
    ...stamp(correlationId, ctx),
    type: 'SimulatedExpensePaid',
    eventInstanceId: env.eventInstanceId,
    amount: amount.toFixed(2),
    source: 'system',
  });
  return emitted({ ok: true }, events, [
    {
      type: 'SimulatedEventResolved',
      eventInstanceId: env.eventInstanceId,
      eventType: env.eventType,
      choice:
        intent.via.path === 'reserve'
          ? 'useReserve'
          : intent.via.path === 'split'
            ? 'split'
            : 'coverFromAvailable',
      correlationId,
    },
  ]);
}
