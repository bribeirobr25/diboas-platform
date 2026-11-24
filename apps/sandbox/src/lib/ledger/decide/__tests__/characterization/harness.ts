/**
 * ⛑ LEDGER-CHAR-1 · runs one characterization case against a FRESH ledger (plan P12 §4.1).
 *
 * Per case: storage cleared, every module re-imported (the ledger is a module singleton),
 * hydration awaited, the history seeded, then the counters, the clock and the timeline reset;
 * the command runs once; everything it did is returned as one observation.
 *
 * The mocks this relies on (ids and the banking package) are declared by each test file, because
 * `vi.mock` is hoisted per file; `mocks.ts` builds them.
 *
 * Observation runs until the write-behind persist has settled (`flush()`), so a change in what
 * happens AFTER the command returns (a second persist, an extra notification, a failed store
 * write) shows too. Every argument a case passes to the ledger is captured automatically, so a
 * command that mutates or keeps its caller's objects shows without the case declaring them.
 */
import type { LedgerEvent, LedgerState } from '@diboas/banking';
import { createHash } from 'node:crypto';
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
  row: number | 'preview' | 'walk' | 'core';
  /**
   * What today's code does, labelled by hand from reading it (plan §4.1): `emitted`,
   * `noop:<reason>` (camelCase, D4) or `throw`, plus any notes for legs it withholds. PR-2's
   * decisions are checked against these labels; the goldens never record an `outcome`.
   */
  label: { expected: string; notes?: readonly string[] };
  /** A defect this case pins on purpose (a register id), so S1b changes it deliberately. */
  pinnedDefect?: string;
  /** The history in force before the command (written through the real append path). */
  seed?: LedgerEvent[];
  /** Raw storage written BEFORE the modules load (the stored-unknown-event recipe). */
  rawStorage?: Record<string, string>;
  /** Declined weeks and resolutions in the side stores before the command. */
  sideStores?: { declined?: number[][] };
  clockMode?: 'fixed' | 'advancing';
  /** Throw once on the projection inside the command's append (fault injection). */
  faultOnAppend?: boolean;
  /** Make the store's next write of the ledger key throw (the write-behind persist failure). */
  failPersistOnce?: boolean;
  /**
   * Extra objects to watch for mutation and shared references, beyond the arguments passed to
   * the ledger (which are captured automatically).
   */
  inputs?: unknown[];
  run: (api: CaseApi) => unknown;
  /**
   * Store the timeline as a digest and per-kind counts instead of in full (the random walk,
   * whose per-step outcomes, appends and state hashes are already its result; plan §4.1).
   */
  compact?: boolean;
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

/** Every key the Practice app stores starts with this (`lib/scope.ts`, the side stores). */
const STORAGE_PREFIX = 'diboas';
const LEDGER_KEY_PREFIX = 'diboas-ledger';
const CONSOLE_METHODS = ['log', 'debug', 'trace', 'info', 'warn', 'error'] as const;

/**
 * The ledger module with every function wrapped so each call's arguments are captured (by
 * reference, with an encoded snapshot taken before the call).
 */
function capturing(ledger: Ledger, into: { args: unknown[]; before: string }[]): Ledger {
  const wrapped: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(ledger)) {
    wrapped[name] =
      typeof value === 'function'
        ? (...args: unknown[]) => {
            into.push({ args, before: encode(args) });
            return (value as (...a: unknown[]) => unknown)(...args);
          }
        : value;
  }
  return wrapped as Ledger;
}

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
  const g = globalThis as Record<string, unknown>;
  const restore: Array<() => void> = [];
  try {
    installClock();
    restore.push(uninstallClock);
    // Spied on the instance: happy-dom's storage does not route through `Storage.prototype`.
    const originalSetItem = localStorage.setItem.bind(localStorage);
    let failPersist = false;
    const setItem = vi
      .spyOn(localStorage, 'setItem')
      .mockImplementation((key: string, value: string) => {
        const ledgerKey = key.startsWith(LEDGER_KEY_PREFIX);
        // The ledger key's value is in `storage`; a side store's value is recorded here.
        record('storage.set', key, ledgerKey ? `<${value.length} chars>` : value);
        if (ledgerKey && failPersist && r.armed) {
          failPersist = false;
          throw new Error('characterization: injected storage failure');
        }
        return originalSetItem(key, value);
      });
    restore.push(() => setItem.mockRestore());
    for (const method of CONSOLE_METHODS) {
      const spy = vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
        record('console', method, normalizeLog(args));
      });
      restore.push(() => spy.mockRestore());
    }

    const { core, ledger, proposals, simEvents } = await fresh(def);
    if (!def.rawStorage) {
      // A fresh ledger must be empty, or the case would build on a previous one.
      if (core.getLedgerState().initialized || localStorage.length > 0)
        throw new Error(`case ${def.id}: the ledger was not empty before seeding`);
      if (def.seed?.length) core.appendAll(def.seed);
      for (const weekSet of def.sideStores?.declined ?? []) proposals.recordDecline(weekSet);
      await core.flush();
    }

    const appended: LedgerEvent[][] = [];
    const calls: { args: unknown[]; before: string }[] = [];
    const unsubscribe = core.subscribe(() => record('notify'));
    restore.push(unsubscribe);
    // Read the state the command will see BEFORE arming, so the cache is warm (the command's
    // own reads then show only where it really projects), unless this case is about a read
    // that throws, where reading here would throw first.
    let stateBefore: LedgerState | null = null;
    let stateBeforeText = '';
    if (!def.rawStorage) {
      stateBefore = core.getLedgerState();
      stateBeforeText = encode(stateBefore);
    }
    const extraInputs = def.inputs ?? [];
    const extraBefore = encode(extraInputs);

    r.idCounter = 0;
    r.clockIndex = 0;
    r.timeline = [];
    r.faultOnce = def.faultOnAppend ?? false;
    failPersist = def.failPersistOnce ?? false;
    g.__charAppended = appended;
    // Events already in the log, so the projection mock records only what the command appends.
    // A stored history the projection cannot read is counted from storage, never by projecting.
    g.__charSeenLength = def.rawStorage
      ? Object.values(def.rawStorage).reduce((n, raw) => {
          const parsed: unknown = JSON.parse(raw);
          return n + (Array.isArray(parsed) ? parsed.length : 0);
        }, 0)
      : core.getLedgerState().events.length;
    r.armed = true;

    let result: unknown;
    try {
      const value = def.run({
        ledger: capturing(ledger, calls),
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
    r.faultOnce = false;
    // Keep observing until the write-behind persist has settled (`core.ts:185-193`).
    await core.flush();
    r.armed = false;

    const timeline: TimelineEntry[] = def.compact
      ? [
          ['digest', createHash('sha256').update(encode(r.timeline)).digest('hex')],
          ...Object.entries(
            r.timeline.reduce<Record<string, number>>(
              (n, [kind]) => ({ ...n, [kind]: (n[kind] ?? 0) + 1 }),
              {}
            )
          ).map(([kind, count]): TimelineEntry => ['count', kind, count]),
        ]
      : [...r.timeline];
    const inputs = [...calls.map((c) => c.args), ...extraInputs];
    return {
      timeline,
      result,
      // The projected state without its `events` echo: the log itself is compared byte for byte
      // in `storage`, so repeating it here would only double every golden.
      stateAfter: def.rawStorage
        ? null
        : snapshot({ ...core.getLedgerState(), events: '<in storage>' }),
      storage: storageSnapshot(),
      ids: r.idCounter,
      clockReads: r.clockIndex,
      stateMutated: stateBefore ? encode(stateBefore) !== stateBeforeText : false,
      inputsMutated:
        calls.some((c) => encode(c.args) !== c.before) || encode(extraInputs) !== extraBefore,
      sharedReferences: sharedReferences(inputs, appended),
    };
  } finally {
    r.armed = false;
    r.faultOnce = false;
    for (const undo of restore.reverse()) undo();
    delete g.__charAppended;
    delete g.__charSeenLength;
  }
}
