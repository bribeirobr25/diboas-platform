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

export interface Proposal {
  proposalId: string;
  ruleId: string;
  ruleVersion: number;
  /** The week keys this proposal covers — the idempotency key (multi-week → ONE proposal). */
  weekSet: string[];
  lines: AllocationLine[];
  remainderToAvailable: number;
  status: ProposalStatus;
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
