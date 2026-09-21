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
}

function makeMockSql(): { sql: SqlExecutor; activeRows: () => Map<string, number> } {
  const records: Row[] = [];
  const active = new Map<string, number>();
  let seq = 1;
  const sql: SqlExecutor = async (strings, ...values) => {
    const q = strings.join(' ? ');
    if (q.includes('INSERT INTO evidence_records')) {
      const [recordId, key, , ingestionKey, payloadDigest, payload] = values as [
        string,
        string,
        number,
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
      return row ? [{ seq: row.seq, evidence_key: row.evidenceKey, payload: row.payload }] : [];
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
    expect(await store.activate(c.evidenceKey, put.seq)).toEqual({ status: 'ACTIVATED', seq: 1 });
    const active = await store.readActive(c.evidenceKey);
    expect(active).toMatchObject({ seq: 1, evidenceKey: c.evidenceKey });
    expect(active?.payload).toMatchObject({ value: '0.03', unit: 'USD' });
  });

  it('should be REFUSED BY THE FOREIGN KEY when the pointer names another identity', async () => {
    const { sql } = makeMockSql();
    const store = new PostgresEvidenceStore(sql);
    const put = await store.put(candidate());
    if (put.status !== 'INSERTED') throw new Error('unreachable');
    const otherKey = evidenceKey({ kind: 'network-cost', subject: 'Solana', unit: 'USD' });
    await expect(store.activate(otherKey, put.seq)).rejects.toThrow(/foreign key constraint/);
  });

  it('should not let a LOWER ingestion seq overwrite a HIGHER one', async () => {
    const { sql, activeRows } = makeMockSql();
    const store = new PostgresEvidenceStore(sql);
    const older = await store.put(candidate(0.03, '2026-09-21T00:00:00.000Z'));
    const newer = await store.put(candidate(0.04, '2026-09-22T00:00:00.000Z'));
    const key = candidate().evidenceKey;
    await store.activate(key, newer.seq);
    expect(await store.activate(key, older.seq)).toEqual({
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
    await store.activate(c.evidenceKey, put.seq);
    expect(await store.activate(c.evidenceKey, put.seq)).toEqual({
      status: 'NOT_NEWER',
      activeSeq: put.seq,
    });
  });

  it('should return null for an identity with no active record', async () => {
    const { sql } = makeMockSql();
    const store = new PostgresEvidenceStore(sql);
    const c = candidate();
    await store.put(c);
    expect(await store.readActive(c.evidenceKey)).toBeNull();
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
    await store.activate(c.evidenceKey, 1);
    const insert = issued.find((q) => q.includes('INSERT INTO evidence_records')) ?? '';
    const activate = issued.find((q) => q.includes('INSERT INTO evidence_active')) ?? '';
    /* History is append-only: the record insert must never learn to update. */
    expect(insert).toContain('ON CONFLICT (ingestion_key) DO NOTHING');
    expect(insert).not.toContain('DO UPDATE');
    /* The guard is the whole point of the activation statement. */
    expect(activate).toContain('WHERE evidence_active.record_seq < EXCLUDED.record_seq');
  });
});
