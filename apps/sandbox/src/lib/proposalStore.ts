/**
 * The D-r proposals store (§2.3, P2BD-11) — deliberately NOT a second
 * event-sourced persistence layer. Sandbox proposals never expire and re-derive
 * stale amounts at approval (D-r §2), so the standing proposal is a pure
 * function of the ledger (weeks collected − weeks applied). The ONLY fact the
 * ledger cannot answer is a DECLINE — it moves no money and leaves no ledger
 * trace ("credits stay in Available; no nag, ever") — so this store remembers
 * exactly that: which week indices the user has declined a proposal for.
 *
 * localStorage-backed with the same node-safe degradation as the ledger store
 * (in-memory fallback keeps tests and SSR passes honest). The C-P0 ledger set
 * stays money-pure — the D-r carve-out.
 */

const STORAGE_KEY = 'diboas.sandbox.proposalDeclines.v1';

let memoryFallback: number[] = [];

function storageAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function read(): number[] {
  if (!storageAvailable()) return [...memoryFallback];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((w): w is number => Number.isInteger(w));
  } catch {
    return [];
  }
}

function write(weeks: number[]): void {
  const unique = [...new Set(weeks)].sort((a, b) => a - b);
  if (!storageAvailable()) {
    memoryFallback = unique;
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  } catch {
    // Quota/private-mode failure: degrade to memory rather than throwing into
    // the decline tap (P7 — a decline must never blank the screen).
    memoryFallback = unique;
  }
}

/** Week indices whose proposal the user declined (ascending, unique). */
export function getDeclinedWeeks(): number[] {
  return read();
}

/** Record a decline for a proposal's whole week-set. Idempotent. */
export function recordDecline(weekSet: number[]): void {
  write([...read(), ...weekSet]);
}

/** Clear all decline records (sandbox reset rides along). */
export function clearProposalDecisions(): void {
  memoryFallback = [];
  if (!storageAvailable()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do — memory fallback is already clear.
  }
}
