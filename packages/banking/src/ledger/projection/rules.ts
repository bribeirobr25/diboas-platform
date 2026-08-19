/**
 * D-r rule appliers (spec: SANDBOX_SPEC_D-R): the 5 zero-value CRUD events +
 * the `RuleApplied` approval marker. Semantics unchanged by the P2BD-4
 * extraction — bodies verbatim from the former `project()` cases.
 */

import type {
  RuleApplied,
  RuleCreated,
  RuleDeleted,
  RulePaused,
  RuleResumed,
  RuleUpdated,
} from '../events';
import type { RuleState, RuleStatus } from '../state';
import type { ProjectionContext } from './context';

export type RuleEvent =
  RuleCreated | RuleUpdated | RulePaused | RuleResumed | RuleDeleted | RuleApplied;

// D-r: resolve a rule for a CRUD transition — exists · version matches
// (optimistic concurrency + the version-safety invariant) · in an allowed
// FROM state. Returns null to SKIP (stale/illegal → the UI re-presents).
function ruleFor(
  ctx: ProjectionContext,
  ruleId: string,
  expectedRuleVersion: number,
  allowedFrom: RuleStatus[]
): RuleState | null {
  const rule = ctx.rules.get(ruleId);
  if (!rule) return null;
  if (rule.ruleVersion !== expectedRuleVersion) return null;
  if (!allowedFrom.includes(rule.status)) return null;
  return rule;
}

export function applyRuleEvent(ctx: ProjectionContext, event: RuleEvent): void {
  switch (event.type) {
    case 'RuleCreated': {
      // One active rule per account in R1 (W-19a, overlap-forbid): reject a
      // create while a non-deleted rule exists — the UI edits via RuleUpdated.
      const hasLiveRule = [...ctx.rules.values()].some((r) => r.status !== 'deleted');
      if (!hasLiveRule) {
        ctx.rules.set(event.ruleId, {
          ruleId: event.ruleId,
          ruleVersion: 0,
          split: event.split.map((s) => ({ goalId: s.goalId, percent: s.percent })),
          status: 'active',
        });
      }
      break;
    }
    case 'RuleUpdated': {
      const rule = ruleFor(ctx, event.ruleId, event.expectedRuleVersion, ['active', 'paused']);
      if (rule) {
        rule.split = event.split.map((s) => ({ goalId: s.goalId, percent: s.percent }));
        rule.ruleVersion += 1;
      }
      break;
    }
    case 'RulePaused': {
      const rule = ruleFor(ctx, event.ruleId, event.expectedRuleVersion, ['active']);
      if (rule) {
        rule.status = 'paused';
        rule.ruleVersion += 1;
      }
      break;
    }
    case 'RuleResumed': {
      const rule = ruleFor(ctx, event.ruleId, event.expectedRuleVersion, ['paused']);
      if (rule) {
        rule.status = 'active';
        rule.ruleVersion += 1;
      }
      break;
    }
    case 'RuleDeleted': {
      const rule = ruleFor(ctx, event.ruleId, event.expectedRuleVersion, ['active', 'paused']);
      if (rule) {
        rule.status = 'deleted';
        rule.ruleVersion += 1;
      }
      break;
    }
    case 'RuleApplied': {
      // Zero-value correlation marker (D-r §2): the money moves via the
      // GoalFunded legs sharing its correlationId. Trail-visible; reconcile
      // is indifferent (tested). Nothing to project.
      break;
    }
  }
}
