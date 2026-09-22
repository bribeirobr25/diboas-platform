/**
 * PROVIDER OPERATIONAL DISPOSITION — may this source be USED, and for what.
 *
 * ⚑ THIS IS NOT FALLBACK ELIGIBILITY, and the two must never be read as one
 * question (Founder/Legal 2026-09-22 §2). Disposition asks *"may we use this
 * source at all, and for which uses"*. Eligibility asks *"when the primary is
 * gone, may this OTHER source stand in"* — a question about the substitute's
 * own rights, which Legal states plainly as `PRIMARY RIGHTS != FALLBACK
 * RIGHTS`. A source can be perfectly ACTIVE as a primary and still be an
 * ineligible fallback for something else. They live in separate modules with
 * separate vocabularies on purpose; see `fallbackEligibility.ts`.
 *
 * ⚑ INFRASTRUCTURE-ONLY (canon §6). Nothing here is exposed to Product. Product
 * continues to consume availability / freshness / origin / actionability /
 * provenance, exactly as before. A disabled source reaches Product as an ABSENT
 * OBSERVATION, which the existing controlled-unavailable path already handles —
 * no new Product ontology, copy, ranking or hiding rule.
 *
 * ## The three states, in Legal's own words (2026-09-22)
 *
 * ```text
 * ACTIVE      current use-specific clearance satisfied
 * RESTRICTED  only uses expressly left eligible may continue
 * DISABLED    no new collection / current-facing use
 * ```
 *
 * Those two verbs — *collection* and *current-facing use* — are the whole use
 * taxonomy, because they are the two things Legal actually rules on. They are
 * not invented axes: `NEW_COLLECTION` is "may we issue a request", and
 * `CURRENT_FACING` is the boundary Stage H already enforces by age.
 *
 * ⚑ INCOHERENT DECLARATIONS ARE UNREPRESENTABLE. `permits` exists only on the
 * RESTRICTED arm. A declaration cannot say DISABLED while permitting a use, or
 * ACTIVE while withholding one, because there is no syntax for it. That is
 * deliberate: a boolean-per-use shape would have allowed exactly those states.
 */

import type { EvidenceSourceId } from './types';

/** The two uses Legal rules on. Not an open taxonomy — add one only if Legal does. */
export type SourceUse = 'NEW_COLLECTION' | 'CURRENT_FACING';

/**
 * ⚑ MODULE-PRIVATE, with `SOURCE_DISPOSITIONS` below, under the standing ruling
 * that an export kept only for tests is still an export kept for nothing
 * (the `EVIDENCE_RETENTION_DAYS` precedent). Measured: zero production
 * consumers outside this file. The registry is tested through `permitsUse` and
 * `isSourceUsable`, which is the behaviour that actually matters — a missing
 * declaration makes a source unusable, and THAT is observable.
 */
type SourceDisposition =
  | { readonly state: 'ACTIVE'; readonly because: string }
  | {
      readonly state: 'RESTRICTED';
      /** The uses expressly left eligible. Anything absent is refused. */
      readonly permits: readonly SourceUse[];
      readonly because: string;
    }
  | { readonly state: 'DISABLED'; readonly because: string };

/**
 * Every source this build has, and its operational disposition.
 *
 * ⚑ `Record<EvidenceSourceId, …>` ON PURPOSE. A source added to
 * `EVIDENCE_SOURCES` without a disposition is a COMPILE ERROR, never a silent
 * ACTIVE — the same technique as `PROTOCOL_RETURN_MODEL`, `CAPABILITIES` and
 * `project()`'s exhaustiveness. A new provider therefore cannot arrive
 * already-enabled by omission, which is the failure mode this whole module
 * exists to make impossible.
 *
 * `because` records the AUTHORITY, not a restatement of the state.
 */
const SOURCE_DISPOSITIONS: Record<EvidenceSourceId, SourceDisposition> = {
  defillama: {
    state: 'ACTIVE',
    because:
      'Current Practice use (unauthenticated reference reads, 6 h cadence, not persisted) is the use in place when the provider-safety architecture was ratified 2026-09-22. This declaration RECORDS that status; it does not grant it. A narrowing by Legal is applied by editing this entry — which is the point of the entry existing.',
  },
  coingecko: {
    state: 'ACTIVE',
    because:
      'As above. The optional x-cg-demo-api-key is a free-tier entitlement header, not an expenditure: no paid plan exists in this repository and none may be activated automatically (see fallbackEligibility.ts).',
  },
  fixture: {
    state: 'ACTIVE',
    because:
      'diBoaS-authored reference values — internally owned provenance, no third-party rights engaged, which is the basis already recorded in the F-A ingestion guard ("evidence diBoaS itself owns end to end"). ⚑ This says the fixture may be USED. Whether it may stand in FOR a failed provider is a separate question and is NOT answered here.',
  },
};

/**
 * May `source` be used for `use`?
 *
 * `alsoDisabled` is an OPERATIONAL restriction supplied by the deployment (the
 * runtime kill switch). It can only ever SUBTRACT: it is consulted first and
 * refuses outright, and there is deliberately no parameter that can grant a use
 * the declaration withholds. A configuration file must never be able to
 * re-enable something Legal disabled — so the override is monotone-restrictive
 * by construction, not by review.
 *
 * An unknown source id refuses. Fail-closed is the only safe direction for a
 * permissions question, and `EvidenceSourceId` does not protect a value that
 * arrived from stored data at runtime.
 */
export function permitsUse(
  source: EvidenceSourceId,
  use: SourceUse,
  alsoDisabled?: ReadonlySet<string>
): boolean {
  if (alsoDisabled?.has(source)) return false;
  const disposition = SOURCE_DISPOSITIONS[source] as SourceDisposition | undefined;
  if (!disposition) return false;
  switch (disposition.state) {
    case 'ACTIVE':
      return true;
    case 'RESTRICTED':
      return disposition.permits.includes(use);
    case 'DISABLED':
      return false;
  }
}

/**
 * Is this source usable for ANY purpose?
 *
 * The construction-seam question: a source that permits nothing must not be
 * built at all, so that "cannot issue a request" is structural rather than a
 * check somebody has to remember to call at each call site.
 */
export function isSourceUsable(
  source: EvidenceSourceId,
  alsoDisabled?: ReadonlySet<string>
): boolean {
  return (
    permitsUse(source, 'NEW_COLLECTION', alsoDisabled) ||
    permitsUse(source, 'CURRENT_FACING', alsoDisabled)
  );
}
