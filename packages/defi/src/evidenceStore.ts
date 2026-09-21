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
}

/** What the store returns for a write. `DUPLICATE` is a normal outcome. */
export type EvidencePutResult =
  { status: 'INSERTED'; seq: number } | { status: 'DUPLICATE'; seq: number; storedDigest: string };

/** What the store returns for an activation. `NOT_NEWER` is a normal outcome. */
export type EvidenceActivationResult =
  { status: 'ACTIVATED'; seq: number } | { status: 'NOT_NEWER'; activeSeq: number };

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
   * ```text
   * GUARANTEE     a LOWER ingestion seq cannot replace a HIGHER one
   * NOT GUARANTEED semantic freshness — BIGSERIAL orders INGESTION, not
   *               observation time. A record observed earlier but ingested
   *               later carries a higher seq and WOULD become active.
   *               Freshness evaluation is H-owned and is not implemented here.
   * ```
   */
  activate(evidenceKey: string, seq: number): Promise<EvidenceActivationResult>;

  /** The active record for an identity, or `null` when none is active. */
  readActive(evidenceKey: string): Promise<EvidenceActiveRecord | null>;
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
  };
}
