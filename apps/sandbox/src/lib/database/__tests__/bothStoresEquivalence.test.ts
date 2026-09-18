import { describe, it, expect } from 'vitest';
import {
  project,
  reconcile,
  LocalStorageLedgerStore,
  type ILedgerStore,
  type SqlExecutor,
} from '@diboas/banking';
import { PostgresLedgerStore } from '../PostgresLedgerStore';
import { oneOfEachLog, v2FeeEvents } from '../../../test/ledgerFixture';

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

  /**
   * `5.403` / `5.410` — the SAME invariant over a **schema v2** log.
   *
   * This test's own promise is that the deferred cutover is *"a REPLAY, not a
   * migration: the one invariant a migration cannot retro-fit."* `schemaVersion`
   * and `modeledNetworkFee` / `modeledExitFee` are NEW fields on the JSONB
   * payload, so a v2 event that has never round-tripped Postgres is precisely
   * the thing a future cutover could not retro-fit. `oneOfEachLog()` is pinned
   * to one instance per event type and therefore carries only v1 fee shapes —
   * which is why this runs beside it rather than replacing it (canon:
   * *"conservation identity per scope with mixed v1/v2 events"*).
   */
  it('should round-trip and reconcile a schema-v2 fee log identically through both stores', async () => {
    const log = v2FeeEvents();

    const local = new LocalStorageLedgerStore();
    const postgres = new PostgresLedgerStore('owner-v2', makeMockSql());

    const localEvents = await loadAll(local, log);
    const postgresEvents = await loadAll(postgres, log);

    // The new fields survive the JSONB round-trip on both sides.
    expect(localEvents).toEqual(postgresEvents);
    const entered = postgresEvents.find((e) => e.type === 'StrategyEntered');
    expect(entered && 'schemaVersion' in entered ? entered.schemaVersion : null).toBe(2);
    expect(entered && 'modeledNetworkFee' in entered ? entered.modeledNetworkFee : null).toBe(
      '10.00'
    );

    const localState = project(localEvents);
    const postgresState = project(postgresEvents);
    expect(localState).toEqual(postgresState);

    // The modelled fees are recorded and moved nothing, through either store.
    expect(localState.networkFeesPaid).toBe('0.00');
    expect(localState.exitFeesPaid).toBe('0.00');
    expect(localState.modeledNetworkFees).toBe('20.00');
    expect(localState.modeledExitFees).toBe('3.90');

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
