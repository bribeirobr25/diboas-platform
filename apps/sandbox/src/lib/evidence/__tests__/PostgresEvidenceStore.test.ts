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
import { expectedLogs } from '@/test/expectedLogs';

// Failure paths below LOG by design (R-14); asserted, not silenced (2026-10-19 cleanup).
expectedLogs({
  strict: true,
  error: [
    'PostgresEvidenceStore activate failed',
    'PostgresEvidenceStore put failed',
    'PostgresEvidenceStore readActive failed',
    'PostgresEvidenceStore purgeExpired failed',
  ],
  requiredIn: /REFUSED BY THE FOREIGN KEY|LOGGED AND RETHROWN/,
});

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

/**
 * Evaluate a statement's `WHERE a = b AND c = d …` against one row, as SQL would.
 *
 * Each operand is either a bound parameter (`${…}` in the template) or a column of
 * `row`; anything else is refused loudly, so a statement this evaluator cannot read
 * fails the test instead of being guessed at. Only `=` joined by `AND` is modelled —
 * the shape the adapter's `DELETE` statements use.
 */
function whereMatches(
  strings: TemplateStringsArray,
  values: unknown[],
  row: Record<string, unknown>
): boolean {
  const text = strings.reduce((acc, s, i) => acc + s + (i < values.length ? ` $${i} ` : ''), '');
  const clause = /\bWHERE\b([\s\S]*?)(?:\bRETURNING\b|$)/i.exec(text)?.[1];
  if (clause === undefined) throw new Error(`mock sql: no WHERE in: ${text}`);
  const operand = (token: string): unknown => {
    const param = /^\$(\d+)$/.exec(token);
    if (param) return values[Number(param[1])];
    if (Object.prototype.hasOwnProperty.call(row, token)) return row[token];
    throw new Error(`mock sql: unrecognized operand "${token}" in: ${clause.trim()}`);
  };
  return clause.split(/\bAND\b/i).every((condition) => {
    const parts = /^\s*(\S+)\s*=\s*(\S+)\s*$/.exec(condition);
    if (!parts) throw new Error(`mock sql: unrecognized condition "${condition.trim()}"`);
    return operand(parts[1]) === operand(parts[2]);
  });
}

/** The value bound to the parameter that directly follows `<column> =` in a statement. */
function boundTo(strings: readonly string[], values: unknown[], column: string): unknown {
  const i = strings.findIndex((s) => new RegExp(`\\b${column}\\s*=\\s*$`).test(s));
  return i === -1 || i >= values.length ? undefined : values[i];
}

function makeMockSql(): {
  sql: SqlExecutor;
  activeRows: () => Map<string, number>;
  recordSeqs: () => number[];
  /** Every statement issued, with its literal parts and its bound values, in order. */
  issued: () => Array<{ strings: readonly string[]; values: unknown[] }>;
} {
  const records: Row[] = [];
  const active = new Map<string, number>();
  const log: Array<{ strings: readonly string[]; values: unknown[] }> = [];
  let seq = 1;
  const sql: SqlExecutor = async (strings, ...values) => {
    log.push({ strings: [...strings], values });
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
      /* The mock applies the statement's OWN `WHERE` to every pointer row — it never
         re-decides which pointer "should" go. A mock that compared pointer and record
         itself let `AND ${seq} = ${seq}` (which deletes every pointer of the key) pass
         every purge test (A-11, 2026-11-10). */
      const deleted: Array<{ evidence_key: string }> = [];
      for (const [key, recordSeq] of [...active]) {
        if (!whereMatches(strings, values, { evidence_key: key, record_seq: recordSeq })) continue;
        active.delete(key);
        deleted.push({ evidence_key: key });
      }
      return deleted;
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
  return {
    sql,
    activeRows: () => new Map(active),
    recordSeqs: () => records.map((r) => r.seq),
    issued: () => [...log],
  };
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

/**
 * Register 5.70 — the adapter's retention, purge and failure branches, against the same
 * constraint-modelling mock. Expectations come from the adapter's own contracts (Legal
 * 2026-09-22): an expired record "is never eligible for activation"; it is "excluded from
 * operational AND ordinary audit reads at expiry, not at purge time"; `purgeExpired` deletes
 * every record past its window, pointer first, holds what is held, and has "NO FALLBACK
 * ACTIVATION"; every failure is logged and rethrown.
 */
const NINETY_DAYS_LATER = '2026-10-18T00:00:00.000Z'; // WITHIN_RETENTION + 90 days

/** A record of `subject`, observed at `asOf` (its identity) and taken into custody at `retrievedAt`. */
function custodyCandidate(
  subject: 'Arbitrum' | 'Solana',
  asOf: string,
  retrievedAt: string
): EvidenceRecordCandidate {
  const envelope = referenceEvidence({
    value: 0.03,
    stamp: { ...FIXTURE_STAMP, asOf, observedAt: asOf },
    normalization: { converted: false },
    coverage: NETWORK,
  });
  if (envelope.availability !== 'AVAILABLE') throw new Error('unreachable');
  return buildEvidenceCandidate({
    evidenceKey: evidenceKey({ kind: 'network-cost', subject, unit: 'USD' }),
    envelope,
    unit: 'USD',
    recordId: `00000000-0000-4000-8000-${sha256(subject + asOf).slice(0, 12)}`,
    hash: sha256,
    retrievedAt,
  });
}

describe('PostgresEvidenceStore — retention at activation and read (5.70)', () => {
  it('should refuse to activate an EXPIRED record and write no pointer', async () => {
    const { sql, activeRows } = makeMockSql();
    const store = new PostgresEvidenceStore(sql);
    const c = candidate();
    const put = await store.put(c);
    expect(await store.activate(c.evidenceKey, put.seq, NINETY_DAYS_LATER)).toEqual({
      status: 'EXPIRED',
      retrievedAt: WITHIN_RETENTION,
    });
    expect(activeRows().size).toBe(0);
  });

  it('should stop serving an active record the moment it expires, before any purge', async () => {
    const { sql, activeRows } = makeMockSql();
    const store = new PostgresEvidenceStore(sql);
    const c = candidate();
    const put = await store.put(c);
    await store.activate(c.evidenceKey, put.seq, WITHIN_RETENTION);
    expect(await store.readActive(c.evidenceKey, '2026-10-17T00:00:00.000Z')).not.toBeNull();
    expect(await store.readActive(c.evidenceKey, NINETY_DAYS_LATER)).toBeNull();
    // The pointer is still there — expiry, not deletion, is what hides it.
    expect(activeRows().get(c.evidenceKey)).toBe(put.seq);
  });

  it('should answer NOT_NEWER when the CAS loses and the pointer is gone by the time it is read', async () => {
    /* A concurrent purge between the upsert and the follow-up read: zero rows from both. */
    const sql: SqlExecutor = async (strings) => {
      const q = strings.join(' ? ');
      if (q.includes('SELECT ingested_at')) return [{ ingested_at: WITHIN_RETENTION }];
      return [];
    };
    const store = new PostgresEvidenceStore(sql);
    expect(await store.activate(candidate().evidenceKey, 7, WITHIN_RETENTION)).toMatchObject({
      status: 'NOT_NEWER',
    });
  });
});

describe('PostgresEvidenceStore — purgeExpired (5.70)', () => {
  const PURGE_AT = '2026-10-20T00:00:00.000Z';
  const OLD = WITHIN_RETENTION; // 92 days before PURGE_AT: expired
  const RECENT = '2026-10-01T00:00:00.000Z'; // 19 days before PURGE_AT: retained

  /** Arbitrum: two expired records, the newer one active. Solana: one retained, active. */
  async function seeded() {
    const mock = makeMockSql();
    const store = new PostgresEvidenceStore(mock.sql);
    const a1 = custodyCandidate('Arbitrum', '2026-07-18T00:00:00.000Z', OLD);
    const a2 = custodyCandidate('Arbitrum', '2026-07-19T00:00:00.000Z', OLD);
    const s1 = custodyCandidate('Solana', '2026-09-30T00:00:00.000Z', RECENT);
    const [p1, p2, p3] = [await store.put(a1), await store.put(a2), await store.put(s1)];
    await store.activate(a2.evidenceKey, p2.seq, OLD);
    await store.activate(s1.evidenceKey, p3.seq, RECENT);
    return { ...mock, store, keys: { a: a1.evidenceKey, s: s1.evidenceKey }, seqs: [p1, p2, p3] };
  }

  it('should delete every expired record and its pointer, keep the rest, and promote nothing', async () => {
    const { store, activeRows, recordSeqs, keys, seqs } = await seeded();
    expect(await store.purgeExpired({ now: PURGE_AT })).toEqual({
      purgedRecords: 2,
      purgedPointers: 1,
      heldRecords: 0,
    });
    expect(recordSeqs()).toEqual([seqs[2].seq]);
    // NO FALLBACK ACTIVATION: the purged identity is left with no pointer at all.
    expect(activeRows()).toEqual(new Map([[keys.s, seqs[2].seq]]));
    expect(await store.readActive(keys.a, PURGE_AT)).toBeNull();
    expect(await store.readActive(keys.s, PURGE_AT)).not.toBeNull();
  });

  it('should keep every record of a held identity, counting it, while purging the rest', async () => {
    const { store, activeRows, recordSeqs, keys, seqs } = await seeded();
    expect(await store.purgeExpired({ now: PURGE_AT, hold: new Set([keys.a]) })).toEqual({
      purgedRecords: 0,
      purgedPointers: 0,
      heldRecords: 2,
    });
    expect(recordSeqs()).toEqual(seqs.map((p) => p.seq));
    expect(activeRows().get(keys.a)).toBe(seqs[1].seq);
  });

  it('should delete nothing when nothing has expired', async () => {
    const { store, activeRows, recordSeqs } = await seeded();
    const pointers = activeRows();
    const records = recordSeqs();
    expect(await store.purgeExpired({ now: '2026-10-17T00:00:00.000Z' })).toEqual({
      purgedRecords: 0,
      purgedPointers: 0,
      heldRecords: 0,
    });
    expect(recordSeqs()).toEqual(records);
    expect(activeRows()).toEqual(pointers);
  });

  /**
   * The normal state after a second ingestion (A-11, 2026-11-10): ONE identity holding an
   * expired older record and a newer, still-valid record that is the active one. Purging
   * the old record must leave the newer record's pointer alone — the pointer delete is
   * bound to the expired record's own seq, never to the identity as a whole.
   */
  async function supersededThenExpired() {
    const mock = makeMockSql();
    const store = new PostgresEvidenceStore(mock.sql);
    const older = custodyCandidate('Arbitrum', '2026-07-18T00:00:00.000Z', OLD);
    const newer = custodyCandidate('Arbitrum', '2026-09-30T00:00:00.000Z', RECENT);
    const oldPut = await store.put(older);
    await store.activate(older.evidenceKey, oldPut.seq, OLD);
    const newPut = await store.put(newer);
    await store.activate(newer.evidenceKey, newPut.seq, RECENT);
    return { ...mock, store, key: older.evidenceKey, oldSeq: oldPut.seq, newSeq: newPut.seq };
  }

  it('should keep the newer active pointer when an older record of the same identity expires', async () => {
    const { store, activeRows, recordSeqs, key, oldSeq, newSeq } = await supersededThenExpired();
    expect(activeRows().get(key)).toBe(newSeq);
    expect(await store.purgeExpired({ now: PURGE_AT })).toEqual({
      purgedRecords: 1,
      purgedPointers: 0,
      heldRecords: 0,
    });
    expect(recordSeqs()).toEqual([newSeq]);
    expect(recordSeqs()).not.toContain(oldSeq);
    expect(activeRows()).toEqual(new Map([[key, newSeq]]));
    expect(await store.readActive(key, PURGE_AT)).toMatchObject({ seq: newSeq, evidenceKey: key });
  });

  it('should bind the pointer delete to the expired record seq when it issues the SQL', async () => {
    const { store, issued, key, oldSeq } = await supersededThenExpired();
    await store.purgeExpired({ now: PURGE_AT });
    const pointerDeletes = issued().filter((s) =>
      s.strings.join(' ? ').includes('DELETE FROM evidence_active')
    );
    expect(pointerDeletes).toHaveLength(1);
    const [{ strings, values }] = pointerDeletes;
    /* The statement names BOTH the identity and the expired record — a condition that
       compares a bound value with itself (`${seq} = ${seq}`) binds neither column. */
    expect(strings.join(' ? ')).toMatch(
      /WHERE\s+evidence_key\s*=\s*\?\s+AND\s+record_seq\s*=\s*\?/
    );
    expect(boundTo(strings, values, 'evidence_key')).toBe(key);
    expect(boundTo(strings, values, 'record_seq')).toBe(oldSeq);
  });
});

describe('PostgresEvidenceStore — every failure is LOGGED AND RETHROWN (5.70)', () => {
  const failing: SqlExecutor = async () => {
    throw new Error('connection terminated');
  };

  it('should refuse a put whose key was neither inserted nor found — LOGGED AND RETHROWN', async () => {
    const store = new PostgresEvidenceStore(async () => []);
    await expect(store.put(candidate())).rejects.toThrow(/neither inserted nor found/);
  });

  it('should rethrow a failed read — LOGGED AND RETHROWN', async () => {
    const store = new PostgresEvidenceStore(failing);
    await expect(store.readActive(candidate().evidenceKey, WITHIN_RETENTION)).rejects.toThrow(
      'connection terminated'
    );
  });

  it('should rethrow a failed purge — LOGGED AND RETHROWN', async () => {
    const store = new PostgresEvidenceStore(failing);
    await expect(store.purgeExpired({ now: WITHIN_RETENTION })).rejects.toThrow(
      'connection terminated'
    );
  });
});
