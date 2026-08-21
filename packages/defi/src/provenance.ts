/**
 * THE shared three-state provenance predicate (§3-A, board-vetoed duplicate:
 * the two divergent inline predicates — `PathCard.anyFixture` and
 * `StrategyPicker.isFullyLive` — are deleted in favor of this one).
 *
 * A strategy's displayed return is only as honest as its weakest leg:
 * - `live`    — every allocation leg has a live (DeFiLlama-stamped) APY;
 *   the ONLY state allowed to call itself "real".
 * - `mixed`   — at least one leg is live and at least one is a documented
 *   reference value; the render stamp MUST name the reference protocols
 *   (E5 interim condition, board §3.11).
 * - `fixture` — no leg is live (documented reference values only).
 *
 * A protocol with NO ApY entry at all counts as a fixture leg (fail-honest:
 * absence of data is never presented as live data).
 */

import type { DataStamp, ProtocolApy, StrategyDef } from './types';

export type ProvenanceState = 'live' | 'mixed' | 'fixture';

export interface StrategyProvenance {
  state: ProvenanceState;
  /** Allocation legs WITHOUT live data (named in the mixed stamp). Empty when live. */
  fixtureProtocolIds: string[];
  /** Newest fetch timestamp among the LIVE legs (null when none are live). */
  newestLiveAsOf: string | null;
}

export function strategyProvenance(
  strategy: StrategyDef,
  apys: ProtocolApy[],
  /**
   * The gas stamp, on surfaces that also RENDER a network fee.
   *
   * Provenance used to be derived from APY stamps alone, so a strategy whose
   * rates were live stamped itself "Live from DeFiLlama" while the network fee
   * beside it came from a hardcoded fixture — on the pre-commit cost surface,
   * which is precisely where FC-15 demands the itemization be true. GAS-1
   * (founder 2026-08-03) predicted this and required the choice be made:
   * "either shorten that path's TTL or stamp it honestly."
   *
   * Omit it on surfaces that show no fee (the picker shows rates only), where
   * APY-only provenance is the correct scope.
   */
  gasStamp?: DataStamp
): StrategyProvenance {
  const byId = new Map(apys.map((a) => [a.protocolId, a]));
  const fixtureProtocolIds: string[] = [];
  const liveAsOf: string[] = [];
  for (const leg of strategy.allocation) {
    const apy = byId.get(leg.protocolId);
    if (apy?.stamp.source === 'defillama') liveAsOf.push(apy.stamp.asOf);
    else fixtureProtocolIds.push(leg.protocolId);
  }
  // A fixture fee makes the surface mixed however live the rates are.
  const gasIsFixture = gasStamp != null && gasStamp.source === 'fixture';
  const allApysLive = fixtureProtocolIds.length === 0;
  const state: ProvenanceState = allApysLive
    ? gasIsFixture
      ? 'mixed'
      : 'live'
    : liveAsOf.length === 0
      ? 'fixture'
      : 'mixed';
  return {
    state,
    fixtureProtocolIds,
    // Index access, not `.at(-1)`: the domain packages target ES2020 by
    // config, and `.at` is ES2022 (the workspace type-check catches it even
    // though vitest/tsup strip types without checking).
    newestLiveAsOf: liveAsOf.length > 0 ? liveAsOf.sort()[liveAsOf.length - 1] : null,
  };
}
