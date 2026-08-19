/**
 * Ledger projection — pure function from the event log to the current state
 * (event sourcing: the log is the truth; balances are always derived).
 *
 * Money math is Decimal.js end to end; amounts serialize as strings in events
 * and in projected state (never floats across boundaries).
 *
 * P2BD-4 extraction (2026-08-19): the per-domain case bodies live in
 * `projection/` (core journey · D-e goals · D-r rules · §2.3 credits · §2.4
 * simulated events) over a shared `ProjectionContext`; this file keeps the
 * dispatch loop, the finalization, and the two conservation-formula readers
 * (`reconcile`, `creditCeilingReached`). State types are in `state.ts`,
 * calendar math in `cadence.ts` — both re-exported here so the public API is
 * unchanged.
 */

import type Decimal from 'decimal.js';
import type { LedgerEvent } from './events';
import { d, ZERO } from './money';
import { emptyState, type LedgerState, type RecurringSchedule, type RuleState } from './state';
import type { GoalEntry, PositionEntry, ProjectionContext } from './projection/context';
import { applyCoreEvent } from './projection/core';
import { applyGoalLifecycleEvent } from './projection/goals';
import { applyRuleEvent } from './projection/rules';
import { applyCreditEvent } from './projection/credits';
import { applySimulatedEvent } from './projection/simEvents';

export * from './state';
export * from './cadence';

/**
 * Exhaustiveness guard (P2R-13): every `LedgerEventType` must be handled in
 * `project()`'s switch. A net-new event type narrows `event` here to itself
 * (not `never`), so this fails to COMPILE until a case is added — closing the
 * "new event compiles and is silently dropped" gap. At runtime an unhandled
 * event is a bug (code older than its data), so surface it loudly.
 */
function assertNever(event: never): never {
  throw new Error(`project: unhandled ledger event ${JSON.stringify(event)}`);
}

/** Project the full event log into current state. Pure and deterministic. */
export function project(events: LedgerEvent[]): LedgerState {
  const ctx: ProjectionContext = {
    state: emptyState(),
    floor: { v: ZERO },
    cushion: { v: ZERO },
    working: { v: ZERO },
    goals: new Map<string, GoalEntry>(),
    positions: new Map<string, PositionEntry>(),
    recurring: new Map<string, RecurringSchedule>(),
    rules: new Map<string, RuleState>(),
    totals: { networkFees: ZERO, exitFees: ZERO, credited: ZERO, spent: ZERO },
  };

  for (const event of events) {
    switch (event.type) {
      case 'PlayMoneyGranted':
      case 'JobsSplitSet':
      case 'GoalCreated':
      case 'GoalFunded':
      case 'StrategyEntered':
      case 'AccrualApplied':
      case 'StrategyExited':
      case 'RecurringSet':
      case 'RecurringContributionApplied':
      case 'TimeAdvanced':
        applyCoreEvent(ctx, event);
        break;
      case 'GoalPaused':
      case 'GoalResumed':
      case 'GoalDropped':
      case 'GoalAccomplished':
      case 'PositionReassigned':
      case 'GoalTargetChanged':
      case 'GoalCashReleased':
        applyGoalLifecycleEvent(ctx, event);
        break;
      case 'RuleCreated':
      case 'RuleUpdated':
      case 'RulePaused':
      case 'RuleResumed':
      case 'RuleDeleted':
      case 'RuleApplied':
        applyRuleEvent(ctx, event);
        break;
      case 'WeeklyCreditGranted':
      case 'ComparisonCreditGranted':
        applyCreditEvent(ctx, event);
        break;
      case 'SimulatedExpensePaid':
      case 'SimulatedIncomeReceived':
        applySimulatedEvent(ctx, event);
        break;
      default:
        assertNever(event);
    }
  }

  const { state } = ctx;
  state.buckets = {
    floor: ctx.floor.v.toFixed(2),
    cushion: ctx.cushion.v.toFixed(2),
    working: ctx.working.v.toFixed(2),
  };
  state.goals = [...ctx.goals.values()].map((g) => ({
    ...g.s,
    cash: g.cash.toFixed(2),
    invested: g.invested.toFixed(2),
    earnings: g.earnings.toFixed(2),
  }));
  state.positions = [...ctx.positions.values()].map((p) => ({
    ...p.s,
    principal: p.principal.toFixed(2),
    accrued: p.accrued.toFixed(2),
  }));
  // Only surface schedules whose position is still open (a closed position's
  // schedule is inert → the UI shows nothing rather than a stale control).
  const openPositionIds = new Set(
    [...ctx.positions.values()].filter((p) => p.s.open).map((p) => p.s.positionId)
  );
  state.recurring = [...ctx.recurring.values()].filter((r) => openPositionIds.has(r.positionId));
  // Rules surface as-is (incl. deleted — history stays visible, R-4); each split
  // is copied so the projection never shares mutable refs with the map.
  state.rules = [...ctx.rules.values()].map((r) => ({
    ...r,
    split: r.split.map((s) => ({ ...s })),
  }));
  state.networkFeesPaid = ctx.totals.networkFees.toFixed(2);
  state.exitFeesPaid = ctx.totals.exitFees.toFixed(2);
  state.credited = ctx.totals.credited.toFixed(2);
  state.collectedWeeks.sort((a, b) => a - b);
  state.spent = ctx.totals.spent.toFixed(2);
  state.events = events;
  return state;
}

/** Sum of `PlayMoneyGranted` amounts — the genesis term both readers below share. */
function grantedTotal(state: LedgerState): Decimal {
  let granted = ZERO;
  for (const e of state.events) {
    if (e.type === 'PlayMoneyGranted') granted = granted.plus(d(e.amount));
  }
  return granted;
}

/**
 * Reconciliation invariant (the P.2 / C-P0 gate): total play money currently
 * held in the system equals the SYMMETRIC conservation formula (board §1a):
 *
 *   expected = granted + credited + earnings − spent − exitFees − networkFees
 *
 * `credited` (ingress: weekly credit, comparison credit, simulated income) and
 * `spent` (egress: simulated expense — money permanently gone) are the mirror
 * of the fee subtrahends. `held` never includes `spent` (gone money is gone).
 * Returns the residual (must be 0.00).
 */
export function reconcile(state: LedgerState): string {
  let earnings = ZERO;
  for (const e of state.events) {
    if (e.type === 'AccrualApplied') earnings = earnings.plus(d(e.earnings));
  }
  const held = [
    d(state.buckets.floor),
    d(state.buckets.cushion),
    d(state.buckets.working),
    ...state.goals.map((g) => d(g.cash)),
    ...state.positions.filter((p) => p.open).map((p) => d(p.principal).plus(d(p.accrued))),
  ].reduce((acc, v) => acc.plus(v), ZERO);
  const expected = grantedTotal(state)
    .plus(d(state.credited))
    .plus(earnings)
    .minus(d(state.spent))
    .minus(d(state.exitFeesPaid))
    .minus(d(state.networkFeesPaid));
  return held.minus(expected).toFixed(2);
}

/**
 * Whether the WG-1 refill ceiling pauses collection: the ceiling base has
 * reached `ceilingAmount` (2× the grant). The base is
 * `granted + credited − spent − exitFees − networkFees` — deliberately WITHOUT
 * the earnings term (P2BD-9): every term is invariant under
 * `TimeAdvanced('machine')` and its accruals, so the board-§2b bidirectional
 * rule (the time machine neither grants nor suppresses weekly credits) holds
 * by construction rather than by attribution. Distinct from the collection
 * cap: this pauses while wealth is ample; that pauses while credits sit
 * uncollected. Both resume; neither expires anything.
 */
export function creditCeilingReached(state: LedgerState, ceilingAmount: string): boolean {
  const base = grantedTotal(state)
    .plus(d(state.credited))
    .minus(d(state.spent))
    .minus(d(state.exitFeesPaid))
    .minus(d(state.networkFeesPaid));
  return base.gte(d(ceilingAmount));
}
