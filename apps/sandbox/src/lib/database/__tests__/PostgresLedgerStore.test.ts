import { describe, it, expect } from 'vitest';
import { project, reconcile, type LedgerEvent, type SqlExecutor } from '@diboas/banking';
import { PostgresLedgerStore } from '../PostgresLedgerStore';
import { oneOfEachLog } from '../../../test/ledgerFixture';

/**
 * P1.2 slice 1b — PostgresLedgerStore against a mock `sql` (hermetic; the
 * real-DB path is validated at Phase-2 wiring). Simulates `001_ledger_events`:
 * global `event_id` UNIQUE (dedup), `owner_key` scoping, `seq` ordering, and
 * the JSONB round-trip (payload is stringified on write, parsed on read — so
 * serialization fidelity is genuinely exercised, incl. the `source?` case).
 *
 * I-1 adds `ledger_scope` (migrations `003`/`004`). The mock models it as a
 * real column with its `DEFAULT 'sandbox'` semantics, so the tests below prove
 * the (owner_key, ledger_scope) pair actually reaches every statement — a mock
 * that ignored the parameter would let a cross-scope DELETE pass silently,
 * which is precisely the D-m failure this increment exists to prevent.
 */
interface MockRow {
  seq: number;
  eventId: string;
  ownerKey: string;
  payload: string;
  ledgerScope: string;
}

function makeMockSql(): { sql: SqlExecutor; rows: () => MockRow[] } {
  const rows: MockRow[] = [];
  let seq = 1;
  const sql: SqlExecutor = async (strings, ...values) => {
    const q = strings.join(' ? ');
    if (q.includes('INSERT INTO ledger_events')) {
      const [eventId, ownerKey, , payload, ledgerScope] = values as [
        string,
        string,
        string,
        string,
        string,
      ];
      // ON CONFLICT (event_id) DO NOTHING — event_id is globally UNIQUE.
      if (!rows.some((r) => r.eventId === eventId)) {
        rows.push({ seq: seq++, eventId, ownerKey, payload, ledgerScope });
      }
      return [];
    }
    if (q.includes('SELECT payload FROM ledger_events')) {
      const [ownerKey, ledgerScope] = values as [string, string];
      return rows
        .filter((r) => r.ownerKey === ownerKey && r.ledgerScope === ledgerScope)
        .sort((a, b) => a.seq - b.seq)
        .map((r) => ({ payload: JSON.parse(r.payload) })); // simulate jsonb parse on read
    }
    if (q.includes('DELETE FROM ledger_events')) {
      const [ownerKey, ledgerScope] = values as [string, string];
      for (let i = rows.length - 1; i >= 0; i--)
        if (rows[i].ownerKey === ownerKey && rows[i].ledgerScope === ledgerScope) rows.splice(i, 1);
      return [];
    }
    throw new Error(`mock sql: unrecognized query: ${q}`);
  };
  return { sql, rows: () => [...rows] };
}

const base = (id: string) => ({
  eventId: id,
  simDay: 0,
  recordedAt: '2026-07-24T00:00:00.000Z',
  correlationId: `corr-${id}`,
});

/**
 * One valid instance of every LedgerEventType (Q3 completeness), from the
 * shared compile-enforced fixture (`test/ledgerFixture.ts`) so this test and
 * the both-stores equivalence test cover the exact same canonical log.
 */
const oneOfEach: LedgerEvent[] = oneOfEachLog();

describe('PostgresLedgerStore (P1.2 slice 1b)', () => {
  it('should round-trip every LedgerEventType losslessly (Q3, JSONB serialization fidelity)', async () => {
    const { sql } = makeMockSql();
    const store = new PostgresLedgerStore('owner-a', sql);
    for (const e of oneOfEach) await store.append(e);
    const got = await store.getAll();
    expect(got).toHaveLength(oneOfEach.length);
    // toEqual, NOT toStrictEqual (CTO C2): TimeAdvanced.source? is the only
    // optional field; JSON.stringify drops an explicit undefined.
    oneOfEach.forEach((e, i) => expect(got[i]).toEqual(e));
  });

  it('should round-trip a TimeAdvanced with source explicitly undefined (toEqual holds where toStrictEqual would not)', async () => {
    const { sql } = makeMockSql();
    const store = new PostgresLedgerStore('owner-a', sql);
    const ev: LedgerEvent = { ...base('t0'), type: 'TimeAdvanced', days: 1, source: undefined };
    await store.append(ev);
    expect((await store.getAll())[0]).toEqual(ev);
  });

  it('should ignore replayed eventIds (idempotency — ON CONFLICT DO NOTHING)', async () => {
    const { sql } = makeMockSql();
    const store = new PostgresLedgerStore('owner-a', sql);
    const grant = oneOfEach[0];
    await store.append(grant);
    await store.append(grant);
    expect(await store.getAll()).toHaveLength(1);
  });

  it('should scope reads to owner_key', async () => {
    const { sql } = makeMockSql();
    const a = new PostgresLedgerStore('owner-a', sql);
    const b = new PostgresLedgerStore('owner-b', sql);
    await a.append(oneOfEach[0]);
    await b.append({ ...oneOfEach[0], eventId: 'b-e1' });
    expect(await a.getAll()).toHaveLength(1);
    expect((await a.getAll())[0].eventId).toBe('e1');
    expect((await b.getAll())[0].eventId).toBe('b-e1');
    await a.clearScope();
    expect(await a.getAll()).toHaveLength(0);
    expect(await b.getAll()).toHaveLength(1); // clearScope is owner-scoped
  });

  it('should default to the sandbox scope and write it as a column (D-04)', async () => {
    const { sql, rows } = makeMockSql();
    const store = new PostgresLedgerStore('owner-a', sql);
    expect(store.scope).toBe('sandbox');
    await store.append(oneOfEach[0]);
    expect(rows()[0].ledgerScope).toBe('sandbox');
  });

  it('should scope reads to ledger_scope as well as owner_key', async () => {
    const { sql } = makeMockSql();
    const practice = new PostgresLedgerStore('owner-a', sql, 'sandbox');
    const real = new PostgresLedgerStore('owner-a', sql, 'real');
    await practice.append(oneOfEach[0]);
    await real.append({ ...oneOfEach[0], eventId: 'r-e1', ledgerScope: 'real' });

    expect((await practice.getAll()).map((e) => e.eventId)).toEqual(['e1']);
    expect((await real.getAll()).map((e) => e.eventId)).toEqual(['r-e1']);
  });

  it("D-m: clearScope on the practice ledger leaves the same owner's real ledger intact", async () => {
    const { sql } = makeMockSql();
    const practice = new PostgresLedgerStore('owner-a', sql, 'sandbox');
    const real = new PostgresLedgerStore('owner-a', sql, 'real');
    await practice.append(oneOfEach[0]);
    await real.append({ ...oneOfEach[0], eventId: 'r-e1', ledgerScope: 'real' });

    await practice.clearScope();

    expect(await practice.getAll()).toHaveLength(0);
    expect((await real.getAll()).map((e) => e.eventId)).toEqual(['r-e1']);
  });

  it('should reject an event belonging to another scope before it reaches SQL', async () => {
    const { sql, rows } = makeMockSql();
    const practice = new PostgresLedgerStore('owner-a', sql, 'sandbox');
    await expect(
      practice.append({ ...oneOfEach[0], eventId: 'leak', ledgerScope: 'real' })
    ).rejects.toThrow(/ledger scope violation/);
    expect(rows()).toHaveLength(0); // nothing was written
  });

  it('C-P0 store guard: getAll returns the log complete, in seq order, deduplicated, and reconcile() holds', async () => {
    const { sql } = makeMockSql();
    const store = new PostgresLedgerStore('owner-a', sql);
    const grant = oneOfEach[0]; // grant 10000
    const split = oneOfEach[1]; // 30/20/50 — a valid, conserving minimal journey
    // append with a duplicate grant interleaved
    await store.append(grant);
    await store.append(split);
    await store.append(grant); // dup — must be dropped
    const got = await store.getAll();
    expect(got.map((e) => e.eventId)).toEqual(['e1', 'e2']); // complete, ordered, deduped
    expect(reconcile(project(got))).toBe('0.00'); // round-tripped log still balances
  });
});
