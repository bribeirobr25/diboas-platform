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
  EvidencePurgeResult,
} from '@diboas/defi';
import { isEvidenceExpired } from '@diboas/defi';
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
          (record_id, evidence_key, schema_version, ingestion_key, payload_digest, payload,
           ingested_at)
        VALUES (
          ${candidate.recordId},
          ${candidate.evidenceKey},
          ${candidate.schemaVersion},
          ${candidate.ingestionKey},
          ${candidate.payloadDigest},
          ${JSON.stringify(candidate.payload)},
          ${candidate.retrievedAt}
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
  async activate(
    evidenceKey: string,
    seq: number,
    now: Date | string
  ): Promise<EvidenceActivationResult> {
    try {
      /* ⛑ RETENTION (Legal 2026-09-22): an expired record is never eligible for
         activation. Checked BEFORE the CAS upsert so a newer-but-expired record
         cannot win on `seq` alone — ordering protects ingestion order, not
         lawfulness. The clock is derived from the record's own stored
         `stamp.asOf`, so there is no second column to fall out of step. */
      const candidate = await this.sql`
        SELECT ingested_at FROM evidence_records WHERE seq = ${seq}
      `;
      const retrievedAt = candidate[0]?.ingested_at as string | undefined;
      if (retrievedAt && isEvidenceExpired(retrievedAt, now)) {
        return { status: 'EXPIRED', retrievedAt };
      }
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
  async readActive(evidenceKey: string, now: Date | string): Promise<EvidenceActiveRecord | null> {
    try {
      const rows = await this.sql`
        SELECT r.seq, r.evidence_key, r.payload, r.ingested_at
          FROM evidence_active a
          JOIN evidence_records r
            ON r.evidence_key = a.evidence_key AND r.seq = a.record_seq
         WHERE a.evidence_key = ${evidenceKey}
      `;
      if (rows.length !== 1) return null;
      const payload = rows[0].payload as EvidencePayloadV1;
      const retrievedAt = String(rows[0].ingested_at);
      /* ⛑ Excluded from operational AND ordinary audit reads at expiry, not at
         purge time — the two are up to 24 h apart, and a record Legal has
         retired must not be served during that gap. A row restored from a
         backup fails here too: its clock travels inside its own payload. */
      if (isEvidenceExpired(retrievedAt, now)) return null;
      return {
        seq: Number(rows[0].seq),
        evidenceKey: String(rows[0].evidence_key),
        payload,
      };
    } catch (error) {
      Logger.error('PostgresEvidenceStore readActive failed', { evidenceKey }, error);
      throw error;
    }
  }

  /**
   * Permanently delete every record past its 90-day operational window.
   *
   * Legal requires live-storage purge within 24 h of expiry; this is the
   * operation, and SCHEDULING it is an infrastructure responsibility recorded
   * as such (see the Stage record) — this class cannot guarantee a cadence.
   *
   * ⚑ Expiry is computed in the APPLICATION, not in SQL. The clock lives in
   * `payload->'stamp'->>'asOf'` and the rule is `+90 days`; expressing that as
   * a SQL interval would create a SECOND implementation of the retention rule
   * that could drift from the first. One rule, one derivation — the same
   * discipline the `>14`-day freshness gate follows.
   *
   * ⚑ NO FALLBACK ACTIVATION. Removing an identity's active pointer leaves it
   * with none. Promoting an older record would resurrect data Legal ordered
   * deleted — an older record was retrieved earlier and is therefore also
   * expired.
   */
  async purgeExpired(input: {
    now: Date | string;
    hold?: ReadonlySet<string>;
  }): Promise<EvidencePurgeResult> {
    const hold = input.hold ?? new Set<string>();
    try {
      const rows = await this.sql`
        SELECT seq, evidence_key, ingested_at FROM evidence_records
      `;
      let purgedRecords = 0;
      let purgedPointers = 0;
      let heldRecords = 0;
      for (const row of rows) {
        if (!isEvidenceExpired(String(row.ingested_at), input.now)) continue;
        const key = String(row.evidence_key);
        if (hold.has(key)) {
          heldRecords += 1;
          continue;
        }
        const seq = Number(row.seq);
        /* Pointer first: the composite FK refuses a pointer naming a deleted
           record, so the reverse order would fail rather than leave a dangle.
           Doing it explicitly keeps the intent readable at the seam. */
        const cleared = await this.sql`
          DELETE FROM evidence_active
           WHERE evidence_key = ${key} AND record_seq = ${seq}
          RETURNING evidence_key
        `;
        purgedPointers += cleared.length;
        await this.sql`DELETE FROM evidence_records WHERE seq = ${seq}`;
        purgedRecords += 1;
      }
      return { purgedRecords, purgedPointers, heldRecords };
    } catch (error) {
      Logger.error('PostgresEvidenceStore purgeExpired failed', {}, error);
      throw error;
    }
  }
}
