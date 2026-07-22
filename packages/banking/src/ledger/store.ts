/**
 * Ledger stores — the persistence seam (Principle 3).
 *
 * MVP-0 ships InMemory (tests/SSR) and LocalStorage (the founder prototype —
 * decision G-2: zero prod-DB exposure for a prototype). Stage 1 adds a
 * Postgres store behind this same interface when accounts land.
 */

import type { LedgerEvent } from './events';

export interface ILedgerStore {
  /** Append if the eventId is new; silently no-op on replays (idempotency). */
  append(event: LedgerEvent): void;
  getAll(): LedgerEvent[];
  clear(): void;
}

export class InMemoryLedgerStore implements ILedgerStore {
  private events: LedgerEvent[] = [];
  private ids = new Set<string>();

  append(event: LedgerEvent): void {
    if (this.ids.has(event.eventId)) return;
    this.ids.add(event.eventId);
    this.events.push(event);
  }

  getAll(): LedgerEvent[] {
    return [...this.events];
  }

  clear(): void {
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
        for (const e of events) this.memory.append(e);
      }
    } catch {
      // Corrupt/blocked storage: start fresh in memory.
    }
  }

  append(event: LedgerEvent): void {
    this.memory.append(event);
    this.persist();
  }

  getAll(): LedgerEvent[] {
    return this.memory.getAll();
  }

  clear(): void {
    this.memory.clear();
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* non-fatal */
      }
    }
  }

  private persist(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memory.getAll()));
    } catch {
      /* quota/blocked: keep working in memory (degraded, not broken) */
    }
  }
}
