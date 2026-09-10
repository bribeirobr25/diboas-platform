import {
  assertInScope,
  type ILedgerStore,
  type LedgerEvent,
  type LedgerScope,
  type SqlExecutor,
} from '@diboas/banking';
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
 *
 * SCOPE (I-1, migrations `003`/`004`): the store is bound to one
 * `(ownerKey, scope)` pair at construction, and **every** statement filters on
 * both. `clearScope()` in particular can only ever delete this owner's rows in
 * this one scope — "reset Practice" is structurally incapable of deleting a
 * Real ledger (the D-m data-loss guard). `ledger_scope` is written as a column
 * so the delete and the read stay index-backed; the event's own optional
 * `ledgerScope` field travels inside `payload` untouched, and legacy rows
 * (which have neither) resolve to `'sandbox'` via the column DEFAULT and
 * `scopeOf()` respectively — the two agree by construction.
 */
export class PostgresLedgerStore implements ILedgerStore {
  constructor(
    private readonly ownerKey: string,
    private readonly sql: SqlExecutor,
    readonly scope: LedgerScope = 'sandbox'
  ) {}

  async append(event: LedgerEvent): Promise<void> {
    assertInScope(event, this.scope);
    try {
      await this.sql`
        INSERT INTO ledger_events (event_id, owner_key, type, payload, ledger_scope)
        VALUES (${event.eventId}, ${this.ownerKey}, ${event.type}, ${JSON.stringify(event)}, ${this.scope})
        ON CONFLICT (event_id) DO NOTHING
      `;
    } catch (error) {
      Logger.error(
        'PostgresLedgerStore append failed',
        { eventId: event.eventId, type: event.type, scope: this.scope },
        error
      );
      throw error;
    }
  }

  async getAll(): Promise<LedgerEvent[]> {
    try {
      const rows = await this.sql`
        SELECT payload FROM ledger_events
        WHERE owner_key = ${this.ownerKey} AND ledger_scope = ${this.scope}
        ORDER BY seq
      `;
      return rows.map((r) => r.payload as LedgerEvent);
    } catch (error) {
      Logger.error(
        'PostgresLedgerStore getAll failed',
        { ownerKey: this.ownerKey, scope: this.scope },
        error
      );
      throw error;
    }
  }

  async clearScope(): Promise<void> {
    try {
      await this.sql`
        DELETE FROM ledger_events
        WHERE owner_key = ${this.ownerKey} AND ledger_scope = ${this.scope}
      `;
    } catch (error) {
      Logger.error(
        'PostgresLedgerStore clearScope failed',
        { ownerKey: this.ownerKey, scope: this.scope },
        error
      );
      throw error;
    }
  }
}
