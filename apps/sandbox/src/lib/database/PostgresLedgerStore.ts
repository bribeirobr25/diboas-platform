import type { ILedgerStore, LedgerEvent, SqlExecutor } from '@diboas/banking';
import { Logger } from '../monitoring/Logger';

/**
 * PostgresLedgerStore — the Neon-backed `ILedgerStore` (P1.2 slice 1b).
 *
 * Lives in `apps/sandbox`, NOT `@diboas/banking`, on DDD grounds (CTO §15.2):
 * SQL semantics don't belong in a domain package. It implements banking's
 * `ILedgerStore` via an injected `SqlExecutor` (the sandbox `client.ts` `sql`),
 * so `@diboas/banking` stays driver-free.
 *
 * NOT wired in Phase 1 — Option 2 keeps LocalStorage active until an account
 * exists (Phase 2). Built + unit-tested here (mock `sql`) so the Phase-2 swap
 * is a pure factory change; the real-DB path is validated at Phase-2 wiring.
 *
 * Schema (`001_ledger_events`): the **full event** is stored in `payload`
 * (JSONB); `event_id`/`type` also live in columns for the `UNIQUE` constraint
 * and the index. `getAll` returns `payload` verbatim — **no column↔payload
 * merge** (CTO §15.3), so the drop-`type` hazard is designed out. `row.type`
 * and `payload.type` can only diverge via manual DB editing (both are written
 * from one event object in a single `INSERT`).
 */
export class PostgresLedgerStore implements ILedgerStore {
  constructor(
    private readonly ownerKey: string,
    private readonly sql: SqlExecutor
  ) {}

  async append(event: LedgerEvent): Promise<void> {
    try {
      await this.sql`
        INSERT INTO ledger_events (event_id, owner_key, type, payload)
        VALUES (${event.eventId}, ${this.ownerKey}, ${event.type}, ${JSON.stringify(event)})
        ON CONFLICT (event_id) DO NOTHING
      `;
    } catch (error) {
      Logger.error('PostgresLedgerStore append failed', { eventId: event.eventId, type: event.type }, error);
      throw error;
    }
  }

  async getAll(): Promise<LedgerEvent[]> {
    try {
      const rows = await this.sql`
        SELECT payload FROM ledger_events WHERE owner_key = ${this.ownerKey} ORDER BY seq
      `;
      return rows.map((r) => r.payload as LedgerEvent);
    } catch (error) {
      Logger.error('PostgresLedgerStore getAll failed', { ownerKey: this.ownerKey }, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.sql`DELETE FROM ledger_events WHERE owner_key = ${this.ownerKey}`;
    } catch (error) {
      Logger.error('PostgresLedgerStore clear failed', { ownerKey: this.ownerKey }, error);
      throw error;
    }
  }
}
