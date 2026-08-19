/**
 * The weekly-cycle derivations (§2.3, WG-1 + D-r §3) — pure functions from
 * ledger state (+ the decline record) to what the cycle screens need: which
 * weeks are collectible now, whether the refill ceiling pauses collection, and
 * the standing proposal the active rule drafts for uncollected-unresolved
 * credits. No appends here — the emitting actions live in `ledgerClient`.
 */

import Decimal from 'decimal.js';
import { collectibleWeeks, creditCeilingReached, type LedgerState } from '@diboas/banking';
import { generateProposal, type Proposal } from '@diboas/investing';
import { creditCeilingAmount, MAX_UNCOLLECTED_WEEKS } from './growthConstants';

/** What the Collect surface renders: the weeks a tap would grant, or why not. */
export interface CollectView {
  weeks: number[];
  /** The WG-1 refill ceiling pauses collection (calm copy, FT-19 — resumes by itself). */
  ceilingPaused: boolean;
}

/** `recordedAt` of every collected week, in event order (the meter's drain history). */
function collectTimes(state: LedgerState): string[] {
  return state.events.filter((e) => e.type === 'WeeklyCreditGranted').map((e) => e.recordedAt);
}

/** The weeks collectible at `nowIso`, with the ceiling applied at the tap (W-5b). */
export function getCollectView(state: LedgerState, nowIso: string): CollectView {
  if (!state.initialized) return { weeks: [], ceilingPaused: false };
  const ceiling = new Decimal(creditCeilingAmount(state.mode)).toFixed(2);
  if (creditCeilingReached(state, ceiling)) return { weeks: [], ceilingPaused: true };
  return {
    weeks: collectibleWeeks(
      state.genesisRecordedAt,
      collectTimes(state),
      nowIso,
      MAX_UNCOLLECTED_WEEKS
    ),
    ceilingPaused: false,
  };
}

/** Week indices already settled by an approved proposal (RuleApplied week-sets). */
export function appliedWeeks(state: LedgerState): number[] {
  const applied = new Set<number>();
  for (const e of state.events) {
    if (e.type === 'RuleApplied') for (const w of e.weekSet) applied.add(w);
  }
  return [...applied].sort((a, b) => a - b);
}

/**
 * Collected weeks not yet resolved by an approval OR a decline — the week-set a
 * standing proposal covers. Declined weeks stay resolved forever (their credits
 * simply live in Available; no nag, ever — D-r §3).
 */
export function unresolvedWeeks(state: LedgerState, declinedWeeks: number[]): number[] {
  const settled = new Set([...appliedWeeks(state), ...declinedWeeks]);
  return state.collectedWeeks.filter((w) => !settled.has(w));
}

/**
 * The standing proposal (D-r §3): the active rule drafts ONE proposal for the
 * sum of all unresolved collected credits (multi-week → one proposal; the
 * week-set is the idempotency key). Null when there is no active rule or
 * nothing unresolved — the 3.7 floor state (credits sit in Available) is the
 * default life, not an error. Amounts re-derive from the ledger at every call,
 * so a stale proposal is impossible by construction (W-8: missed cycles WAIT).
 */
export function deriveStandingProposal(
  state: LedgerState,
  declinedWeeks: number[],
  proposalId: string
): Proposal | null {
  const rule = state.rules.find((r) => r.status === 'active');
  if (!rule) return null;
  const weeks = unresolvedWeeks(state, declinedWeeks);
  if (weeks.length === 0) return null;
  const weekSet = new Set(weeks);
  let total = new Decimal(0);
  for (const e of state.events) {
    if (e.type === 'WeeklyCreditGranted' && weekSet.has(e.week)) total = total.plus(e.amount);
  }
  // Honest cap (2026-08-19 audit fix): the user may have moved collected
  // credits elsewhere (a manual goal funding, a recurring deposit) — the
  // proposal can only allocate what Available actually holds, so the preview
  // always equals what an approval can really apply. Zero affordable → no
  // proposal; the weeks stay unresolved and re-propose when Available allows.
  total = Decimal.min(total, new Decimal(state.buckets.working).floor());
  if (total.lte(0)) return null;
  const statusById = new Map(state.goals.map((g) => [g.goalId, g.status]));
  return generateProposal({
    proposalId,
    rule: { ruleId: rule.ruleId, ruleVersion: rule.ruleVersion, split: rule.split },
    total: total.toNumber(),
    weekSet: weeks,
    // An unknown goalId reads as dropped — the repair path, never a silent skip.
    statusOf: (goalId) => statusById.get(goalId) ?? 'dropped',
  });
}
