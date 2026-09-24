/**
 * SOURCE PERSISTENCE RIGHTS — may we KEEP what we were allowed to FETCH?
 *
 * ⚑ FETCHING AND RETAINING ARE DIFFERENT QUESTIONS. Founder risk acceptance
 * authorizes continued fetching from CoinGecko and DeFiLlama for the reviewed
 * Practice fact pattern. It does not, by itself, settle STORAGE of normalized
 * or derived data from those sources — `LC-LIC-01` governs use, display,
 * storage, retention, derived data and attribution independently, and
 *
 * ```text
 * TECHNICALLY ACCESSIBLE SOURCE
 * ≠ CONTRACTUALLY PERMITTED SOURCE
 * ```
 *
 * ⚑ WHAT THIS CHANGES, AND WHAT IT DOES NOT. The persistable lane was a
 * hard-coded set containing exactly `'fixture'`, so widening it meant editing a
 * predicate. It is now a DECLARATION per source, with its basis stated and its
 * owner named — so widening it is a data change made by whoever actually holds
 * the authority, not a refactor.
 *
 * **No source's effective state changes here.** The fixture lane persists as
 * before; the two providers do not, and flipping either is a Legal/Founder
 * decision because a material expansion of retention or redistribution is an
 * explicit review trigger (`03 §8`). Engineering declares the shape; it does
 * not grant the right.
 */

import type { EvidenceSourceId } from './types';

export interface PersistenceRight {
  /** May normalized/derived evidence from this source be stored at rest? */
  readonly mayPersistNormalized: boolean;
  /**
   * Days the applicable rights permit retaining, or `null` where no ceiling is
   * stated. Feeds `reconcileRetention`, which refuses to `min()` it against a
   * longer Product requirement.
   */
  readonly permittedCeilingDays: number | null;
  /** Who decides, and on what basis. */
  readonly because: string;
}

const PERSISTENCE_RIGHTS: Record<EvidenceSourceId, PersistenceRight> = {
  fixture: {
    mayPersistNormalized: true,
    permittedCeilingDays: null,
    because:
      'diBoaS-authored reference values. No third-party rights attach, so nothing external constrains storage or retention; the applicable limits are our own purpose-bounding and privacy obligations.',
  },
  coingecko: {
    mayPersistNormalized: false,
    permittedCeilingDays: null,
    because:
      'Fetching is allowed under Founder risk acceptance for the reviewed Practice fact pattern. Storage/retention rights for derived data are a separate LC-LIC-01 question and are not established. A material expansion of retention or redistribution is an explicit review trigger (03 §8), so this flag is a Legal/Founder decision, not an Engineering one.',
  },
  defillama: {
    mayPersistNormalized: false,
    permittedCeilingDays: null,
    because: 'As coingecko — fetch authority does not carry storage authority.',
  },
};

export function persistenceRightFor(source: EvidenceSourceId): PersistenceRight {
  return PERSISTENCE_RIGHTS[source];
}

/** May normalized evidence from this source be stored at rest? Fail-closed by declaration. */
export function mayPersistNormalized(source: EvidenceSourceId): boolean {
  return PERSISTENCE_RIGHTS[source].mayPersistNormalized;
}
