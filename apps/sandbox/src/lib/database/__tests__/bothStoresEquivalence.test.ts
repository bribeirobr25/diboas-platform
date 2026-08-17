import { describe, it, expect } from 'vitest';
import {
  project,
  reconcile,
  LocalStorageLedgerStore,
  type ILedgerStore,
  type SqlExecutor,
} from '@diboas/banking';
import { PostgresLedgerStore } from '../PostgresLedgerStore';
import { oneOfEachLog } from '../../../test/ledgerFixture';

/**
 * The cutover-safety invariant (founder 2026-08-16, plan §5 / Lane-8 §4):
 * `reconcile()` is a pure function of the event log, so the SAME log must
 * project identically and reconcile to the same `0.00` through BOTH store
 * impls. Asserting it here — on the client build, while both seams already
 * exist — makes the deferred persistence cutover a REPLAY, not a migration:
 * the one invariant a migration cannot retro-fit.
 *
 * Hermetic: `PostgresLedgerStore` runs against an in-memory mock `SqlExecutor`
 * (JSONB stringify/parse round-trip, seq order); `LocalStorageLedgerStore`
 * degrades to pure in-memory with no `window` (node env). Both preserve
 * insertion order and JSON semantics — so `toEqual` (not `toStrictEqual`) is
 * the correct comparator (a `source: undefined` is dropped by JSON on one side).
 */
function makeMockSql(): SqlExecutor {
  const rows: { seq: number; eventId: string; ownerKey: string; payload: string }[] = [];
  let seq = 1;
  return async (strings, ...values) => {
    const q = strings.join(' ? ');
    if (q.includes('INSERT INTO ledger_events')) {
      const [eventId, ownerKey, , payload] = values as [string, string, string, string];
      if (!rows.some((r) => r.eventId === eventId))
        rows.push({ seq: seq++, eventId, ownerKey, payload });
      return [];
    }
    if (q.includes('SELECT payload FROM ledger_events')) {
      const [ownerKey] = values as [string];
      return rows
        .filter((r) => r.ownerKey === ownerKey)
        .sort((a, b) => a.seq - b.seq)
        .map((r) => ({ payload: JSON.parse(r.payload) }));
    }
    if (q.includes('DELETE FROM ledger_events')) {
      const [ownerKey] = values as [string];
      for (let i = rows.length - 1; i >= 0; i--)
        if (rows[i].ownerKey === ownerKey) rows.splice(i, 1);
      return [];
    }
    throw new Error(`mock sql: unrecognized query: ${q}`);
  };
}

async function loadAll(store: ILedgerStore, log: ReturnType<typeof oneOfEachLog>) {
  for (const e of log) await store.append(e);
  return store.getAll();
}

describe('both-stores reconcile-equivalence (cutover-safety invariant)', () => {
  it('should project identically and reconcile to the same 0.00 through LocalStorage + Postgres', async () => {
    const log = oneOfEachLog();

    const local = new LocalStorageLedgerStore(); // no window ⇒ in-memory
    const postgres = new PostgresLedgerStore('owner-a', makeMockSql());

    const localEvents = await loadAll(local, log);
    const postgresEvents = await loadAll(postgres, log);

    // Same events back (order-preserved; toEqual tolerates a JSON-dropped undefined).
    expect(localEvents).toEqual(postgresEvents);

    const localState = project(localEvents);
    const postgresState = project(postgresEvents);

    // Same projected state.
    expect(localState).toEqual(postgresState);

    // The invariant itself: both balance, identically.
    expect(reconcile(localState)).toBe('0.00');
    expect(reconcile(postgresState)).toBe('0.00');
    expect(reconcile(localState)).toBe(reconcile(postgresState));
  });

  it('should reconcile to 0.00 at every prefix through both stores (no intermediate leak)', async () => {
    const log = oneOfEachLog();
    for (let i = 1; i <= log.length; i += 1) {
      const prefix = log.slice(0, i);
      const local = new LocalStorageLedgerStore();
      const postgres = new PostgresLedgerStore(`owner-${i}`, makeMockSql());
      const localState = project(await loadAll(local, prefix));
      const postgresState = project(await loadAll(postgres, prefix));
      expect(reconcile(localState), `local prefix ${i}`).toBe('0.00');
      expect(reconcile(postgresState), `postgres prefix ${i}`).toBe('0.00');
    }
  });
});
