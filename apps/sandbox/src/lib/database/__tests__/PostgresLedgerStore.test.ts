import { describe, it, expect } from 'vitest';
import { project, reconcile, type LedgerEvent, type SqlExecutor } from '@diboas/banking';
import { PostgresLedgerStore } from '../PostgresLedgerStore';

/**
 * P1.2 slice 1b — PostgresLedgerStore against a mock `sql` (hermetic; the
 * real-DB path is validated at Phase-2 wiring). Simulates `001_ledger_events`:
 * global `event_id` UNIQUE (dedup), `owner_key` scoping, `seq` ordering, and
 * the JSONB round-trip (payload is stringified on write, parsed on read — so
 * serialization fidelity is genuinely exercised, incl. the `source?` case).
 */
function makeMockSql(): { sql: SqlExecutor; rowCount: () => number } {
  const rows: { seq: number; eventId: string; ownerKey: string; payload: string }[] = [];
  let seq = 1;
  const sql: SqlExecutor = async (strings, ...values) => {
    const q = strings.join(' ? ');
    if (q.includes('INSERT INTO ledger_events')) {
      const [eventId, ownerKey, , payload] = values as [string, string, string, string];
      // ON CONFLICT (event_id) DO NOTHING — event_id is globally UNIQUE.
      if (!rows.some((r) => r.eventId === eventId)) {
        rows.push({ seq: seq++, eventId, ownerKey, payload });
      }
      return [];
    }
    if (q.includes('SELECT payload FROM ledger_events')) {
      const [ownerKey] = values as [string];
      return rows
        .filter((r) => r.ownerKey === ownerKey)
        .sort((a, b) => a.seq - b.seq)
        .map((r) => ({ payload: JSON.parse(r.payload) })); // simulate jsonb parse on read
    }
    if (q.includes('DELETE FROM ledger_events')) {
      const [ownerKey] = values as [string];
      for (let i = rows.length - 1; i >= 0; i--) if (rows[i].ownerKey === ownerKey) rows.splice(i, 1);
      return [];
    }
    throw new Error(`mock sql: unrecognized query: ${q}`);
  };
  return { sql, rowCount: () => rows.length };
}

const base = (id: string) => ({
  eventId: id,
  simDay: 0,
  recordedAt: '2026-07-24T00:00:00.000Z',
  correlationId: `corr-${id}`,
});

/** One valid instance of every LedgerEventType (Q3 completeness). */
const oneOfEach: LedgerEvent[] = [
  { ...base('e1'), type: 'PlayMoneyGranted', amount: '10000.00', currency: 'USD', mode: 'b2c' },
  { ...base('e2'), type: 'JobsSplitSet', floorPercent: 30, cushionPercent: 20, workingPercent: 50 },
  { ...base('e3'), type: 'GoalCreated', goalId: 'g1', name: 'Trip', icon: 'plane', targetAmount: '3000.00', horizonMonths: 24 },
  { ...base('e4'), type: 'GoalFunded', goalId: 'g1', amount: '1000.00' },
  { ...base('e5'), type: 'StrategyEntered', goalId: 'g1', positionId: 'p1', strategyId: 'safeHarbor', amount: '990.00', networkFee: '10.00' },
  { ...base('e6'), type: 'AccrualApplied', positionId: 'p1', fromSimDay: 0, toSimDay: 30, earnings: '5.00', apySource: 'defillama' },
  { ...base('e7'), type: 'StrategyExited', positionId: 'p1', goalId: 'g1', grossAmount: '995.00', exitFee: '3.88', networkFee: '10.00' },
  { ...base('e8'), type: 'RecurringSet', goalId: 'g1', positionId: 'p1', monthlyAmount: '100.00', startSimDay: 0 },
  { ...base('e9'), type: 'RecurringContributionApplied', goalId: 'g1', positionId: 'p1', amount: '100.00', onSimDay: 30 },
  { ...base('e10'), type: 'TimeAdvanced', days: 365, source: 'machine' },
];

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
    await a.clear();
    expect(await a.getAll()).toHaveLength(0);
    expect(await b.getAll()).toHaveLength(1); // clear is owner-scoped
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
