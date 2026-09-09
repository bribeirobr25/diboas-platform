/**
 * The v1 → v2 device-ledger migration (I-1, plan r2 §4).
 *
 * Moves the pre-scope log from the unscoped key `diboas-sandbox-ledger-v1` to
 * the scoped key `diboas-ledger-v2:sandbox`.
 *
 * The contract is **read → write → VERIFY → delete**, and the verify step is
 * the whole point: the old key is not removed until the migrated log projects
 * to a byte-identical state AND reconciles identically. If anything disagrees
 * the migration rolls back its own write and leaves v1 untouched, so the worst
 * outcome is "ran again next load", never "the user's practice history is
 * gone".
 *
 * It does NOT stamp `ledgerScope` onto the migrated events. An event-sourced
 * log is never rewritten (decision D-04); absence is read as `'sandbox'` by
 * `scopeOf()`, which is already correct for every legacy event because Real
 * did not exist when they were written.
 */

import { project, reconcile } from './engine';
import { LEGACY_STORAGE_KEY, storageKeyFor } from './store';
import type { LedgerEvent } from './events';

export type LedgerMigrationStatus =
  /** No legacy key present — nothing to do (the normal case after the first run). */
  | 'noop'
  /** Legacy log moved and verified; the old key has been removed. */
  | 'migrated'
  /** A v2 log already exists; the legacy key was left alone rather than overwriting live data. */
  | 'skipped-v2-exists'
  /** Verification failed; the v2 write was rolled back and v1 kept. */
  | 'aborted-verification-failed'
  /** Storage unreadable/unwritable (private mode, quota, blocked). Nothing changed. */
  | 'unavailable';

export interface LedgerMigrationResult {
  status: LedgerMigrationStatus;
  /** Events moved (only meaningful for `'migrated'`). */
  eventCount: number;
  /** Populated for the two failure statuses, for the log line. */
  detail?: string;
}

/** Minimal storage shape, so tests can inject without a DOM. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function parseLog(raw: string): LedgerEvent[] {
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) throw new Error('legacy ledger is not an array');
  return parsed as LedgerEvent[];
}

/**
 * Run the migration once. Idempotent: after a successful run the legacy key is
 * gone, so every later call returns `'noop'`.
 *
 * Pure with respect to the storage it is handed — pass `window.localStorage` in
 * the browser, a fake in tests.
 */
export function migrateLegacyLedgerKey(storage: KeyValueStorage): LedgerMigrationResult {
  const targetKey = storageKeyFor('sandbox');

  let legacyRaw: string | null;
  try {
    legacyRaw = storage.getItem(LEGACY_STORAGE_KEY);
  } catch (error) {
    return { status: 'unavailable', eventCount: 0, detail: String(error) };
  }

  if (legacyRaw === null) return { status: 'noop', eventCount: 0 };

  // A non-empty v2 log outranks a stale v1 key. Overwriting it would discard
  // whatever the user has done since the scope split — the exact data loss this
  // module exists to prevent. Leave both keys and report.
  try {
    const existing = storage.getItem(targetKey);
    if (existing !== null && parseLog(existing).length > 0) {
      return {
        status: 'skipped-v2-exists',
        eventCount: 0,
        detail: 'a scoped v2 sandbox log already exists; legacy key left in place',
      };
    }
  } catch {
    // An unparseable v2 value is treated as absent — the verify step below is
    // what actually decides whether the migration is allowed to commit.
  }

  let legacyEvents: LedgerEvent[];
  try {
    legacyEvents = parseLog(legacyRaw);
  } catch (error) {
    // Corrupt v1: do not delete it (it may be recoverable by hand) and do not
    // write a v2 log from it.
    return { status: 'aborted-verification-failed', eventCount: 0, detail: String(error) };
  }

  try {
    storage.setItem(targetKey, JSON.stringify(legacyEvents));
  } catch (error) {
    return { status: 'unavailable', eventCount: 0, detail: String(error) };
  }

  // VERIFY before destroying anything: read the log back through the same path
  // the app will use, then require total replay equivalence.
  try {
    const readBack = parseLog(storage.getItem(targetKey) ?? '[]');
    const before = project(legacyEvents);
    const after = project(readBack);

    const projectionsMatch = JSON.stringify(before) === JSON.stringify(after);
    const reconcilesMatch = reconcile(before) === reconcile(after);
    const countsMatch = readBack.length === legacyEvents.length;

    if (!projectionsMatch || !reconcilesMatch || !countsMatch) {
      storage.removeItem(targetKey); // roll back our own write
      return {
        status: 'aborted-verification-failed',
        eventCount: 0,
        detail: `projections=${projectionsMatch} reconcile=${reconcilesMatch} counts=${countsMatch}`,
      };
    }

    storage.removeItem(LEGACY_STORAGE_KEY);
    return { status: 'migrated', eventCount: legacyEvents.length };
  } catch (error) {
    try {
      storage.removeItem(targetKey);
    } catch {
      /* best effort rollback */
    }
    return { status: 'aborted-verification-failed', eventCount: 0, detail: String(error) };
  }
}
