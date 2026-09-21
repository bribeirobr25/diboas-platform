/**
 * `PostgresEvidenceStore` — the Neon-backed durable `EvidenceStore` (F-A).
 *
 * Lives in `apps/sandbox`, not `@diboas/defi`, on the same DDD grounds as
 * `PostgresLedgerStore`: SQL semantics do not belong in a domain package. It
 * implements defi's port through an injected `SqlExecutor` (the sandbox
 * `client.ts` `sql`), so `@diboas/defi` stays dependency-free — and no
 * `@diboas/defi -> @diboas/banking` edge is created, because the executor TYPE
 * is imported here, in the app, which already depends on both.
 *
 * Schema (`005` / `006`):
 *
 * ```text
 * evidence_records  append-only history. ingestion_key UNIQUE is idempotency;
 *                   UNIQUE (evidence_key, seq) is the composite-FK parent.
 * evidence_active   ONE row per evidence identity. The pointer is a SINGLE
 *                   field, record_seq, FK-bound with evidence_key — so the
 *                   activation sequence IS the sequence of the referenced
 *                   record, and pointing at another identity's record is not
 *                   representable.
 * ```
 *
 * Every statement is ONE statement: the Neon HTTP transport is one-shot and
 * cannot wrap two calls in a transaction. That is why insertion and activation
 * are separate operations rather than a single write — and why a record can
 * exist un-activated (inert, recoverable) while a half-active state cannot
 * exist at all.
 */

import type { SqlExecutor } from '@diboas/banking';
import type {
  EvidenceActivationResult,
  EvidenceActiveRecord,
  EvidencePayloadV1,
  EvidencePutResult,
  EvidenceRecordCandidate,
  EvidenceStore,
} from '@diboas/defi';
import { Logger } from '../monitoring/Logger';

export class PostgresEvidenceStore implements EvidenceStore {
  constructor(private readonly sql: SqlExecutor) {}

  /**
   * Insert if the ingestion key is new.
   *
   * `ON CONFLICT DO NOTHING RETURNING seq` returns one row on insert and ZERO
   * on a duplicate — the duplicate is then read back for its stored digest, so
   * the caller can tell a true retry from a contradiction. History is never
   * overwritten here: there is no `DO UPDATE`.
   */
  async put(candidate: EvidenceRecordCandidate): Promise<EvidencePutResult> {
    try {
      const inserted = await this.sql`
        INSERT INTO evidence_records
          (record_id, evidence_key, schema_version, ingestion_key, payload_digest, payload)
        VALUES (
          ${candidate.recordId},
          ${candidate.evidenceKey},
          ${candidate.schemaVersion},
          ${candidate.ingestionKey},
          ${candidate.payloadDigest},
          ${JSON.stringify(candidate.payload)}
        )
        ON CONFLICT (ingestion_key) DO NOTHING
        RETURNING seq
      `;
      if (inserted.length === 1) {
        return { status: 'INSERTED', seq: Number(inserted[0].seq) };
      }
      const existing = await this.sql`
        SELECT seq, payload_digest FROM evidence_records
        WHERE ingestion_key = ${candidate.ingestionKey}
      `;
      if (existing.length !== 1) {
        throw new Error(`ingestion key neither inserted nor found: ${candidate.ingestionKey}`);
      }
      return {
        status: 'DUPLICATE',
        seq: Number(existing[0].seq),
        storedDigest: String(existing[0].payload_digest),
      };
    } catch (error) {
      Logger.error(
        'PostgresEvidenceStore put failed',
        { evidenceKey: candidate.evidenceKey, ingestionKey: candidate.ingestionKey },
        error
      );
      throw error;
    }
  }

  /**
   * Guarded activation — ONE statement, atomic, compare-and-swap.
   *
   * The `WHERE evidence_active.record_seq < EXCLUDED.record_seq` on the
   * `DO UPDATE` IS the CAS: a lower ingestion sequence cannot replace a higher
   * one, and the loser receives ZERO rows — an outcome it can act on, never an
   * error and never a silent win. Re-activating the same record also returns
   * zero rows (`seq < seq` is false), so activation is idempotent.
   *
   * ⚑ This orders by INGESTION, not by semantic freshness. A record observed
   * earlier but ingested later carries a higher `seq` and WOULD become active.
   * Freshness evaluation is H-owned; the payload preserves `asOf`/`observedAt`
   * so H can make that judgement later.
   */
  async activate(evidenceKey: string, seq: number): Promise<EvidenceActivationResult> {
    try {
      const rows = await this.sql`
        INSERT INTO evidence_active (evidence_key, record_seq)
        VALUES (${evidenceKey}, ${seq})
        ON CONFLICT (evidence_key) DO UPDATE
           SET record_seq = EXCLUDED.record_seq,
               activated_at = NOW()
         WHERE evidence_active.record_seq < EXCLUDED.record_seq
        RETURNING record_seq
      `;
      if (rows.length === 1) return { status: 'ACTIVATED', seq: Number(rows[0].record_seq) };
      const current = await this.sql`
        SELECT record_seq FROM evidence_active WHERE evidence_key = ${evidenceKey}
      `;
      return { status: 'NOT_NEWER', activeSeq: Number(current[0]?.record_seq ?? seq) };
    } catch (error) {
      Logger.error('PostgresEvidenceStore activate failed', { evidenceKey, seq }, error);
      throw error;
    }
  }

  /** The active record for an identity. The join is what resolves the pointer. */
  async readActive(evidenceKey: string): Promise<EvidenceActiveRecord | null> {
    try {
      const rows = await this.sql`
        SELECT r.seq, r.evidence_key, r.payload
          FROM evidence_active a
          JOIN evidence_records r
            ON r.evidence_key = a.evidence_key AND r.seq = a.record_seq
         WHERE a.evidence_key = ${evidenceKey}
      `;
      if (rows.length !== 1) return null;
      return {
        seq: Number(rows[0].seq),
        evidenceKey: String(rows[0].evidence_key),
        payload: rows[0].payload as EvidencePayloadV1,
      };
    } catch (error) {
      Logger.error('PostgresEvidenceStore readActive failed', { evidenceKey }, error);
      throw error;
    }
  }
}
