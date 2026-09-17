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

/**
 * What the GAS/fee evidence is, as its own axis (`5.217` / Finding 1, ruled
 * 2026-09-17). Kept separate from `state` because the fee sentence and the
 * overall classification answer different questions:
 *
 * - `none`        this consumer renders no fee, so fee provenance is out of scope
 *                 (the picker shows rates only).
 * - `live`        a live gas quote was used.
 * - `reference`   a documented reference value WAS used -> `common.dataGasReference`
 *                 may render.
 * - `unavailable` the fee could not be priced, so NO fee value is being used ->
 *                 `common.dataGasReference` MUST NOT render (it would claim a
 *                 reference value is in a calculation that was refused); the
 *                 approved `5.348` unavailable treatment renders instead.
 */
export type FeeProvenance = 'none' | 'live' | 'reference' | 'unavailable';

export interface StrategyProvenance {
  /**
   * The OVERALL classification. It may only ever DEGRADE: a missing expected
   * fee can pull an otherwise-live strategy to `mixed`, but nothing about the
   * fee may make a `fixture` strategy look fresher (ruling 2026-09-17 §3:
   * "may reduce asserted truth, may never increase asserted truth").
   */
  state: ProvenanceState;
  /**
   * The APY/rate axis, derived from the APY LEGS ALONE (`5.402`, ruled
   * 2026-09-17 §1). The rate label makes a claim about the RATE, so gas being
   * fixture, missing or unavailable must never turn a live APY label into
   * "includes documented reference values". Never read `state` to pick APY copy.
   */
  apyProvenance: ProvenanceState;
  /** The fee axis, derived from the gas stamp alone. */
  feeProvenance: FeeProvenance;
  /** Allocation legs WITHOUT live data (named in the mixed stamp). Empty when live. */
  fixtureProtocolIds: string[];
  /**
   * Newest fetch timestamp among the LIVE legs (null when none are live).
   *
   * Consumers dereference this on the `mixed` and `live` branches, so the
   * domain test asserts the invariant directly: whenever `state` is not
   * `fixture`, this is non-null. The ruling is explicit that the component's
   * control-flow shape is NOT the proof.
   */
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
  gasStamp?: DataStamp | 'missing'
): StrategyProvenance {
  const byId = new Map(apys.map((a) => [a.protocolId, a]));
  const fixtureProtocolIds: string[] = [];
  const liveAsOf: string[] = [];
  for (const leg of strategy.allocation) {
    const apy = byId.get(leg.protocolId);
    if (apy?.stamp.source === 'defillama') liveAsOf.push(apy.stamp.asOf);
    else fixtureProtocolIds.push(leg.protocolId);
  }
  /**
   * THE APY AXIS — legs only (`5.402`). This is what the rate label must read.
   * Nothing about gas appears in it, by construction.
   */
  const allApysLive = fixtureProtocolIds.length === 0;
  const apyProvenance: ProvenanceState = allApysLive
    ? 'live'
    : liveAsOf.length === 0
      ? 'fixture'
      : 'mixed';

  /** THE FEE AXIS — the gas stamp only (Finding 1). */
  const feeProvenance: FeeProvenance =
    gasStamp === undefined
      ? 'none'
      : gasStamp === 'missing'
        ? 'unavailable'
        : gasStamp.source === 'fixture'
          ? 'reference'
          : 'live';

  /**
   * THE OVERALL STATE — degrade-only.
   *
   * A fee that is reference-backed OR unavailable pulls an all-live strategy to
   * `mixed` (GAS-1: this surface may not open with "Live from DeFiLlama" above a
   * fee that is neither live nor priced). It can do nothing else: when the APY
   * axis is already `fixture` or `mixed`, the fee cannot raise it, so a fixture
   * leg stays a fixture leg. `state` is therefore never fresher than
   * `apyProvenance`.
   */
  const feeWeakens = feeProvenance === 'reference' || feeProvenance === 'unavailable';
  const state: ProvenanceState = apyProvenance === 'live' && feeWeakens ? 'mixed' : apyProvenance;
  return {
    state,
    apyProvenance,
    feeProvenance,
    fixtureProtocolIds,
    // Index access, not `.at(-1)`: the domain packages target ES2020 by
    // config, and `.at` is ES2022 (the workspace type-check catches it even
    // though vitest/tsup strip types without checking).
    newestLiveAsOf: liveAsOf.length > 0 ? liveAsOf.sort()[liveAsOf.length - 1] : null,
  };
}
