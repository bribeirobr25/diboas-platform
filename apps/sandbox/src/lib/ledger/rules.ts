/**
 * D-r rule actions + the W-8 approval ceremony (P2BD-4 extraction). Composed
 * over the `ledger/core` seam; consumed via the `ledgerClient` barrel. Since S1a
 * (plan P12) each is an adapter: the rule is in `decide/rules.ts`. Semantics unchanged.
 */

import { type Proposal } from '@diboas/investing';
import { applyDecision } from './applyDecision';
import { browserContext } from './browserContext';
import {
  decideApplyRuleProposal,
  decideCreateRule,
  decideDeclineProposal,
  decideUpdateRule,
  type ApplyProposalResult,
} from './decide/rules';
import { NOTHING } from './decide/types';

export type { ApplyProposalResult };

/**
 * Create THE rule (one active per account, W-19a) — the G9 builder's emitter
 * seam, called by `RulesBuilderScreen`. Returns the ruleId, or null.
 * Decision: `decideCreateRule`.
 */
export function createRule(split: { goalId: string; percent: number }[]): string | null {
  return applyDecision(decideCreateRule({ split }, NOTHING, browserContext));
}

/** Edit the rule's split (versioned, W-19b). Decision: `decideUpdateRule`. */
export function updateRule(
  ruleId: string,
  split: { goalId: string; percent: number }[],
  expectedRuleVersion: number
): void {
  applyDecision(decideUpdateRule({ ruleId, split, expectedRuleVersion }, NOTHING, browserContext));
}

/**
 * Approve a proposal (the W-8 ceremony's commit); `adjustedLines` = the
 * adjust-this-once path. Decision: `decideApplyRuleProposal`.
 */
export function applyRuleProposal(
  proposal: Proposal,
  adjustedLines?: { goalId: string; amount: number }[]
): ApplyProposalResult {
  const { ruleId, ruleVersion, proposalId, weekSet, lines, repairNeeded, remainderToAvailable } =
    proposal;
  return applyDecision(
    decideApplyRuleProposal(
      { ruleId, ruleVersion, proposalId, weekSet, adjustedLines },
      { lines, repairNeeded, remainderToAvailable },
      browserContext
    )
  );
}

/** Decline a proposal: only the decline is remembered (P2BD-11). Decision: `decideDeclineProposal`. */
export function declineProposal(proposal: Proposal): void {
  applyDecision(decideDeclineProposal({ weekSet: proposal.weekSet }, NOTHING, browserContext));
}
