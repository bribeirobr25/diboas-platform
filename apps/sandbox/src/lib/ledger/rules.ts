/**
 * D-r rule actions + the W-8 approval ceremony (P2BD-4 extraction). Composed
 * over the `ledger/core` seam; consumed via the `ledgerClient` barrel.
 * Semantics unchanged.
 */

import Decimal from 'decimal.js';
import { type LedgerEvent } from '@diboas/banking';
import { isValidRuleSplit, type Proposal } from '@diboas/investing';
import { generateId } from '../ids';
import { recordDecline } from '../proposalStore';
import { appendAll, base, getLedgerState } from './core';

/**
 * Create THE rule (one active per account, W-19a) — the G9 builder's emitter
 * seam, exercised by the §2.3 ceremony tests until that screen lands. Returns
 * the ruleId, or null when the split is invalid or a live rule already exists
 * (creating anew = editing; the UI goes through `updateRule`).
 */
export function createRule(split: { goalId: string; percent: number }[]): string | null {
  const state = getLedgerState();
  if (!state.initialized || !isValidRuleSplit(split)) return null;
  if (state.rules.some((r) => r.status !== 'deleted')) return null;
  const ruleId = generateId();
  appendAll([{ ...base(generateId()), type: 'RuleCreated', ruleId, split }]);
  return ruleId;
}

/** Edit the rule's split — versioned (regenerate-and-mark rides the derivation, W-19b). */
export function updateRule(
  ruleId: string,
  split: { goalId: string; percent: number }[],
  expectedRuleVersion: number
): void {
  if (!isValidRuleSplit(split)) return;
  appendAll([{ ...base(generateId()), type: 'RuleUpdated', ruleId, split, expectedRuleVersion }]);
}

export type ApplyProposalResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | 'staleRuleVersion'
        | 'destinationChanged'
        | 'repairNeeded'
        | 'alreadyApplied'
        | 'insufficientAvailable';
    };

/**
 * Approve a proposal (the W-8 ceremony's commit): `RuleApplied` + a
 * `GoalFunded` leg per fundable line, one correlationId — the remainder stays
 * in Available with no event. Fail-safe re-present on every guard (D-r §3/§7):
 * - version-safety: the approval NEVER applies a rule version other than the
 *   one displayed (the domain's most important invariant);
 * - RT-G3: destinations re-validated at approval — a goal paused/dropped since
 *   generation means the state changed under the user; re-present, never apply;
 * - week-set idempotency: an already-applied week can't settle twice (the
 *   synchronous in-memory log closes the double-tap window);
 * - repair: a repair-flagged proposal needs the user's re-shape first.
 * `adjustedLines` = the adjust-this-once path (rule untouched; edited amounts
 * apply, recorded on the proposal by the caller). Amounts are validated to
 * conserve: integers ≥ 0 over the proposal's own fundable destinations, sum ≤
 * the proposal total.
 */
export function applyRuleProposal(
  proposal: Proposal,
  adjustedLines?: { goalId: string; amount: number }[]
): ApplyProposalResult {
  const state = getLedgerState();
  if (proposal.repairNeeded) return { ok: false, reason: 'repairNeeded' };
  const rule = state.rules.find((r) => r.ruleId === proposal.ruleId && r.status === 'active');
  if (!rule || rule.ruleVersion !== proposal.ruleVersion)
    return { ok: false, reason: 'staleRuleVersion' };
  const applied = new Set<number>();
  for (const e of state.events) {
    if (e.type === 'RuleApplied') for (const w of e.weekSet) applied.add(w);
  }
  if (proposal.weekSet.some((w) => applied.has(w))) return { ok: false, reason: 'alreadyApplied' };

  const fundable = proposal.lines.filter((l) => !l.pausedDiversion);
  let lines = fundable;
  if (adjustedLines) {
    const allowed = new Set(fundable.map((l) => l.goalId));
    const total = fundable.reduce((s, l) => s + l.amount, 0) + proposal.remainderToAvailable;
    const valid =
      adjustedLines.every(
        (l) => allowed.has(l.goalId) && Number.isInteger(l.amount) && l.amount >= 0
      ) &&
      new Set(adjustedLines.map((l) => l.goalId)).size === adjustedLines.length &&
      adjustedLines.reduce((s, l) => s + l.amount, 0) <= total;
    if (!valid) return { ok: false, reason: 'destinationChanged' };
    lines = adjustedLines;
  }
  // RT-G3: every destination must still be an ACTIVE goal at approval time.
  const statusById = new Map(state.goals.map((g) => [g.goalId, g.status]));
  if (lines.some((l) => statusById.get(l.goalId) !== 'active'))
    return { ok: false, reason: 'destinationChanged' };
  // Available re-validation (2026-08-19 audit fix): the engine's GoalFunded
  // case silently skips an unaffordable leg — an approval must therefore never
  // emit legs Available can't cover, or "approved" would move nothing while
  // marking the weeks applied. Fail-safe re-present instead (the derivation
  // caps at Available, so a regenerated proposal is always applyable).
  const fundTotal = lines.reduce((s, l) => s + l.amount, 0);
  if (new Decimal(state.buckets.working).lt(fundTotal))
    return { ok: false, reason: 'insufficientAvailable' };

  const correlationId = generateId();
  const events: LedgerEvent[] = [
    {
      ...base(correlationId),
      type: 'RuleApplied',
      ruleId: proposal.ruleId,
      ruleVersion: proposal.ruleVersion,
      proposalId: proposal.proposalId,
      weekSet: proposal.weekSet,
    },
  ];
  for (const line of lines) {
    if (line.amount <= 0) continue;
    events.push({
      ...base(correlationId),
      type: 'GoalFunded',
      goalId: line.goalId,
      amount: new Decimal(line.amount).toFixed(2),
    });
  }
  appendAll(events);
  return { ok: true };
}

/** Decline a proposal: nothing moves, credits stay in Available, no nag — only the decline is remembered (P2BD-11). */
export function declineProposal(proposal: Proposal): void {
  recordDecline(proposal.weekSet);
}
