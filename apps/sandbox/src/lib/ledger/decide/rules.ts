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
import {
  emitted,
  noop,
  type Decision,
  type DecisionContext,
  type Note,
  type Nothing,
} from './types';

type Split = { goalId: string; percent: number }[];

/**
 * Create THE rule (one active per account, W-19a). Null when the split is invalid or a live rule
 * already exists (creating anew = editing; the UI goes through `updateRule`).
 */
export function decideCreateRule(
  intent: { split: Split },
  _env: Nothing,
  ctx: DecisionContext
): Decision<string | null, 'notInitialized' | 'invalidSplit' | 'ruleExists'> {
  const state = ctx.readState();
  if (!state.initialized) return noop(null, 'notInitialized');
  if (!isValidRuleSplit(intent.split)) return noop(null, 'invalidSplit');
  if (state.rules.some((r) => r.status !== 'deleted')) return noop(null, 'ruleExists');
  const ruleId = ctx.newId();
  return emitted(ruleId, [
    { ...stamp(ctx.newId(), ctx), type: 'RuleCreated', ruleId, split: intent.split },
  ]);
}

/** Edit the rule's split — versioned (regenerate-and-mark rides the derivation, W-19b). */
export function decideUpdateRule(
  intent: { ruleId: string; split: Split; expectedRuleVersion: number },
  _env: Nothing,
  ctx: DecisionContext
): Decision<void, 'invalidSplit'> {
  if (!isValidRuleSplit(intent.split)) return noop(undefined, 'invalidSplit');
  return emitted(undefined, [
    {
      ...stamp(ctx.newId(), ctx),
      type: 'RuleUpdated',
      ruleId: intent.ruleId,
      split: intent.split,
      expectedRuleVersion: intent.expectedRuleVersion,
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

/** What the person saw and approved (Appendix A row 15): version safety depends on these. */
export type ApplyIntent = Pick<Proposal, 'ruleId' | 'ruleVersion' | 'proposalId' | 'weekSet'> & {
  /** The adjust-this-once path (the rule is untouched; the edited amounts apply). */
  adjustedLines?: { goalId: string; amount: number }[];
};
/** What the client built (Appendix A row 15); a server re-derives these. */
export type ApplyEnv = Pick<Proposal, 'lines' | 'repairNeeded' | 'remainderToAvailable'>;

/**
 * Approve a proposal (the W-8 ceremony's commit): `RuleApplied` + a `GoalFunded` leg per fundable
 * line, one correlationId — the remainder stays in Available with no event. Fail-safe re-present
 * on every guard (D-r §3/§7):
 * - version-safety: the approval NEVER applies a rule version other than the one displayed (the
 *   domain's most important invariant);
 * - RT-G3: destinations re-validated at approval — a goal paused or dropped since generation means
 *   the state changed under the user; re-present, never apply;
 * - week-set idempotency: an already-applied week can't settle twice (the synchronous in-memory
 *   log closes the double-tap window);
 * - repair: a repair-flagged proposal needs the user's re-shape first.
 * Adjusted amounts are validated to conserve: integers ≥ 0 over the proposal's own fundable
 * destinations, summing to no more than the proposal's total.
 */
export function decideApplyRuleProposal(
  intent: ApplyIntent,
  env: ApplyEnv,
  ctx: DecisionContext
): Decision<ApplyProposalResult, ApplyRefusal> {
  const { adjustedLines } = intent;
  const state = ctx.readState();
  if (env.repairNeeded) return refuse('repairNeeded');
  const rule = state.rules.find((r) => r.ruleId === intent.ruleId && r.status === 'active');
  if (!rule || rule.ruleVersion !== intent.ruleVersion) return refuse('staleRuleVersion');
  // The shared derivation, not a second copy of it: this is the double-apply guard, so the
  // definition of "already applied" must be the SAME one the weekly surface uses to decide what is
  // still unresolved. Two copies of an idempotency rule is two chances to disagree about whether
  // money moved.
  const applied = new Set(appliedWeeks(state));
  if (intent.weekSet.some((w) => applied.has(w))) return refuse('alreadyApplied');

  const fundable = env.lines.filter((l) => !l.pausedDiversion);
  let lines = fundable;
  if (adjustedLines) {
    const allowed = new Set(fundable.map((l) => l.goalId));
    const total = fundable.reduce((s, l) => s + l.amount, 0) + env.remainderToAvailable;
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
  // Available re-validation (2026-08-19 audit fix): the engine's GoalFunded case refuses an
  // unaffordable leg (recorded since P8a), so an approval must never emit legs Available can't
  // cover, or "approved" would move nothing while marking the weeks applied. Fail-safe re-present
  // instead (the derivation caps at Available, so a regenerated proposal is always applyable).
  const fundTotal = lines.reduce((s, l) => s + l.amount, 0);
  if (new Decimal(state.buckets.working).lt(fundTotal)) return refuse('insufficientAvailable');

  const correlationId = ctx.newId();
  const events: LedgerEvent[] = [
    {
      ...stamp(correlationId, ctx),
      type: 'RuleApplied',
      ruleId: intent.ruleId,
      ruleVersion: intent.ruleVersion,
      proposalId: intent.proposalId,
      weekSet: intent.weekSet,
    },
  ];
  let skipped = 0;
  for (const line of lines) {
    if (line.amount <= 0) {
      skipped += 1;
      continue;
    }
    events.push({
      ...stamp(correlationId, ctx),
      type: 'GoalFunded',
      goalId: line.goalId,
      amount: new Decimal(line.amount).toFixed(2),
    });
  }
  // D4's notes, defined in `types.ts`: no funding leg at all, or some of the proposal's lines (a
  // paused diversion, a zero line) not funded while others were.
  const funded = events.length - 1;
  const notes: Note[] =
    funded === 0
      ? ['weeksAppliedWithoutFunding']
      : skipped > 0 || fundable.length < env.lines.length
        ? ['linesDropped']
        : [];
  return emitted({ ok: true }, events, [], notes);
}

/**
 * Decline a proposal: nothing moves, credits stay in Available, no nag — only the decline is
 * remembered (P2BD-11). Reads no state and appends nothing: its whole effect is the record (D6).
 */
export function decideDeclineProposal(
  intent: Pick<Proposal, 'weekSet'>,
  _env: Nothing,
  _ctx: DecisionContext
): Decision<void, never> {
  return emitted(undefined, null, [{ type: 'ProposalDeclined', weekSet: intent.weekSet }]);
}
