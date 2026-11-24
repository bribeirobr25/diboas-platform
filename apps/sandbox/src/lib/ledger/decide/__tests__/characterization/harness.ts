/**
 * ⛑ LEDGER-CHAR-1 · runs one characterization case against a FRESH ledger (plan P12 §4.1).
 *
 * Per case: storage cleared, every module re-imported (the ledger is a module singleton),
 * hydration awaited, the history seeded, then the counters, the clock and the timeline reset;
 * the command runs once; everything it did is returned as one observation.
 *
 * The mocks this relies on are declared by each test file (`vi.mock` is hoisted per file):
 * `mockDeclarations` below lists them, and `mocks.ts` builds them.
 */
import type { LedgerEvent, LedgerState } from '@diboas/banking';
import { vi } from 'vitest';
import {
  describeError,
  encode,
  installClock,
  normalizeLog,
  record,
  recorder,
  snapshot,
  uninstallClock,
  type TimelineEntry,
} from './recorder';

/** The scoped store key the ledger persists under (`lib/scope.ts`, `@diboas/banking`). */
export type Ledger = typeof import('@/lib/ledgerClient');
type Core = typeof import('@/lib/ledger/core');
type Proposals = typeof import('@/lib/proposalStore');
type SimEvents = typeof import('@/lib/simulatedEventStore');

export interface CaseApi {
  ledger: Ledger;
  /** A `feeFor` callback that records each call (rows 12 and the previews). */
  feeFor: (fees: Record<string, number>) => (positionId: string) => number;
  proposals: Proposals;
  simEvents: SimEvents;
}

export interface CaseDef {
  /** Unique within its family; never reused for a different case. */
  id: string;
  /** The command's row in plan P12 Appendix A (1–19; 'preview' for the previews). */
  row: number | 'preview';
  /** The history in force before the command (written through the real append path). */
  seed?: LedgerEvent[];
  /** Raw storage written BEFORE the modules load (the stored-unknown-event recipe). */
  rawStorage?: Record<string, string>;
  /** Declined weeks and resolutions in the side stores before the command. */
  sideStores?: { declined?: number[][] };
  clockMode?: 'fixed' | 'advancing';
  /** Throw once on the projection inside the command's append (fault injection). */
  faultOnAppend?: boolean;
  /** The inputs, snapshotted before and after to catch mutation, and walked for shared refs. */
  inputs?: unknown[];
  run: (api: CaseApi) => unknown;
}

export interface Observation {
  timeline: TimelineEntry[];
  result: unknown;
  stateAfter: unknown;
  storage: Record<string, string>;
  ids: number;
  clockReads: number;
  stateMutated: boolean;
  inputsMutated: boolean;
  /** Event fields that ARE the caller's own objects (reference identity), as paths. */
  sharedReferences: string[];
}

const STORAGE_PREFIX = 'diboas';
const realSetItem = Storage.prototype.setItem;

async function fresh(def: CaseDef) {
  localStorage.clear();
  for (const [key, value] of Object.entries(def.rawStorage ?? {})) localStorage.setItem(key, value);
  vi.resetModules();
  const core: Core = await import('@/lib/ledger/core');
  const ledger: Ledger = await import('@/lib/ledgerClient');
  const proposals: Proposals = await import('@/lib/proposalStore');
  const simEvents: SimEvents = await import('@/lib/simulatedEventStore');
  // `hydrate()` is fire-and-forget at module load (`core.ts:134`).
  await vi.waitUntil(() => core.getReady());
  return { core, ledger, proposals, simEvents };
}

function storageSnapshot(): Record<string, string> {
  const out: Record<string, string> = {};
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i)!);
  for (const key of keys.sort()) {
    if (key.startsWith(STORAGE_PREFIX)) out[key] = localStorage.getItem(key)!;
  }
  return out;
}

function objectsIn(value: unknown, path: string, into: Map<object, string>): void {
  if (value === null || typeof value !== 'object') return;
  if (into.has(value)) return;
  into.set(value, path);
  for (const [k, v] of Object.entries(value)) objectsIn(v, `${path}.${k}`, into);
}

function sharedReferences(inputs: unknown[], appended: LedgerEvent[][]): string[] {
  const owned = new Map<object, string>();
  inputs.forEach((input, i) => objectsIn(input, `input[${i}]`, owned));
  const found: string[] = [];
  appended.forEach((events, call) =>
    events.forEach((event, e) => {
      for (const [field, value] of Object.entries(event)) {
        if (value !== null && typeof value === 'object' && owned.has(value))
          found.push(`append[${call}][${e}].${field} === ${owned.get(value)}`);
      }
    })
  );
  return found;
}

export async function runCase(def: CaseDef): Promise<Observation> {
  const r = recorder();
  r.armed = false;
  r.timeline = [];
  r.faultOnce = false;
  r.clockMode = def.clockMode ?? 'fixed';
  installClock();
  const setItem = vi
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(function (this: Storage, key: string, value: string) {
      // The ledger's own key is written behind every append (its value is in `storage`);
      // a side store's write is recorded with its value, at the moment it happens.
      record('storage.set', key, key.startsWith('diboas-ledger') ? `<${value.length} chars>` : value);
      return realSetItem.call(this, key, value);
    });
  const consoleSpies = (['warn', 'error', 'info'] as const).map((level) =>
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      record('console', level, normalizeLog(args));
    })
  );
  try {
    const { core, ledger, proposals, simEvents } = await fresh(def);
    if (!def.rawStorage) {
      // A fresh ledger must be empty, or the case would build on a previous one.
      if (core.getLedgerState().initialized || localStorage.length > 0)
        throw new Error(`case ${def.id}: the ledger was not empty before seeding: ${JSON.stringify(Object.keys(localStorage))} initialized=${core.getLedgerState().initialized}`);
      if (def.seed?.length) core.appendAll(def.seed);
      for (const weekSet of def.sideStores?.declined ?? []) proposals.recordDecline(weekSet);
      await core.flush();
    }

    const appended: LedgerEvent[][] = [];
    const unsubscribe = core.subscribe(() => record('notify'));
    // Read the state the command will see BEFORE arming, so the cache is warm (the command's
    // own reads then show only where it really projects) — unless this case is about a read
    // that throws, where reading here would throw first.
    let stateBefore: LedgerState | null = null;
    let stateBeforeText = '';
    if (!def.rawStorage) {
      stateBefore = core.getLedgerState();
      stateBeforeText = encode(stateBefore);
    }
    const inputs = def.inputs ?? [];
    const inputsBefore = encode(inputs);

    r.idCounter = 0;
    r.clockIndex = 0;
    r.timeline = [];
    r.faultOnce = def.faultOnAppend ?? false;
    (globalThis as Record<string, unknown>).__charAppended = appended;
    (globalThis as Record<string, unknown>).__charSeenLength = core.getLedgerState().events.length;
    r.armed = true;

    let result: unknown;
    try {
      const value = def.run({
        ledger,
        proposals,
        simEvents,
        feeFor: (fees) => (positionId) => {
          record('feeFor', positionId);
          return fees[positionId] ?? 0;
        },
      });
      result = { return: snapshot(value) };
    } catch (error) {
      result = { throw: describeError(error) };
    }
    r.armed = false;
    r.faultOnce = false;
    unsubscribe();
    await core.flush();

    const observation: Observation = {
      timeline: [...r.timeline],
      result,
      stateAfter: def.rawStorage ? null : snapshot(core.getLedgerState()),
      storage: storageSnapshot(),
      ids: r.idCounter,
      clockReads: r.clockIndex,
      stateMutated: stateBefore ? encode(stateBefore) !== stateBeforeText : false,
      inputsMutated: encode(inputs) !== inputsBefore,
      sharedReferences: sharedReferences(inputs, appended),
    };
    return observation;
  } finally {
    r.armed = false;
    for (const spy of consoleSpies) spy.mockRestore();
    setItem.mockRestore();
    uninstallClock();
    delete (globalThis as Record<string, unknown>).__charAppended;
    delete (globalThis as Record<string, unknown>).__charSeenLength;
  }
}
