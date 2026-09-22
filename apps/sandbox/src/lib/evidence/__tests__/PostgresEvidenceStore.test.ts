import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { SqlExecutor } from '@diboas/banking';
import {
  FIXTURE_STAMP,
  buildEvidenceCandidate,
  evidenceKey,
  referenceEvidence,
  type EvidenceRecordCandidate,
} from '@diboas/defi';
import { PostgresEvidenceStore } from '../PostgresEvidenceStore';

/**
 * ⛑ RETENTION (Legal 2026-09-22). Activation and reads now take the
 * current-facing moment so the store can apply the 90-day window. These
 * fixtures carry `FIXTURE_STAMP` (retrieved 2026-07-18), so the moment below
 * sits inside the window and every assertion keeps testing what it tested
 * before. Expiry has its own tests, with their own expired clock.
 */
const WITHIN_RETENTION = '2026-07-20T00:00:00.000Z';

const sha256 = (input: string) => createHash('sha256').update(input, 'utf8').digest('hex');
const NETWORK: { kind: 'single'; category: 'network' } = { kind: 'single', category: 'network' };

/**
 * The durable adapter against a mock `sql`, hermetic — the same shape the
 * ledger adapter is proven with.
 *
 * ⚑ THE MOCK MODELS THE CONSTRAINTS, NOT THE HAPPY PATH. Migrations `005`/`006`
 * carry `ingestion_key UNIQUE`, `UNIQUE (evidence_key, seq)` and the composite
 * FK `(evidence_key, record_seq) -> (evidence_key, seq)`, and the activation
 * statement carries the CAS `WHERE`. A mock that ignored any of them would let
 * the defects those constraints exist to prevent pass silently here — which is
 * exactly how a guard ends up asserting comfort it has not earned.
 */
interface Row {
  seq: number;
  recordId: string;
  evidenceKey: string;
  ingestionKey: string;
  payloadDigest: string;
  payload: unknown;
  /** The retention anchor — custody moment, supplied explicitly by the caller. */
  ingestedAt: string;
}

function makeMockSql(): { sql: SqlExecutor; activeRows: () => Map<string, number> } {
  const records: Row[] = [];
  const active = new Map<string, number>();
  let seq = 1;
  const sql: SqlExecutor = async (strings, ...values) => {
    const q = strings.join(' ? ');
    if (q.includes('INSERT INTO evidence_records')) {
      const [recordId, key, , ingestionKey, payloadDigest, payload, ingestedAt] = values as [
        string,
        string,
        number,
        string,
        string,
        string,
        string,
      ];
      /* ingestion_key UNIQUE + ON CONFLICT DO NOTHING RETURNING seq. */
      if (records.some((r) => r.ingestionKey === ingestionKey)) return [];
      const row: Row = {
        seq: seq++,
        recordId,
        evidenceKey: key,
        ingestionKey,
        payloadDigest,
        payload: JSON.parse(payload),
        ingestedAt,
      };
      records.push(row);
      return [{ seq: row.seq }];
    }
    if (q.includes('SELECT seq, payload_digest FROM evidence_records')) {
      const [ingestionKey] = values as [string];
      return records
        .filter((r) => r.ingestionKey === ingestionKey)
        .map((r) => ({ seq: r.seq, payload_digest: r.payloadDigest }));
    }
    /* ⛑ RETENTION: the activation pre-check reads the candidate's payload so
       the adapter can apply the 90-day window before the CAS upsert. */
    if (q.includes('SELECT ingested_at FROM evidence_records WHERE seq')) {
      const [recordSeq] = values as [number];
      const row = records.find((r) => r.seq === recordSeq);
      return row ? [{ ingested_at: row.ingestedAt }] : [];
    }
    /* The purge scan: every record, so the app can apply the derived clock. */
    if (q.includes('SELECT seq, evidence_key, ingested_at FROM evidence_records')) {
      return records.map((r) => ({
        seq: r.seq,
        evidence_key: r.evidenceKey,
        ingested_at: r.ingestedAt,
      }));
    }
    if (q.includes('DELETE FROM evidence_active')) {
      const [key, recordSeq] = values as [string, number];
      if (active.get(key) !== recordSeq) return [];
      active.delete(key);
      return [{ evidence_key: key }];
    }
    if (q.includes('DELETE FROM evidence_records')) {
      const [recordSeq] = values as [number];
      const i = records.findIndex((r) => r.seq === recordSeq);
      if (i === -1) return [];
      /* The composite FK would REFUSE deleting a record a pointer still names.
         Modelling it keeps the mock honest about ordering. */
      const row = records[i];
      if (active.get(row.evidenceKey) === row.seq) {
        throw new Error(
          'update or delete on table "evidence_records" violates foreign key constraint'
        );
      }
      records.splice(i, 1);
      return [];
    }
    if (q.includes('INSERT INTO evidence_active')) {
      const [key, recordSeq] = values as [string, number];
      /* The composite FK: the pointed row must exist AND belong to this key. */
      const target = records.find((r) => r.seq === recordSeq && r.evidenceKey === key);
      if (!target) {
        throw new Error(
          'insert or update on table "evidence_active" violates foreign key constraint'
        );
      }
      const current = active.get(key);
      /* The CAS: DO UPDATE ... WHERE active.record_seq < EXCLUDED.record_seq.
         A losing update affects ZERO rows, so RETURNING yields nothing. */
      if (current !== undefined && current >= recordSeq) return [];
      active.set(key, recordSeq);
      return [{ record_seq: recordSeq }];
    }
    if (q.includes('SELECT record_seq FROM evidence_active')) {
      const [key] = values as [string];
      const current = active.get(key);
      return current === undefined ? [] : [{ record_seq: current }];
    }
    if (q.includes('FROM evidence_active a')) {
      const [key] = values as [string];
      const current = active.get(key);
      if (current === undefined) return [];
      const row = records.find((r) => r.seq === current && r.evidenceKey === key);
      return row
        ? [
            {
              seq: row.seq,
              evidence_key: row.evidenceKey,
              payload: row.payload,
              ingested_at: row.ingestedAt,
            },
          ]
        : [];
    }
    throw new Error(`mock sql: unrecognized query: ${q}`);
  };
  return { sql, activeRows: () => new Map(active) };
}

function candidate(value = 0.03, asOf?: string, unit = 'USD'): EvidenceRecordCandidate {
  const envelope = referenceEvidence({
    value,
    stamp: asOf ? { ...FIXTURE_STAMP, asOf, observedAt: asOf } : FIXTURE_STAMP,
    normalization: { converted: false },
    coverage: NETWORK,
  });
  if (envelope.availability !== 'AVAILABLE') throw new Error('unreachable');
  return buildEvidenceCandidate({
    evidenceKey: evidenceKey({ kind: 'network-cost', subject: 'Arbitrum', unit }),
    envelope,
    unit,
    recordId: `00000000-0000-4000-8000-${String(value).padStart(12, '0').slice(0, 12)}`,
    hash: sha256,
    /* Custody moment — deliberately independent of the stamp's asOf. */
    retrievedAt: WITHIN_RETENTION,
  });
}

describe('PostgresEvidenceStore — insert and idempotency', () => {
  it('should insert a new observation and return its seq', async () => {
    const { sql } = makeMockSql();
    const store = new PostgresEvidenceStore(sql);
    expect(await store.put(candidate())).toEqual({ status: 'INSERTED', seq: 1 });
  });

  it('should report a DUPLICATE with the stored digest instead of inserting twice', async () => {
    const { sql } = makeMockSql();
    const store = new PostgresEvidenceStore(sql);
    const first = candidate();
    await store.put(first);
    const result = await store.put(first);
    expect(result).toEqual({ status: 'DUPLICATE', seq: 1, storedDigest: first.payloadDigest });
  });

  it('should surface a contradiction as a digest MISMATCH, never as an overwrite', async () => {
    const { sql } = makeMockSql();
    const store = new PostgresEvidenceStore(sql);
    const original = candidate(0.03);
    await store.put(original);
    const contradicting = candidate(0.05);
    expect(contradicting.ingestionKey).toBe(original.ingestionKey);
    const result = await store.put(contradicting);
    if (result.status !== 'DUPLICATE') throw new Error('unreachable');
    expect(result.storedDigest).toBe(original.payloadDigest);
    expect(result.storedDigest).not.toBe(contradicting.payloadDigest);
  });
});

describe('PostgresEvidenceStore — activation', () => {
  it('should activate, and read the record back through the pointer join', async () => {
    const { sql } = makeMockSql();
    const store = new PostgresEvidenceStore(sql);
    const c = candidate();
    const put = await store.put(c);
    if (put.status !== 'INSERTED') throw new Error('unreachable');
    expect(await store.activate(c.evidenceKey, put.seq, WITHIN_RETENTION)).toEqual({
      status: 'ACTIVATED',
      seq: 1,
    });
    const active = await store.readActive(c.evidenceKey, WITHIN_RETENTION);
    expect(active).toMatchObject({ seq: 1, evidenceKey: c.evidenceKey });
    expect(active?.payload).toMatchObject({ value: '0.03', unit: 'USD' });
  });

  it('should be REFUSED BY THE FOREIGN KEY when the pointer names another identity', async () => {
    const { sql } = makeMockSql();
    const store = new PostgresEvidenceStore(sql);
    const put = await store.put(candidate());
    if (put.status !== 'INSERTED') throw new Error('unreachable');
    const otherKey = evidenceKey({ kind: 'network-cost', subject: 'Solana', unit: 'USD' });
    await expect(store.activate(otherKey, put.seq, WITHIN_RETENTION)).rejects.toThrow(
      /foreign key constraint/
    );
  });

  it('should not let a LOWER ingestion seq overwrite a HIGHER one', async () => {
    const { sql, activeRows } = makeMockSql();
    const store = new PostgresEvidenceStore(sql);
    const older = await store.put(candidate(0.03, '2026-09-21T00:00:00.000Z'));
    const newer = await store.put(candidate(0.04, '2026-09-22T00:00:00.000Z'));
    const key = candidate().evidenceKey;
    await store.activate(key, newer.seq, WITHIN_RETENTION);
    expect(await store.activate(key, older.seq, WITHIN_RETENTION)).toEqual({
      status: 'NOT_NEWER',
      activeSeq: newer.seq,
    });
    expect(activeRows().get(key)).toBe(newer.seq);
  });

  it('should keep activation idempotent for the same record', async () => {
    const { sql } = makeMockSql();
    const store = new PostgresEvidenceStore(sql);
    const c = candidate();
    const put = await store.put(c);
    if (put.status !== 'INSERTED') throw new Error('unreachable');
    await store.activate(c.evidenceKey, put.seq, WITHIN_RETENTION);
    expect(await store.activate(c.evidenceKey, put.seq, WITHIN_RETENTION)).toEqual({
      status: 'NOT_NEWER',
      activeSeq: put.seq,
    });
  });

  it('should return null for an identity with no active record', async () => {
    const { sql } = makeMockSql();
    const store = new PostgresEvidenceStore(sql);
    const c = candidate();
    await store.put(c);
    expect(await store.readActive(c.evidenceKey, WITHIN_RETENTION)).toBeNull();
  });
});

describe('PostgresEvidenceStore — the SQL it actually issues', () => {
  it('should carry the CAS guard and no DO UPDATE on the record insert', async () => {
    const issued: string[] = [];
    const sql: SqlExecutor = async (strings, ...values) => {
      issued.push(strings.join(' ? '));
      const q = strings.join(' ');
      if (q.includes('INSERT INTO evidence_records')) return [{ seq: 1 }];
      if (q.includes('INSERT INTO evidence_active')) return [{ record_seq: values[1] }];
      return [];
    };
    const store = new PostgresEvidenceStore(sql);
    const c = candidate();
    await store.put(c);
    await store.activate(c.evidenceKey, 1, WITHIN_RETENTION);
    const insert = issued.find((q) => q.includes('INSERT INTO evidence_records')) ?? '';
    const activate = issued.find((q) => q.includes('INSERT INTO evidence_active')) ?? '';
    /* History is append-only: the record insert must never learn to update. */
    expect(insert).toContain('ON CONFLICT (ingestion_key) DO NOTHING');
    expect(insert).not.toContain('DO UPDATE');
    /* The guard is the whole point of the activation statement. */
    expect(activate).toContain('WHERE evidence_active.record_seq < EXCLUDED.record_seq');
  });
});
