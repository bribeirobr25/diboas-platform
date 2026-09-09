/**
 * The app-side scope seam (I-1, plan r2 §I-1 / delta §3).
 *
 * `@diboas/banking` owns the LEDGER's scope binding (`ILedgerStore.scope`,
 * `storageKeyFor`). This module owns the two DERIVED device-local stores that
 * sit beside it — proposal declines and simulated-event resolutions — which are
 * not ledger events (they move no money, C-P0 stays money-pure) but are still
 * facts about ONE ledger and must never be read across scopes: a Practice
 * decline must not silence a Real proposal, and a Practice event resolution
 * must not mark a Real event resolved.
 *
 * Why the sandbox scope keeps the unsuffixed key
 * ----------------------------------------------
 * These keys were written when Practice was the only ledger that existed, so
 * the existing key already IS the sandbox key. Suffixing it would orphan real
 * user state for no benefit — and for `simulatedEvents` specifically, losing a
 * resolution record would let an already-answered life event fire a second time
 * and move money twice. So `'sandbox'` keeps the key it has and every other
 * scope gets a suffix; no migration is needed, and no scope can address
 * another's key.
 *
 * This differs from the ledger, which DOES get a verified v1 → v2 migration —
 * that one is mandated by plan r2 §4 and carries the money.
 */

import type { LedgerScope } from '@diboas/banking';

/**
 * The one ledger scope this build can address. Real Money is OUT of scope
 * until I-8 and is gated by a flag that does not exist yet, so a second value
 * is unreachable today. I-1.2 replaces this constant with the per-scope
 * `getLedger(scope)` registry and the `ModeProvider` that feeds it.
 */
export const ACTIVE_LEDGER_SCOPE: LedgerScope = 'sandbox';

/** Per-scope key for a device-local store. See the note above on `'sandbox'`. */
export function scopedStorageKey(base: string, scope: LedgerScope): string {
  return scope === 'sandbox' ? base : `${base}:${scope}`;
}
