/**
 * The platform-side `SimulatedEventResolved` record store (D-s §3, CH-1
 * discipline): the CHOICE record — which option the user picked, under which
 * catalogue version. It moves no money and never joins the C-P0 ledger set;
 * the money legs are already ledger events. Same localStorage + node-safe
 * in-memory degradation pattern as `proposalStore`.
 */

import { SIMULATED_EVENT_CATALOGUE_VERSION } from '@/config/simulatedEventCatalogue';

import { storageAvailable } from './deviceStorage';
import { Logger } from './monitoring/Logger';
import { ACTIVE_LEDGER_SCOPE, scopedStorageKey } from './scope';

// Scope-bound (I-1): a resolution record belongs to one ledger — see `scope.ts`
// for why the sandbox scope keeps the unsuffixed key. This store is NOT a money
// guard: an answered event cannot fire or move money twice because the LEDGER
// refuses it (`state.resolvedEventInstances`, `simulatedEvents.ts` and
// `ledger/simEvents.ts`). Losing a record here loses the choice record only.
const STORAGE_KEY = scopedStorageKey('diboas.sandbox.simulatedEvents.v1', ACTIVE_LEDGER_SCOPE);

export interface SimulatedEventResolution {
  eventInstanceId: string;
  eventType: string;
  /** The option key the user chose (or 'postponed' never appears — postponement is absence). */
  choice: string;
  /** The catalogue version this event resolved under (honest replay across catalogue changes). */
  catalogueVersion: number;
  resolvedAt: string;
}

let memoryFallback: unknown[] = [];

/** A record this build can use — every field the readers touch, of the right kind. */
function isResolution(v: unknown): v is SimulatedEventResolution {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.eventInstanceId === 'string' &&
    typeof r.eventType === 'string' &&
    typeof r.choice === 'string' &&
    typeof r.catalogueVersion === 'number' &&
    typeof r.resolvedAt === 'string'
  );
}

/**
 * The stored entries AS STORED (2026-10-19 lane sweep). Device storage is parsed, not
 * asserted: a malformed entry used to reach `r.eventInstanceId` and throw — after the
 * expense's money had already moved. An entry this build cannot read is never used and
 * never destroyed (a newer build may have written it): writes carry it forward untouched.
 */
function readStored(): unknown[] {
  if (!storageAvailable()) return [...memoryFallback];
  const stored = readStorage();
  /* Plus any record whose save failed this session (lane audit 2026-10-20) — the memory
     fallback used to be read only when storage was absent, so such a record vanished at
     once. Records are only ever added (first record wins; the sole removal is the full
     reset), so appending the ones storage does not name is always correct. */
  const named = new Set(stored.map(idOf));
  return [...stored, ...memoryFallback.filter((entry) => !named.has(idOf(entry)))];
}

function readStorage(): unknown[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function usableOf(stored: unknown[]): SimulatedEventResolution[] {
  const usable = stored.filter(isResolution);
  if (usable.length !== stored.length)
    // A count, never a value (bounded logging); the entries themselves stay stored.
    Logger.warn('simulated-event store holds unreadable records — ignored, kept', {
      unreadable: stored.length - usable.length,
    });
  return usable;
}

function write(records: unknown[]): void {
  if (!storageAvailable()) {
    memoryFallback = records;
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    // P7: a failed persist must never blank the flow — but log it (Principle 12).
    Logger.error('simulated-event store persist failed — memory fallback', {}, error);
    memoryFallback = records;
  }
}

/** All resolutions, oldest first. */
export function getResolutions(): SimulatedEventResolution[] {
  return usableOf(readStored());
}

/** The event id an entry names, even when the rest of it is unreadable. */
const idOf = (entry: unknown): unknown =>
  typeof entry === 'object' && entry !== null
    ? (entry as { eventInstanceId?: unknown }).eventInstanceId
    : undefined;

/** Record a resolution (idempotent per eventInstanceId — first record wins). */
export function recordResolution(input: {
  eventInstanceId: string;
  eventType: string;
  choice: string;
  resolvedAt: string;
}): void {
  const stored = readStored();
  usableOf(stored); // logs the unreadable count, if any
  /* "First record wins" holds against ANY stored entry naming this event — even one this
     build cannot otherwise read (e.g. a newer build's field shape), so a second record is
     never appended beside it (final review 2026-10-19). */
  if (stored.some((entry) => idOf(entry) === input.eventInstanceId)) return;
  write([...stored, { ...input, catalogueVersion: SIMULATED_EVENT_CATALOGUE_VERSION }]);
}

/** Clear all records (sandbox reset rides along). */
export function clearSimulatedEvents(): void {
  memoryFallback = [];
  if (!storageAvailable()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // memory fallback already clear
  }
}
