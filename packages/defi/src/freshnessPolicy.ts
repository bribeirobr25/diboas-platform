/**
 * FRESHNESS POLICY — the 7/14 rule is a DEFAULT, not a universal evidence law.
 *
 * M&E / Data ruling 2026-09-22 (`5.309` RESOLVED, option **A3 ·
 * SOURCE/CATEGORY-SPECIFIC**):
 *
 * ```text
 * DEFAULT PRACTICE PERIODIC REFERENCE / FALLBACK POLICY = 7 / 14 days
 * stricter source policy            -> overrides the default
 * stricter classification policy    -> overrides the default
 * executable / provider quote expiry -> governs that executable evidence
 * a WEAKER default must NEVER override a stricter evidence contract
 * ```
 *
 * ⚑ WHY THIS IS NOT KEYED ON `CostCategory`. The 5.435 generic-axis
 * requirement is binding: H may operate through `DataStamp`, availability,
 * actionability and **policy classification**, and may NOT depend generically
 * on `CostCoverage` or the cost taxonomy. So the second override axis is
 * `EvidenceClass` — H's own policy classification — and this module imports
 * nothing from the cost taxonomy at all. A network-cost datum and a rate datum
 * can therefore share one policy, which is the point.
 *
 * ⚑ NO SPECULATIVE REGISTRY. Both override maps are EMPTY today, because no
 * source or classification policy is currently authorized. The ruling asks for
 * a mechanism *capable of receiving* a stricter policy, not for invented
 * provider policies — so this file adds the seam and zero content behind it.
 * Registering an entry is a one-line data change, not surgery.
 */

import type { EvidenceSourceId } from './types';

/**
 * H's own policy classification — deliberately NOT the cost taxonomy.
 *
 * One member today: the class the `5.309` ruling actually governs. A second
 * member is added when a second class is authorized, never in anticipation.
 */
export type EvidenceClass = 'practice-periodic-reference';

/**
 * The age contract for one class of evidence, under CURRENT-FACING use.
 *
 * `supportsCurrent` is a capability of the SOURCE CONTRACT, not a shorter age
 * band — the choice §K of the migration plan left open to Engineering
 * ("whether `CURRENT` becomes reachable via a source-contract capability
 * rather than a shorter age band"). It is deliberately orthogonal to the
 * bands: a source may promise real time and still be evaluated for age.
 */
export interface FreshnessPolicy {
  /** Stable id, so a refusal can name the contract that refused. */
  readonly id: string;
  /** Inclusive upper bound of the normal age window, in days. */
  readonly delayedMaxDays: number;
  /** Inclusive upper bound of bounded-stale use, in days. */
  readonly staleMaxDays: number;
  /**
   * May `CURRENT` ever be asserted for this class?
   *
   * `false` for every policy today: neither live provider's contract promises
   * real time and the sandbox caches for 6 h, so `<= 7 days` resolves to
   * DELAYED. `<=7 days != automatically CURRENT` (ruling §2) is enforced HERE,
   * by this flag, rather than by a comment.
   */
  readonly supportsCurrent: boolean;
}

/**
 * The governed default: Practice periodic reference / fallback evidence, where
 * no stricter source or classification contract exists.
 *
 * These are the same 7 and 14 the repository already shipped — the ruling did
 * not move the numbers, it bounded what they GOVERN.
 */
export const DEFAULT_PRACTICE_REFERENCE_POLICY: FreshnessPolicy = {
  id: 'practice-periodic-reference',
  delayedMaxDays: 7,
  staleMaxDays: 14,
  supportsCurrent: false,
};

/**
 * Source-specific overrides. EMPTY: no provider policy is authorized today.
 *
 * ⚑ Adding an entry here does NOT make it win. It wins only if
 * `isStricterOrEqual` accepts it — see `resolveFreshnessPolicy`.
 */
const SOURCE_POLICIES = new Map<EvidenceSourceId, FreshnessPolicy>();

/** Classification-specific overrides. EMPTY, for the same reason. */
const CLASS_POLICIES = new Map<EvidenceClass, FreshnessPolicy>();

/**
 * Is `candidate` at least as strict as `baseline` on BOTH bounds?
 *
 * Both, deliberately. A candidate that tightens the stale bound while loosening
 * the delayed bound is not "stricter" — it is a different contract, and
 * accepting it would let an override smuggle a weakening past a rule whose
 * whole purpose is that weakening cannot happen. Mixed candidates are refused,
 * and the default stands.
 */
export function isStricterOrEqual(candidate: FreshnessPolicy, baseline: FreshnessPolicy): boolean {
  return (
    candidate.delayedMaxDays <= baseline.delayedMaxDays &&
    candidate.staleMaxDays <= baseline.staleMaxDays
  );
}

/**
 * The policy governing one piece of evidence.
 *
 * Precedence, in one place so it cannot be re-derived differently elsewhere:
 *
 * ```text
 * start at the DEFAULT
 * a classification override applies only if stricter-or-equal
 * a source override applies only if stricter-or-equal than THAT
 * ```
 *
 * Source is evaluated last because it is the most specific statement about the
 * datum. Neither axis can ever WEAKEN what it overrides, so the result is
 * always at least as strict as the default — which is the ruling's
 * "a weaker default must never override a stricter evidence contract", read in
 * the only direction that is safe to automate.
 */
export function resolveFreshnessPolicy(subject: {
  source?: EvidenceSourceId;
  evidenceClass?: EvidenceClass;
}): FreshnessPolicy {
  let policy = DEFAULT_PRACTICE_REFERENCE_POLICY;
  const byClass = subject.evidenceClass ? CLASS_POLICIES.get(subject.evidenceClass) : undefined;
  if (byClass && isStricterOrEqual(byClass, policy)) policy = byClass;
  const bySource = subject.source ? SOURCE_POLICIES.get(subject.source) : undefined;
  if (bySource && isStricterOrEqual(bySource, policy)) policy = bySource;
  return policy;
}
