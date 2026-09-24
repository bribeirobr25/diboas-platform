/**
 * PRACTICE EVIDENCE POLICY — the mode's standard, declared in one place.
 *
 * ⚑ WHAT WAS SCATTERED. The Practice standard existed, but only as constants
 * spread across modules and a single-value union in a third: the ≤6h ceiling
 * lived in `types.ts` as a cache TTL, the $0 constraint lived in
 * `fallbackEligibility.ts` as an `expenditure: 'NONE'` field, and the
 * reference-grade freshness bounds lived in `freshnessPolicy.ts`. Each is
 * correct; together they were a policy nobody could read, restate or check.
 *
 * Canon states it as a policy:
 *
 * ```text
 * PURPOSE        representative simulation / decision support
 * REFRESH        <= 6 hours
 * COST           $0 under current Founder authority
 * PRECISION      reasonably representative
 * ACTIONABILITY  REFERENCE
 * EXECUTION      none
 * PROVENANCE     truthful
 * FAILURE        stale / unavailable, never fabricated
 * ```
 *
 * ⚑ THIS DECLARES, IT DOES NOT ENFORCE TWICE. Every rule below is already
 * enforced at its own seam — the cache at the TTL boundary, eligibility at the
 * single decision point, Stage H at freshness, the bounds table at validation.
 * A second enforcement path would be a second thing to keep in agreement. What
 * this adds is the ability to ASK what Practice's standard is, and a guard that
 * the scattered constants still agree with it.
 *
 * ⚑ POLICY IS NOT MODE. `LedgerScope`, Practice/Real and any mode flag are
 * absent by design: canon forbids collapsing origin, actionability,
 * availability and freshness into `mode`, and a policy object keyed by mode
 * would be exactly that collapse. This is the policy Practice HAPPENS to use;
 * Real's differs in its values, not in its shape.
 */

import { DEFAULT_PRACTICE_REFERENCE_POLICY, type FreshnessPolicy } from './freshnessPolicy';
import { boundsFor } from './evidenceBounds';
import type { EvidenceSubject } from './fallbackEligibility';
import type { Actionability } from './evidence';
import { SANDBOX_MARKET_TTL_MS } from './types';

/** What may be spent to obtain evidence under this policy. */
export type ExpenditureAuthority = 'NONE';

export interface PracticeEvidencePolicy {
  readonly id: 'practice-reference-grade';
  /** Maximum interval between refresh / revalidation attempts, in ms. */
  readonly maxRefreshIntervalMs: number;
  /** What may be spent. One value, and that is the enforcement. */
  readonly expenditure: ExpenditureAuthority;
  /** What the evidence may be used FOR. Never EXECUTABLE under this policy. */
  readonly actionability: Actionability;
  /** Whether real-money execution may depend on evidence under this policy. */
  readonly permitsExecution: false;
  /** The freshness bounds applied where no stricter source/class rule exists. */
  readonly freshness: FreshnessPolicy;
  readonly because: string;
}

export const PRACTICE_REFERENCE_POLICY: PracticeEvidencePolicy = {
  id: 'practice-reference-grade',
  maxRefreshIntervalMs: SANDBOX_MARKET_TTL_MS,
  expenditure: 'NONE',
  actionability: 'REFERENCE',
  permitsExecution: false,
  freshness: DEFAULT_PRACTICE_REFERENCE_POLICY,
  because:
    'Practice needs decision-quality reference evidence for a simulation, not execution-grade financial evidence. Refresh at most every 6 hours, at $0 under current Founder authority, reference-actionability, no real-money execution, truthful provenance, and failure that degrades or refuses rather than fabricates.',
};

/** The plausible-domain bounds this policy applies to an evidence subject. */
export function practiceBoundsFor(subject: EvidenceSubject) {
  return boundsFor(subject);
}

/**
 * Is a proposed refresh interval within the Practice ceiling?
 *
 * ⚑ A STRICTER CADENCE IS ALLOWED; A LOOSER ONE IS NOT. Canon: "a stricter
 * cadence may be defined for a particular source or evidence class. A looser
 * cadence must not be introduced without explicit authority."
 */
export function withinPracticeRefreshCeiling(intervalMs: number): boolean {
  return (
    Number.isFinite(intervalMs) &&
    intervalMs > 0 &&
    intervalMs <= PRACTICE_REFERENCE_POLICY.maxRefreshIntervalMs
  );
}
