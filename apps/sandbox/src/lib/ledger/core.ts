/**
 * The ledger client's INFRASTRUCTURE core (P2BD-4 extraction): the in-memory
 * log, hydration, subscription, and the append/persist seam. Action modules
 * (`journey` · `rules` · `credits` · `simEvents`) compose events on top of
 * this; screens and tests consume everything through the `ledgerClient`
 * barrel — never this file directly.
 *
 * Memory-authoritative design (P1.2 slice 1b, plan §6.2): the in-memory `log`
 * is the source of truth for reads, so `getLedgerState()` stays synchronous and
 * preserves React's `useSyncExternalStore` contract even though `ILedgerStore`
 * is now async. The store (LocalStorage now, Postgres in Phase 2) is touched
 * only in `hydrate()` (load-once) and the write-behind persist — never in the
 * render path.
 */

import {
  LocalStorageLedgerStore,
  project,
  type ILedgerStore,
  type LedgerEvent,
  type LedgerState,
} from '@diboas/banking';
import { generateId } from '../ids';
import { Logger } from '../monitoring/Logger';
import { clearProposalDecisions } from '../proposalStore';
import { clearSimulatedEvents } from '../simulatedEventStore';

type Listener = () => void;

let store: ILedgerStore | null = null;
let log: LedgerEvent[] = [];
let cachedState: LedgerState | null = null;
// The hydration gate (P1.2 slice 1c, plan §7): false until `hydrate()` settles
// (success OR failure), then true forever. The UI reads it via `getReady()` +
// `<LedgerReadyGate>` so no ledger-reading screen renders against an unhydrated
// log (which would tell a returning user something FALSE about their money —
// an R-4 violation). One microtask in P1.2 (LocalStorage); seconds in Phase 2
// (Neon cold-start), where the gate earns its keep.
let ready = false;
// Chained so `flush()` can await every pending write-behind persist in order.
let pendingPersist: Promise<void> = Promise.resolve();
const listeners = new Set<Listener>();

function getStore(): ILedgerStore {
  if (!store) store = new LocalStorageLedgerStore();
  return store;
}

function emit(): void {
  cachedState = null;
  for (const listener of listeners) listener();
}

/**
 * Load the persisted log into memory. Called at module init (§6.2 / CTO §15.5 —
 * NOT from a useEffect, so the pre-hydration window is one microtask, invisible)
 * rather than lazily, so the render path never touches the async store.
 */
async function hydrate(): Promise<void> {
  try {
    const loaded = await getStore().getAll();
    // Precision-1 (CTO §16): adopt the persisted log ONLY if nothing was
    // appended in the pre-hydration window — a late Phase-2 hydrate (seconds
    // against Neon) must never clobber events the user already created. This is
    // the STRUCTURAL no-clobber guard at the data layer, independent of the UI
    // ready-gate (belt-and-suspenders). Near-zero window in P1.2 (LocalStorage).
    if (log.length === 0) log = loaded;
  } catch (error) {
    // Fail-open: leave `log` as-is (empty, or any pre-hydration appends) rather
    // than resetting to [] — the same no-clobber contract as the success path.
    Logger.error('ledger hydrate failed — continuing with in-memory log', {}, error);
  } finally {
    // Open the gate whether hydrate succeeded or failed — a failed load still
    // means "we tried; render what we have" (fail-open, P7), never a hung gate.
    ready = true;
    emit();
  }
}
void hydrate();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLedgerState(): LedgerState {
  // Project from the in-memory log — referentially stable until the next append
  // (cached), and never awaits the store.
  if (!cachedState) cachedState = project(log);
  return cachedState;
}

/**
 * The hydration-ready snapshot for `useSyncExternalStore` (via `useLedgerReady`
 * + `<LedgerReadyGate>`). Reuses `subscribe` — `hydrate()`'s `emit()` flips this
 * from false→true exactly once. Returns a stable primitive, so it satisfies the
 * store contract without a referential cache.
 */
export function getReady(): boolean {
  return ready;
}

/**
 * Sync (CTO §15.4): actions call this and use return values synchronously
 * (`createGoal` → `router.push` + chained `enterStrategy`). The write-behind
 * persist is fire-and-forget; callers needing durability confirmation await
 * `flush()`. Write-through awaits `flush()` at commit points (persistence
 * cutover track — see below). INTERNAL to the ledger action modules — screens
 * never append raw events (every append goes through a guarded action).
 */
export function appendAll(events: LedgerEvent[]): void {
  for (const event of events) log.push(event);
  const s = getStore();
  pendingPersist = pendingPersist.then(async () => {
    for (const event of events) {
      try {
        await s.append(event);
      } catch (error) {
        Logger.error('ledger persist failed', { eventId: event.eventId, type: event.type }, error);
      }
    }
  });
  emit();
}

/**
 * Await all pending write-behind persists — the durability seam for §10.
 *
 * ⚠ INTENTIONAL SEAM, zero call sites by design (CTO §16.8) — do NOT delete.
 * `apps/sandbox` is already in knip (`knip.json`); this is not flagged, and the
 * write-through path (persistence cutover) calls it at commit points (manifest
 * approve).
 *
 * ⚠ CONTRACT NOTE (CTO §16, precision 2): today the persist `catch` is INSIDE
 * the loop, so `flush()` can NEVER reject — correct for 1b write-behind, but the
 * OPPOSITE of what write-through needs. The **persistence/mode cutover track**
 * (NOT this Phase-2 Grow cut, which stays on the localStorage ledger) must CHANGE
 * the semantics (let a persist failure surface here), not merely refine them.
 */
export async function flush(): Promise<void> {
  await pendingPersist;
}

/** Event stamp shared by every action module. INTERNAL to the ledger modules. */
export function base(correlationId: string) {
  return {
    eventId: generateId(),
    simDay: getLedgerState().simDay,
    recordedAt: new Date().toISOString(),
    correlationId,
  };
}

export function resetSandbox(): void {
  clearProposalDecisions();
  clearSimulatedEvents();
  log = [];
  pendingPersist = pendingPersist
    .then(() => getStore().clear())
    .catch((error) => Logger.error('ledger clear failed', {}, error));
  emit();
}
