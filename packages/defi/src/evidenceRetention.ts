/**
 * EVIDENCE RETENTION — the 90-day operational life of derived evidence.
 *
 * Legal/Data ruling 2026-09-22:
 *
 * ```text
 * DERIVED MODELLED EVIDENCE   = 90 elapsed days from ORIGINAL retrievedAt
 * PROVENANCE METADATA         = same 90-day window
 * ACTIVATION HISTORY          = same snapshot-specific window
 * BACKUP / PITR               = at most 30 additional days
 * INDEFINITE RETENTION        = NO
 * ```
 *
 * ⚑ THE CLOCK IS DERIVED, NEVER STORED — and that is the whole design.
 *
 * A stored `expires_at` column would be a SECOND clock, and a second clock is a
 * thing that can be written again: a copy, a re-activation, a supersession or a
 * pointer reassignment would each be an opportunity to reset it, and the bug
 * would be silent. Deriving expiry from the record's own `stamp.asOf` — the
 * retrieval moment already persisted inside the payload — means there is
 * nothing to reset. Immutability is structural rather than enforced.
 *
 * This is also what makes RESTORE protection free (Legal §8): a record restored
 * from a backup carries its original `asOf` in its payload, so it evaluates as
 * expired the instant it is read. No separate expiry state can be stale or
 * missing, because none exists.
 *
 * ⚑ RETENTION IS NOT FRESHNESS. Stage H decides whether evidence may answer a
 * CURRENT-FACING question (7/14-day default policy, source/class aware).
 * Retention decides whether the record may exist and be queried AT ALL. They
 * run on different clocks against different rules for different owners, and
 * nothing here may be implemented by moving a datum between CURRENT / DELAYED /
 * STALE / MISSING.
 *
 * ⚑ PROVIDER-AGNOSTIC. Nothing in this module names a provider, a chain or a
 * payload shape. It reads one timestamp. Swapping the source cannot change the
 * lifecycle, which is the Practice Market Data canon's §7 / §11 / §20
 * requirement expressed as code.
 */

/**
 * The ruled operational window, in elapsed days from the original retrieval.
 *
 * "Elapsed" is literal: 90 × 24 h, not 90 calendar dates. A calendar reading
 * would make the window depend on the reader's timezone, and a retention
 * boundary that moves with the observer is not a boundary.
 */
export const EVIDENCE_RETENTION_DAYS = 90;

/** The ruled maximum additional life of backup/PITR copies, after operational deletion. */
export const EVIDENCE_BACKUP_MAX_ADDITIONAL_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export class EvidenceRetentionError extends Error {}

/**
 * ⛑ WHY THE RETENTION ANCHOR IS NOT `stamp.asOf` — verified 2026-09-22.
 *
 * A first version of this module derived expiry from `payload.stamp.asOf`, on
 * the strength of that field's contract: *"RETRIEVAL / refresh timestamp: when
 * we fetched, never when we served"*. The naming was right for the live
 * providers and wrong for the class that actually persists.
 *
 * ```text
 * defillama / coingecko   asOf = new Date(cacheEntry.at)   = fetch moment  ✓
 * fixture                 asOf = FIXTURE_AS_OF             = a hardcoded
 *                                                            documentation
 *                                                            date, identical
 *                                                            to observedAt    ✗
 * ```
 *
 * And the fixture class is the ONLY one eligible for persistence today
 * (`FIXTURE_LANE_SOURCES = {'fixture'}` plus an origin check), so the anchor
 * was wrong for 100% of persistable evidence, not for an edge case. Measured
 * consequence: a record ingested 2026-09-22 received 24 days of life instead
 * of 90, and from 2026-10-16 every new fixture record would have been born
 * expired — writable, never activatable, never readable, purged within 24 h.
 *
 * The anchor is therefore `EvidenceRecordCandidate.retrievedAt`: explicit,
 * caller-supplied, RECORD metadata. `asOf` keeps its meaning untouched — the
 * canon rule `observedAt != retrievedAt` is preserved rather than papered over
 * by redefining a field to make retention work.
 */

/**
 * When a record retrieved at `retrievedAt` leaves its operational window.
 *
 * Pure and total: the same input always yields the same instant, so a copy, a
 * re-activation, a supersession and a pointer reassignment all compute the
 * identical expiry. There is no path that produces a later one.
 */
export function evidenceExpiresAt(retrievedAt: string): string {
  const at = Date.parse(retrievedAt);
  if (!Number.isFinite(at)) {
    throw new EvidenceRetentionError(`retrievedAt is not a parseable instant: ${retrievedAt}`);
  }
  return new Date(at + EVIDENCE_RETENTION_DAYS * DAY_MS).toISOString();
}

/**
 * Has this record passed its operational window?
 *
 * The boundary is EXCLUSIVE at the low side and INCLUSIVE at expiry: at exactly
 * `retrievedAt + 90d` the record IS expired. 89 d 23 h 59 m is retained. A
 * boundary stated one way in code and the other way in a test is how a
 * retention rule quietly becomes 91 days, so both are pinned.
 *
 * An unparseable clock or an unparseable stamp is treated as EXPIRED, not as
 * retained — the fail-closed direction. Retention protects people; a broken
 * timestamp must not extend how long their data is held.
 */
export function isEvidenceExpired(retrievedAt: string, now: Date | string): boolean {
  const ref = typeof now === 'string' ? Date.parse(now) : now.getTime();
  const at = Date.parse(retrievedAt);
  if (!Number.isFinite(ref) || !Number.isFinite(at)) return true;
  return ref >= at + EVIDENCE_RETENTION_DAYS * DAY_MS;
}

/** The same question asked of a stored record, which carries its own anchor. */
export function isRecordExpired(record: { retrievedAt: string }, now: Date | string): boolean {
  return isEvidenceExpired(record.retrievedAt, now);
}

// ── Reduced source statistic (Legal §6) ──────────────────────────────────────

/**
 * May a reduced source statistic be persisted for this evidence class?
 *
 * Legal was explicit that this must NOT become a universal mandatory field.
 * Both conditions must hold, independently:
 *
 * ```text
 * 1. the statistic is genuinely needed to audit THAT evidence class
 * 2. the SOURCE'S OWN RIGHTS separately permit retaining it
 * ```
 *
 * Neither condition is satisfied by any evidence class today, so nothing
 * persists one — which is why no field for it exists in the payload, and why a
 * guard test asserts that absence rather than trusting this comment.
 *
 * When one is ever retained, its expiry is bounded BY the record's: a statistic
 * that outlived the evidence it describes would be a second retention clock,
 * and there is only ever one.
 */
export function mayPersistReducedStatistic(policy: {
  neededForAuditOfThisClass: boolean;
  sourceRightsPermitRetention: boolean;
}): boolean {
  return policy.neededForAuditOfThisClass && policy.sourceRightsPermitRetention;
}
