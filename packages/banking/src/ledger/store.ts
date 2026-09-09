/**
 * Ledger stores — the persistence seam (Principle 3).
 *
 * MVP-0 ships InMemory (tests/SSR) and LocalStorage (the founder prototype —
 * decision G-2: zero prod-DB exposure for a prototype). Stage 1 adds a
 * Postgres store behind this same interface when accounts land.
 *
 * SCOPE (I-1, plan r2 §2): every store is bound to exactly ONE `LedgerScope`
 * at construction. That is the D-m data-loss guard, and it is deliberately
 * stronger than passing a scope per call: a store that was built for
 * `'sandbox'` has no expressible operation that reads, writes or deletes
 * `'real'` — the boundary is enforced by the object's identity, not by every
 * caller remembering an argument.
 */

import { scopeOf, type LedgerEvent, type LedgerScope } from './events';

/**
 * ILedgerStore — the persistence seam (Principle 3). **Async** (P1.2 slice 1b):
 * a Postgres store (Neon over HTTP) is inherently async, so the seam is async
 * for all impls. The in-memory/LocalStorage impls satisfy it trivially; reads
 * stay off this seam in the render path (`ledgerClient` keeps an in-memory log
 * and only touches the store in `hydrate()` + persist), so the sync React
 * contract is preserved.
 *
 * Every implementation is scope-bound; `scope` is readable so callers and tests
 * can assert which ledger they hold without reaching into internals.
 */
export interface ILedgerStore {
  /** The one ledger this store can ever touch. */
  readonly scope: LedgerScope;
  /**
   * Append if the eventId is new; silently no-op on replays (idempotency).
   * Rejects an event belonging to a different scope — see `assertInScope`.
   */
  append(event: LedgerEvent): Promise<void>;
  getAll(): Promise<LedgerEvent[]>;
  /**
   * Delete this store's scope and nothing else.
   *
   * Named `clearScope`, not `clear`, ON PURPOSE (decision D-28): the old
   * no-argument `clear()` is GONE, so every pre-I-1 call site fails to compile
   * rather than silently continuing to mean "clear everything". Combined with
   * construction-binding, "reset Practice" is structurally incapable of
   * touching a Real ledger — the requirement r2 states as "a `clear()` without
   * scope does not exist".
   */
  clearScope(): Promise<void>;
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

/**
 * The cross-scope write guard. Throws rather than dropping: a mis-scoped append
 * is a programming error, and swallowing it would let one scope's money appear
 * in the other's `project()` — a guaranteed-false `reconcile()` residual
 * (PENDING_ALL 5.167 item 5) and exactly the mode-confusion the scope split
 * exists to prevent. Loud beats quiet on a money path.
 */
export function assertInScope(event: LedgerEvent, scope: LedgerScope): void {
  const eventScope = scopeOf(event);
  if (eventScope !== scope) {
    throw new Error(
      `ledger scope violation: cannot append a '${eventScope}' event to the '${scope}' ledger ` +
        `(eventId ${event.eventId}, type ${event.type})`
    );
  }
}

export class InMemoryLedgerStore implements ILedgerStore {
  private events: LedgerEvent[] = [];
  private ids = new Set<string>();

  /** Defaults to `'sandbox'` so existing tests and SSR keep working unchanged. */
  constructor(readonly scope: LedgerScope = 'sandbox') {}

  async append(event: LedgerEvent): Promise<void> {
    assertInScope(event, this.scope);
    if (this.ids.has(event.eventId)) return;
    this.ids.add(event.eventId);
    this.events.push(event);
  }

  async getAll(): Promise<LedgerEvent[]> {
    return [...this.events];
  }

  async clearScope(): Promise<void> {
    this.events = [];
    this.ids.clear();
  }
}

/** The pre-I-1 unscoped key. Read once by the migration, then removed. */
export const LEGACY_STORAGE_KEY = 'diboas-sandbox-ledger-v1';

/** Per-scope storage key. Two scopes on one device never share a key. */
export function storageKeyFor(scope: LedgerScope): string {
  return `diboas-ledger-v2:${scope}`;
}

/**
 * Browser persistence for the prototype. Every append rewrites the serialized
 * log (small volumes; fine for MVP-0). Storage failures degrade to in-memory
 * behavior (Principle 7) — the session still works, it just won't survive a
 * reload, and the app surfaces nothing scarier than that.
 *
 * Reads and writes ONLY `storageKeyFor(this.scope)`. The v1 → v2 migration is
 * deliberately NOT done here: it needs `project()`/`reconcile()` equivalence
 * before it may delete the old key, and a store constructor is the wrong place
 * for a verify-then-destroy step. It lives in `migrateLegacyLedgerKey()`.
 */
export class LocalStorageLedgerStore implements ILedgerStore {
  private memory: InMemoryLedgerStore;
  private readonly key: string;

  constructor(readonly scope: LedgerScope = 'sandbox') {
    this.memory = new InMemoryLedgerStore(scope);
    this.key = storageKeyFor(scope);
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(this.key);
      if (raw) {
        const events = JSON.parse(raw) as LedgerEvent[];
        // `InMemory.append` is async but its body runs synchronously, so the
        // log is fully loaded before the constructor returns (no await needed).
        // Mis-scoped rows are skipped rather than thrown: a corrupted or
        // hand-edited key must not brick the app on boot (P7 fail-open).
        for (const e of events) {
          if (scopeOf(e) === scope) void this.memory.append(e);
        }
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

  async clearScope(): Promise<void> {
    await this.memory.clearScope();
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(this.key);
      } catch {
        /* non-fatal */
      }
    }
  }

  private async persist(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(this.key, JSON.stringify(await this.memory.getAll()));
    } catch {
      /* quota/blocked: keep working in memory (degraded, not broken) */
    }
  }
}
