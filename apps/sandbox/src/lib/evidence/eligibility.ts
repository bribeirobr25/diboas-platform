/**
 * The F-A RUNTIME INGESTION ELIGIBILITY GUARD.
 *
 * ⚑ WHY THIS EXISTS, stated plainly: a persisted CONVERTED value carries an
 * external `rateStamp`, an external source identity and a derived FX
 * calculation — which engages LC-LIC-01's storage, retention and derived-data
 * rights, whose per-provider position is `CONDITIONAL` and has not been
 * cleared. The first durable runtime producer is therefore restricted to
 * evidence diBoaS itself owns end to end.
 *
 * ```text
 * F-A runtime persistence eligible
 *   = fixture/MODELLED evidence
 *   + internally owned provenance
 *   + unconverted base value
 * ```
 *
 * ⚑ THIS IS AN F-A SCOPE GUARD, NOT A PERMISSIONS ARCHITECTURE. It is a narrow
 * allow-list for one increment, not a generic provider-licensing engine, and no
 * provider-contract research is encoded in it. The eventual permissions model
 * arrives with G, where a source's cleared position is what opens a lane.
 *
 * It fails SAFE: anything not explicitly in the fixture lane is refused, so a
 * future source added to `EVIDENCE_SOURCES` cannot become persistable by
 * accident — it stays ineligible until someone changes THIS file deliberately.
 */

import { mayPersistNormalized, type EvidenceEnvelope } from '@diboas/defi';

/** The only sources F-A may persist. Internally owned, no third-party rights. */
/**
 * ⛑ THE LANE IS NOW A DECLARED RIGHT, NOT A HARD-CODED SET (Block D).
 *
 * This was `new Set(['fixture'])`, so widening the persistable lane meant
 * editing a predicate here. Whether a source's normalized evidence may be
 * stored at rest is a LC-LIC-01 question with a named owner, so it is declared
 * per source in `@diboas/defi`'s `sourcePersistenceRights` with its basis —
 * and widening it is a data change made by whoever holds the authority.
 *
 * ⚑ NO SOURCE'S EFFECTIVE STATE CHANGES. `fixture` persists as before; the two
 * providers do not. Fetch authority does not carry storage authority, and a
 * material expansion of retention is an explicit review trigger.
 */

export type IngestionIneligibility =
  /** The envelope carries no value to persist (F-A does not persist refusals). */
  | 'NOT_AVAILABLE'
  /** A converted value carries external conversion provenance — LC-LIC-01. */
  | 'EXTERNAL_NORMALIZATION'
  /** The base evidence is not from the explicitly allowed fixture lane. */
  | 'EXTERNAL_SOURCE'
  /** Only MODELLED fixture evidence is in the F-A lane. */
  | 'ORIGIN_NOT_MODELLED';

export type IngestionEligibility =
  | { eligible: true; envelope: Extract<EvidenceEnvelope<number>, { availability: 'AVAILABLE' }> }
  | { eligible: false; reason: IngestionIneligibility };

/**
 * Decide whether this envelope may be persisted by the F-A runtime producer.
 *
 * Order matters only for which reason is reported first; every rule is a hard
 * refusal. Ineligible evidence is NOT persisted, NOT activated, and changes no
 * Product response — the caller logs the reason and returns.
 */
export function evaluateIngestionEligibility(
  envelope: EvidenceEnvelope<number>
): IngestionEligibility {
  if (envelope.availability !== 'AVAILABLE') {
    return { eligible: false, reason: 'NOT_AVAILABLE' };
  }
  if (envelope.normalization.converted) {
    return { eligible: false, reason: 'EXTERNAL_NORMALIZATION' };
  }
  if (!mayPersistNormalized(envelope.stamp.source)) {
    return { eligible: false, reason: 'EXTERNAL_SOURCE' };
  }
  if (envelope.stamp.origin !== 'MODELLED') {
    return { eligible: false, reason: 'ORIGIN_NOT_MODELLED' };
  }
  return { eligible: true, envelope };
}
