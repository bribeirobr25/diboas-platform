/**
 * D-e goal-lifecycle appliers (spec: SANDBOX_SPEC_D-E) + the W-17e label move.
 * Semantics unchanged by the P2BD-4 extraction — bodies verbatim from the
 * former `project()` cases.
 */

import type {
  GoalAccomplished,
  GoalCashReleased,
  GoalDropped,
  GoalPaused,
  GoalResumed,
  GoalTargetChanged,
  PositionReassigned,
} from '../events';
import type { GoalStatus } from '../state';
import { d, ZERO } from '../money';
import type { GoalEntry, ProjectionContext } from './context';

export type GoalLifecycleEvent =
  | GoalPaused
  | GoalResumed
  | GoalDropped
  | GoalAccomplished
  | PositionReassigned
  | GoalTargetChanged
  | GoalCashReleased;

// D-e: resolve a goal for a status transition — exists · version matches
// (optimistic concurrency) · in an allowed FROM state. Returns null to SKIP
// (stale/illegal → the UI re-presents). The caller bumps `version` on a real
// apply, so a rejected move (e.g. insufficient cash) never advances it.
function goalFor(
  ctx: ProjectionContext,
  goalId: string,
  expectedVersion: number,
  allowedFrom: GoalStatus[]
): GoalEntry | null {
  const goal = ctx.goals.get(goalId);
  if (!goal) return null;
  if (goal.s.version !== expectedVersion) return null;
  if (!allowedFrom.includes(goal.s.status)) return null;
  return goal;
}

export function applyGoalLifecycleEvent(ctx: ProjectionContext, event: GoalLifecycleEvent): void {
  switch (event.type) {
    case 'GoalPaused': {
      const g = goalFor(ctx, event.goalId, event.expectedVersion, ['active']);
      if (g) {
        g.s.status = 'paused';
        g.s.version += 1;
      }
      break;
    }
    case 'GoalResumed': {
      const g = goalFor(ctx, event.goalId, event.expectedVersion, ['paused']);
      if (g) {
        g.s.status = 'active';
        g.s.version += 1;
      }
      break;
    }
    case 'GoalDropped': {
      const g = goalFor(ctx, event.goalId, event.expectedVersion, ['active', 'paused']);
      if (g) {
        // Uninvested cash returns to Available (working) via THIS event — a
        // MOVE within `held`, so reconcile stays 0.00 (H-3.1: never silent).
        ctx.working.v = ctx.working.v.plus(g.cash);
        g.cash = ZERO;
        g.s.status = 'dropped';
        g.s.version += 1;
      }
      break;
    }
    case 'GoalAccomplished': {
      const g = goalFor(ctx, event.goalId, event.expectedVersion, ['active', 'paused']);
      if (g) {
        // Zero-value: any money rides the disposition's own events.
        g.s.status = 'accomplished';
        g.s.version += 1;
      }
      break;
    }
    case 'GoalTargetChanged': {
      const g = goalFor(ctx, event.goalId, event.expectedVersion, ['active', 'paused']);
      if (g) {
        g.s.targetAmount = event.newTarget;
        g.s.version += 1;
      }
      break;
    }
    case 'GoalCashReleased': {
      const g = goalFor(ctx, event.goalId, event.expectedVersion, ['active', 'paused']);
      if (g) {
        const amount = d(event.amount);
        // Guarded partial release — a MOVE goal cash → Available. Bump only
        // on a real release, so a rejected (over-budget) one is a clean no-op.
        if (amount.gt(0) && g.cash.gte(amount)) {
          g.cash = g.cash.minus(amount);
          ctx.working.v = ctx.working.v.plus(amount);
          g.s.version += 1;
        }
      }
      break;
    }
    case 'PositionReassigned': {
      // Label-only (W-17e): no version, no money. Move the position's goal
      // association + its display aggregates between goals. reconcile is
      // indifferent — the position stays held, counted once, just relabeled.
      const position = ctx.positions.get(event.positionId);
      if (!position || !position.s.open || position.s.goalId !== event.fromGoalId) break;
      const from = ctx.goals.get(event.fromGoalId);
      const to = ctx.goals.get(event.toGoalId);
      if (!from || !to) break;
      from.invested = from.invested.minus(position.principal);
      to.invested = to.invested.plus(position.principal);
      from.earnings = from.earnings.minus(position.accrued);
      to.earnings = to.earnings.plus(position.accrued);
      position.s.goalId = event.toGoalId;
      break;
    }
  }
}
