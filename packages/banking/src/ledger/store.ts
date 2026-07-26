/**
 * Ledger stores — the persistence seam (Principle 3).
 *
 * MVP-0 ships InMemory (tests/SSR) and LocalStorage (the founder prototype —
 * decision G-2: zero prod-DB exposure for a prototype). Stage 1 adds a
 * Postgres store behind this same interface when accounts land.
 */

import type { LedgerEvent } from './events';

/**
 * ILedgerStore — the persistence seam (Principle 3). **Async** (P1.2 slice 1b):
 * a Postgres store (Neon over HTTP) is inherently async, so the seam is async
 * for all impls. The in-memory/LocalStorage impls satisfy it trivially; reads
 * stay off this seam in the render path (`ledgerClient` keeps an in-memory log
 * and only touches the store in `hydrate()` + persist), so the sync React
 * contract is preserved.
 */
export interface ILedgerStore {
  /** Append if the eventId is new; silently no-op on replays (idempotency). */
  append(event: LedgerEvent): Promise<void>;
  getAll(): Promise<LedgerEvent[]>;
  clear(): Promise<void>;
}

/**
 * SqlExecutor — the structural injection seam a `PostgresLedgerStore` needs
 * (the neon tagged-template query fn). Declared here so the store's host app
 * (`apps/sandbox`, on DDD grounds — SQL doesn't belong in a domain package)
 * injects a `client.ts` that declares conformance, linking them at compile
 * time. `@diboas/banking` stays driver-free (only dep: decimal.js).
 */
export type SqlExecutor = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<Record<string, unknown>[]>;

export class InMemoryLedgerStore implements ILedgerStore {
  private events: LedgerEvent[] = [];
  private ids = new Set<string>();

  async append(event: LedgerEvent): Promise<void> {
    if (this.ids.has(event.eventId)) return;
    this.ids.add(event.eventId);
    this.events.push(event);
  }

  async getAll(): Promise<LedgerEvent[]> {
    return [...this.events];
  }

  async clear(): Promise<void> {
    this.events = [];
    this.ids.clear();
  }
}

const STORAGE_KEY = 'diboas-sandbox-ledger-v1';

/**
 * Browser persistence for the prototype. Every append rewrites the serialized
 * log (small volumes; fine for MVP-0). Storage failures degrade to in-memory
 * behavior (Principle 7) — the session still works, it just won't survive a
 * reload, and the app surfaces nothing scarier than that.
 */
export class LocalStorageLedgerStore implements ILedgerStore {
  private memory = new InMemoryLedgerStore();

  constructor() {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const events = JSON.parse(raw) as LedgerEvent[];
        // `InMemory.append` is async but its body runs synchronously, so the
        // log is fully loaded before the constructor returns (no await needed).
        for (const e of events) void this.memory.append(e);
      }
    } catch {
      // Corrupt/blocked storage: start fresh in memory.
    }
  }

  async append(event: LedgerEvent): Promise<void> {
    await this.memory.append(event);
    await this.persist();
  }

  async getAll(): Promise<LedgerEvent[]> {
    return this.memory.getAll();
  }

  async clear(): Promise<void> {
    await this.memory.clear();
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* non-fatal */
      }
    }
  }

  private async persist(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(await this.memory.getAll()));
    } catch {
      /* quota/blocked: keep working in memory (degraded, not broken) */
    }
  }
}
