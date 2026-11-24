/**
 * D-r rule actions + the W-8 approval ceremony (P2BD-4 extraction). Composed
 * over the `ledger/core` seam; consumed via the `ledgerClient` barrel.
 * Semantics unchanged.
 */

import { type Proposal } from '@diboas/investing';
import { recordDecline } from '../proposalStore';
import { browserContext } from './browserContext';
import { appendAll } from './core';
import {
  decideApplyRuleProposal,
  decideCreateRule,
  decideDeclineProposal,
  decideUpdateRule,
  type ApplyProposalResult,
} from './decide/rules';
import type { Effect } from './decide/types';

export type { ApplyProposalResult };

/** Runs a decision's effects through today's stores (D6). */
function runEffects(effects: readonly Effect[]): void {
  for (const effect of effects) {
    if (effect.type === 'ProposalDeclined') recordDecline(effect.weekSet);
  }
}

/**
 * Create THE rule (one active per account, W-19a) — the G9 builder's emitter
 * seam, called by `RulesBuilderScreen` (and the §2.3 ceremony tests). Returns
 * the ruleId, or null when the split is invalid or a live rule already exists
 * (creating anew = editing; the UI goes through `updateRule`). Decision: `decideCreateRule`.
 */
export function createRule(split: { goalId: string; percent: number }[]): string | null {
  const decision = decideCreateRule(split, browserContext);
  if (decision.append) appendAll(decision.append);
  return decision.result;
}

/** Edit the rule's split — versioned (regenerate-and-mark rides the derivation, W-19b). */
export function updateRule(
  ruleId: string,
  split: { goalId: string; percent: number }[],
  expectedRuleVersion: number
): void {
  const decision = decideUpdateRule({ ruleId, split, expectedRuleVersion }, browserContext);
  if (decision.append) appendAll(decision.append);
}

/**
 * Approve a proposal (the W-8 ceremony's commit): `RuleApplied` + a
 * `GoalFunded` leg per fundable line, one correlationId — the remainder stays
 * in Available with no event. Fail-safe re-present on every guard (D-r §3/§7):
 * version-safety, RT-G3 destinations, week-set idempotency, repair, Available.
 * `adjustedLines` = the adjust-this-once path. Decision: `decideApplyRuleProposal`.
 */
export function applyRuleProposal(
  proposal: Proposal,
  adjustedLines?: { goalId: string; amount: number }[]
): ApplyProposalResult {
  const decision = decideApplyRuleProposal({ proposal, adjustedLines }, browserContext);
  if (decision.append) appendAll(decision.append);
  return decision.result;
}

/** Decline a proposal: nothing moves, credits stay in Available, no nag — only the decline is remembered (P2BD-11). */
export function declineProposal(proposal: Proposal): void {
  runEffects(decideDeclineProposal(proposal).effects);
}
