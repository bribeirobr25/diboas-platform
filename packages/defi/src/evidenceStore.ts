/**
 * `EvidenceStore` — the evidence PERSISTENCE PORT.
 *
 * Declared here so the domain package owns the contract, and implemented by the
 * host app, which injects the driver. Exactly the `ILedgerStore` / `SqlExecutor`
 * split that already works: `@diboas/defi` stays dependency-free and no SQL
 * enters a domain package.
 *
 * ⚑ THE PORT ENCODES NO MODE. `Practice` / `Real` appear in no signature, no
 * key and no column. Mode is POLICY over shared evidence (Strategy §20); the
 * composition layer binds whatever namespace it needs at construction.
 *
 * ⚑ APPEND-ONLY + A SEPARATE POINTER. Records are history and are never
 * rewritten; exactly one record per evidence identity is ACTIVE, and activation
 * is its own guarded statement. Insert can succeed while activation fails — the
 * record is then inert, which is a representable and recoverable state. A
 * half-active one is not representable at all.
 *
 * ⚑ ACTIVATION ORDERS BY INGESTION, NOT BY FRESHNESS. See `activate`.
 */

import type { EvidenceEnvelope } from './evidence';
import {
  EVIDENCE_SCHEMA_VERSION,
  ingestionKeyInput,
  payloadDigestInput,
  toPayloadV1,
} from './evidencePayload';
import type { EvidencePayloadV1 } from './evidencePayload';

/** Injected so the domain package needs no crypto and stays browser-safe. */
export type EvidenceHasher = (input: string) => string;

/** What a caller offers the store. Every identity is computed, never guessed. */
export interface EvidenceRecordCandidate {
  recordId: string;
  evidenceKey: string;
  schemaVersion: number;
  ingestionKey: string;
  payloadDigest: string;
  payload: EvidencePayloadV1;
  /**
   * ⛑ THE RETENTION ANCHOR — when this record entered our custody.
   *
   * RECORD metadata, not evidence semantics: it says when we began HOLDING the
   * datum, never anything about the datum. It is therefore a column, not a
   * payload field, and it is supplied explicitly by the ingesting caller rather
   * than defaulted by the database, so the moment is stated rather than
   * inferred.
   *
   * ⚑ IT IS NOT `stamp.asOf`, AND A VERIFICATION PROVED WHY. `asOf` is
   * retrieval time for the live providers (both stamp it from the cache
   * entry's fetch moment), but for the FIXTURE class — the only class eligible
   * for persistence today — `asOf` is `FIXTURE_AS_OF`, a hardcoded
   * documentation date identical to `observedAt`. Anchoring retention there
   * gave a record ingested on 2026-09-22 only 24 days of life instead of 90,
   * and from 2026-10-16 every new fixture record would have been BORN EXPIRED:
   * writable, never activatable, never readable, purged within 24 h.
   *
   * Legal's rule is "90 elapsed days from original retrievedAt". Custody is
   * what retention measures, and custody begins here.
   */
  retrievedAt: string;
}

/** What the store returns for a write. `DUPLICATE` is a normal outcome. */
export type EvidencePutResult =
  { status: 'INSERTED'; seq: number } | { status: 'DUPLICATE'; seq: number; storedDigest: string };

/** What the store returns for an activation. `NOT_NEWER` is a normal outcome. */
export type EvidenceActivationResult =
  | { status: 'ACTIVATED'; seq: number }
  | { status: 'NOT_NEWER'; activeSeq: number }
  /** Past its 90-day operational window — never activatable (Legal 2026-09-22). */
  | { status: 'EXPIRED'; retrievedAt: string };

export interface EvidenceActiveRecord {
  seq: number;
  evidenceKey: string;
  payload: EvidencePayloadV1;
}

export interface EvidenceStore {
  /**
   * Insert if the ingestion key is new; report a duplicate otherwise.
   *
   * A duplicate returns the STORED digest so the caller can distinguish a true
   * retry (equal) from a CONTRADICTION (different payload under an identical
   * observation identity). The store never overwrites and never decides which
   * of two contradicting payloads is right.
   */
  put(candidate: EvidenceRecordCandidate): Promise<EvidencePutResult>;

  /**
   * Point this evidence identity at `seq`, guarded.
   *
   * ⛑ RETENTION. `now` is REQUIRED: an expired record is NEVER eligible for
   * activation. Without this the CAS guard would happily point an identity at a
   * record Legal has ordered out of operational use.
   *
   * ```text
   * GUARANTEE     a LOWER ingestion seq cannot replace a HIGHER one
   * NOT GUARANTEED semantic freshness — BIGSERIAL orders INGESTION, not
   *               observation time. A record observed earlier but ingested
   *               later carries a higher seq and WOULD become active.
   *               Freshness evaluation is H-owned and is not implemented here.
   * ```
   */
  activate(evidenceKey: string, seq: number, now: Date | string): Promise<EvidenceActivationResult>;

  /**
   * The active record for an identity, or `null` when none is active.
   *
   * ⛑ RETENTION (Legal 2026-09-22). `now` is REQUIRED so the store can apply
   * the 90-day operational window. An expired record resolves to `null` — it is
   * excluded from operational AND ordinary audit reads, and can never be served
   * to a current-facing consumer, whether or not the purge job has run yet.
   *
   * Required rather than defaulted: a silent `new Date()` would make "no
   * retention enforcement" the meaning of silence, which is the exact
   * semantic-default failure the explicit-origin contract exists to prevent.
   */
  readActive(evidenceKey: string, now: Date | string): Promise<EvidenceActiveRecord | null>;

  /**
   * Permanently remove every record past its 90-day window, with its pointers.
   *
   * Legal requires live-storage purge within 24 h of expiry. This is the
   * OPERATION; scheduling it is an infrastructure responsibility recorded as
   * such, not something this package can guarantee.
   *
   * ⚑ PURGE MUST NOT ACTIVATE ANYTHING. Deleting the active record of an
   * identity leaves that identity with NO active pointer — it must never fall
   * back to an older record, because an older record is necessarily also
   * expired (it was retrieved earlier) and resurrecting it would serve data
   * Legal just ordered deleted.
   *
   * `hold` is the minimum legal-hold seam (§10): evidence identities named in a
   * documented, matter-specific hold are skipped. It is deliberately a plain
   * set and not a case-management system — generic audit interest is not a
   * legal hold, and nothing here decides what a hold is.
   */
  purgeExpired(input: {
    now: Date | string;
    hold?: ReadonlySet<string>;
  }): Promise<EvidencePurgeResult>;
}

/** What a purge run removed, and what it deliberately left alone. */
export interface EvidencePurgeResult {
  /** Records permanently deleted from live storage. */
  purgedRecords: number;
  /** Active pointers removed because the record they named was purged. */
  purgedPointers: number;
  /** Expired records skipped because a documented legal hold names them. */
  heldRecords: number;
}

/**
 * Build the candidate: payload, then both identities, in one place.
 *
 * Takes an AVAILABLE envelope on purpose. An UNAVAILABLE record has no stamp,
 * so it has no observation identity under the rule above, and inventing one for
 * it would be a NEW identity rule rather than an application of the accepted
 * one. F-A does not persist refusals; defining that belongs with the increment
 * that needs it.
 */
export function buildEvidenceCandidate(input: {
  evidenceKey: string;
  envelope: Extract<EvidenceEnvelope<number>, { availability: 'AVAILABLE' }>;
  unit: string;
  recordId: string;
  hash: EvidenceHasher;
  /** When this record enters our custody — the retention anchor. Required. */
  retrievedAt: string;
  scale?: number;
}): EvidenceRecordCandidate {
  const payload = toPayloadV1(input.envelope, input.unit, input.scale);
  return {
    recordId: input.recordId,
    evidenceKey: input.evidenceKey,
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    ingestionKey: input.hash(
      ingestionKeyInput({
        evidenceKey: input.evidenceKey,
        stamp: input.envelope.stamp,
        normalization: input.envelope.normalization,
      })
    ),
    payloadDigest: input.hash(payloadDigestInput(payload)),
    payload,
    retrievedAt: input.retrievedAt,
  };
}
