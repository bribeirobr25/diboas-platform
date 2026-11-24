/**
 * S1a (plan P12): the rule decisions — create (row 13), update (14), the W-8 approval (15) and
 * the decline (16). A mechanical rewrite of `ledger/rules.ts` (D9): state, ids and the clock come
 * through `ctx`, at the same points and in the same order.
 */
import Decimal from 'decimal.js';
import { type LedgerEvent } from '@diboas/banking';
import { isValidRuleSplit, type Proposal } from '@diboas/investing';
import { appliedWeeks } from '../../weeklyCycle';
import { stamp } from './stamp';
import { emitted, noop, type Decision, type DecisionContext } from './types';

type Split = { goalId: string; percent: number }[];

export function decideCreateRule(
  split: Split,
  ctx: DecisionContext
): Decision<string | null, 'notInitialized' | 'invalidSplit' | 'ruleExists'> {
  const state = ctx.readState();
  if (!state.initialized) return noop(null, 'notInitialized');
  if (!isValidRuleSplit(split)) return noop(null, 'invalidSplit');
  if (state.rules.some((r) => r.status !== 'deleted')) return noop(null, 'ruleExists');
  const ruleId = ctx.newId();
  return emitted(ruleId, [{ ...stamp(ctx.newId(), ctx), type: 'RuleCreated', ruleId, split }]);
}

export function decideUpdateRule(
  input: { ruleId: string; split: Split; expectedRuleVersion: number },
  ctx: DecisionContext
): Decision<void, 'invalidSplit'> {
  if (!isValidRuleSplit(input.split)) return noop(undefined, 'invalidSplit');
  return emitted(undefined, [
    {
      ...stamp(ctx.newId(), ctx),
      type: 'RuleUpdated',
      ruleId: input.ruleId,
      split: input.split,
      expectedRuleVersion: input.expectedRuleVersion,
    },
  ]);
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
type ApplyRefusal = Extract<ApplyProposalResult, { ok: false }>['reason'];

const refuse = (reason: ApplyRefusal) =>
  noop<ApplyProposalResult, ApplyRefusal>({ ok: false, reason }, reason);

export function decideApplyRuleProposal(
  input: { proposal: Proposal; adjustedLines?: { goalId: string; amount: number }[] },
  ctx: DecisionContext
): Decision<ApplyProposalResult, ApplyRefusal> {
  const { proposal, adjustedLines } = input;
  const state = ctx.readState();
  if (proposal.repairNeeded) return refuse('repairNeeded');
  const rule = state.rules.find((r) => r.ruleId === proposal.ruleId && r.status === 'active');
  if (!rule || rule.ruleVersion !== proposal.ruleVersion) return refuse('staleRuleVersion');
  // The shared derivation, not a second copy of it (the double-apply guard).
  const applied = new Set(appliedWeeks(state));
  if (proposal.weekSet.some((w) => applied.has(w))) return refuse('alreadyApplied');

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
    if (!valid) return refuse('destinationChanged');
    lines = adjustedLines;
  }
  // RT-G3: every destination must still be an ACTIVE goal at approval time.
  const statusById = new Map(state.goals.map((g) => [g.goalId, g.status]));
  if (lines.some((l) => statusById.get(l.goalId) !== 'active')) return refuse('destinationChanged');
  // Available re-validation: never emit legs Available can't cover.
  const fundTotal = lines.reduce((s, l) => s + l.amount, 0);
  if (new Decimal(state.buckets.working).lt(fundTotal)) return refuse('insufficientAvailable');

  const correlationId = ctx.newId();
  const events: LedgerEvent[] = [
    {
      ...stamp(correlationId, ctx),
      type: 'RuleApplied',
      ruleId: proposal.ruleId,
      ruleVersion: proposal.ruleVersion,
      proposalId: proposal.proposalId,
      weekSet: proposal.weekSet,
    },
  ];
  const notes: string[] = [];
  for (const line of lines) {
    if (line.amount <= 0) continue;
    events.push({
      ...stamp(correlationId, ctx),
      type: 'GoalFunded',
      goalId: line.goalId,
      amount: new Decimal(line.amount).toFixed(2),
    });
  }
  if (events.length === 1 && lines.length === 0) notes.push('weeksAppliedWithoutFunding');
  else if (lines.length + 1 > events.length || fundable.length < proposal.lines.length)
    notes.push('linesDropped');
  return emitted({ ok: true }, events, [], notes);
}

/** Decline: nothing moves; only the decline is remembered (P2BD-11). Reads no state. */
export function decideDeclineProposal(proposal: Proposal): Decision<void, never> {
  return emitted(undefined, null, [{ type: 'ProposalDeclined', weekSet: proposal.weekSet }]);
}
