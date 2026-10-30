/**
 * SOURCE PERSISTENCE RIGHTS — which sources may be STORED, declared per source.
 *
 * ⚑ FETCHING AND STORING ARE SEPARATE DECISIONS. Being able to fetch a source
 * never makes it persistable: whether normalized or derived data from a source
 * may be stored is declared here, per source, with its basis named by reference
 * (`LC-LIC-01`, recorded privately) and its owner.
 *
 * ⚑ WHAT THIS CHANGES, AND WHAT IT DOES NOT. The persistable lane was a
 * hard-coded set containing exactly `'fixture'`, so widening it meant editing a
 * predicate. It is now a DECLARATION per source, with its basis stated and its
 * owner named — so widening it is a data change made by whoever actually holds
 * the authority, not a refactor.
 *
 * **No source's effective state changes here.** The fixture lane persists as
 * before; the two providers do not, and flipping either is a Legal/Founder
 * decision (an explicit review trigger, recorded privately). Engineering
 * declares the shape; it does not grant the right.
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
      'Not persisted: the per-source persistence decision (LC-LIC-01, recorded privately) has not opened this source. Opening it is a Legal/Founder decision, not an Engineering one.',
  },
  defillama: {
    mayPersistNormalized: false,
    permittedCeilingDays: null,
    because: 'As coingecko: not opened by the per-source persistence decision (LC-LIC-01).',
  },
};

export function persistenceRightFor(source: EvidenceSourceId): PersistenceRight {
  return PERSISTENCE_RIGHTS[source];
}

/** May normalized evidence from this source be stored at rest? Fail-closed by declaration. */
export function mayPersistNormalized(source: EvidenceSourceId): boolean {
  return PERSISTENCE_RIGHTS[source].mayPersistNormalized;
}
