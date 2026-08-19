/**
 * D-r rules engine — the allocation math + domain types.
 * Spec: SANDBOX_SPEC_D-R_RULES_ENGINE (ratified 2026-08-08). Integer credits.
 *
 * A Rule is a PROPOSAL-GENERATOR: it never moves money on its own. The only
 * thing it produces is an allocation the user must approve (the W-8 ceremony),
 * so `RuleApplied` always follows a fresh user approval — the compliance
 * invariant of the whole domain (CLO: no execution without approval).
 */

/** Lifecycle status of a rule (one active per account in R1, W-19a). */
export type RuleStatus = 'active' | 'paused' | 'deleted';

/** One line of a rule's split: an integer-percent share to a goal. */
export interface RuleSplitLine {
  goalId: string;
  /** Integer 1..100. */
  percent: number;
}

/** One computed allocation line: an integer amount to a goal. */
export interface AllocationLine {
  goalId: string;
  amount: number;
}

/** The result of applying a rule to a total — the core of a Proposal. */
export interface Allocation {
  lines: AllocationLine[];
  /** The arithmetic remainder that stays in Available — a VISIBLE line, never hidden (D-r §5). */
  remainderToAvailable: number;
}

/**
 * A proposal: what the rule WOULD do with a collected total. Integer amounts,
 * always carrying the rule version that generated it (version-safety, D-r §3).
 * Proposals live in their OWN store, never the C-P0 ledger set (they move no
 * money). `expired` is real-mode-reserved — the sandbox never enters it (D-r §2).
 */
export type ProposalStatus = 'proposed' | 'approved' | 'declined' | 'failed' | 'expired';

/**
 * One line of a proposal. `pausedDiversion` marks a line whose destination goal
 * is paused: the rule keeps its shape, but that share proposes to Available
 * while paused — STATED on the line, never silently skipped (D-r §3/W-17d).
 */
export interface ProposalLine extends AllocationLine {
  pausedDiversion?: boolean;
}

export interface Proposal {
  proposalId: string;
  ruleId: string;
  ruleVersion: number;
  /** The genesis-anchored week indices this proposal covers — the idempotency key (multi-week → ONE proposal). */
  weekSet: number[];
  lines: ProposalLine[];
  remainderToAvailable: number;
  status: ProposalStatus;
  /**
   * A destination goal closed (dropped/accomplished) since the rule was shaped:
   * the ceremony must open in explicit-repair ("where should that share go?") —
   * never silent skip, never silent redistribution (D-r §3). The surface asks;
   * approval is blocked until the user re-shapes or confirms.
   */
  repairNeeded: boolean;
}

/** The goal-status view generation needs — a projection of D-e state. */
export type ProposalGoalStatus = 'active' | 'paused' | 'dropped' | 'accomplished';

/**
 * Generate the ONE proposal for a collected total (D-r §3). Pure: the same
 * `allocateByRule` computes the amounts (preview == application holds through
 * generation too). Per-destination status shapes the lines:
 * - active → a normal line;
 * - paused → the line diverts to Available, visibly marked (its amount joins
 *   `remainderToAvailable`, and the line stays present with `pausedDiversion`);
 * - dropped/accomplished → the amount joins the remainder AND `repairNeeded`
 *   flips — the ceremony opens in explicit-repair, never applies silently.
 */
export function generateProposal(input: {
  proposalId: string;
  rule: { ruleId: string; ruleVersion: number; split: RuleSplitLine[] };
  total: number;
  weekSet: number[];
  statusOf: (goalId: string) => ProposalGoalStatus;
}): Proposal {
  const allocation = allocateByRule(input.total, input.rule.split);
  let remainder = allocation.remainderToAvailable;
  let repairNeeded = false;
  const lines: ProposalLine[] = [];
  for (const line of allocation.lines) {
    const status = input.statusOf(line.goalId);
    if (status === 'active') {
      lines.push(line);
    } else if (status === 'paused') {
      remainder += line.amount;
      lines.push({ ...line, pausedDiversion: true });
    } else {
      // dropped/accomplished — the share has nowhere to go; the user decides.
      remainder += line.amount;
      repairNeeded = true;
    }
  }
  return {
    proposalId: input.proposalId,
    ruleId: input.rule.ruleId,
    ruleVersion: input.rule.ruleVersion,
    weekSet: [...input.weekSet].sort((a, b) => a - b),
    lines,
    remainderToAvailable: remainder,
    status: 'proposed',
    repairNeeded,
  };
}

/**
 * THE shared allocation function (D-r §4). Floor-then-remainder: each line gets
 * `floor(total × percent / 100)`; the arithmetic remainder joins the explicit
 * "stays in Available" line. Deterministic for any `(total, split)` — replay-
 * stable. This ONE function computes BOTH the builder preview and the approval
 * application, so `preview == application` holds by construction (property-
 * tested, not by convention). Integer domain.
 */
export function allocateByRule(total: number, split: RuleSplitLine[]): Allocation {
  const lines = split.map((s) => ({
    goalId: s.goalId,
    amount: Math.floor((total * s.percent) / 100),
  }));
  const allocated = lines.reduce((sum, l) => sum + l.amount, 0);
  return { lines, remainderToAvailable: total - allocated };
}

/**
 * Validate a rule split (D-r §5): at least one line; each percent an integer
 * 1..100; no duplicate goal; the sum ≤ 100 (the un-allocated remainder renders
 * as the visible "stays in Available" line — never forced to exactly 100, never
 * auto-spread, forbid-by-construction hides nothing).
 */
export function isValidRuleSplit(split: RuleSplitLine[]): boolean {
  if (split.length === 0) return false;
  const seen = new Set<string>();
  let sum = 0;
  for (const line of split) {
    if (!Number.isInteger(line.percent) || line.percent < 1 || line.percent > 100) return false;
    if (seen.has(line.goalId)) return false;
    seen.add(line.goalId);
    sum += line.percent;
  }
  return sum <= 100;
}
