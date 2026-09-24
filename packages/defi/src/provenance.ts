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

import type { Actionability, Availability, CostCoverage, UnavailableReason } from './evidence';
import type { DataStamp, EvidenceOrigin, ProtocolApy, StrategyDef } from './types';
import { isLiveObservation } from './types';
import { legRequiresCurrentRate } from './catalogueEvidence';

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
/**
 * The fee axis, DECOMPOSED (Founder/Strategy 2026-09-18 §4).
 *
 * It used to be `'none' | 'live' | 'reference' | 'unavailable'` — four values
 * mixing three independent things: whether a fee is rendered at all, what the
 * evidence's ORIGIN is, and whether it is AVAILABLE. Canon §5 forbids that
 * collapse, so each is now its own field and none can be read off another.
 *
 * The mapping is exact, not approximate, and was measured at HEAD before the
 * change: `FIXTURE_STAMP.origin` is `'MODELLED'` and `evidenceStamp` records
 * `'OBSERVED'`, so the old `'reference'` is precisely origin MODELLED and the
 * old `'live'` is precisely origin OBSERVED. Rendering is therefore unchanged.
 *
 * `actionability` is `'REFERENCE'` for every fee this build can produce: a
 * Practice network cost informs, it never authorizes. It is stated explicitly
 * rather than assumed, because the thing canon forbids is inferring it — and
 * an EXECUTABLE fee would come from a Real route quote, which does not exist.
 */
export type FeeEvidence =
  /** This surface renders no fee at all — the picker shows rates only. */
  | { rendered: false }
  | {
      rendered: true;
      availability: Extract<Availability, 'UNAVAILABLE'>;
      reason: UnavailableReason;
      coverage: CostCoverage;
    }
  | {
      rendered: true;
      availability: Extract<Availability, 'AVAILABLE'>;
      actionability: Actionability;
      origin: EvidenceOrigin;
      coverage: CostCoverage;
    };

/** The fee figure's economic coverage: network cost, and nothing bundled in. */
const NETWORK_COST: CostCoverage = { kind: 'single', category: 'network' };

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
  /** The fee axis, derived from the gas stamp alone — decomposed per canon §5. */
  feeEvidence: FeeEvidence;
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
  /**
   * WHICH source the newest live observation came from (`5.440`).
   *
   * The rendered attribution used to be the literal `'DeFiLlama'`, written at
   * the call site. It is now looked up from this id via `sourceLabelOf`, so a
   * substituted provider attributes itself and Product carries no provider
   * name. `null` exactly when `newestLiveAsOf` is null — the two are set
   * together, from the same leg, and a test pins that they cannot disagree.
   */
  newestLiveSource: import('./types').EvidenceSourceId | null;
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
  const liveObservations: DataStamp[] = [];
  for (const leg of strategy.allocation) {
    /**
     * ⛑ `5.444` · THE APY AXIS DESCRIBES ONLY LEGS THAT OWE A RATE.
     *
     * A market / price-return leg's return is its PRICE; no current rate is
     * required of it and none participates in the displayed figure. Counting it
     * here would make the qualifier describe evidence the number does not
     * contain — and the `mixed` copy NAMES these legs ("reference values for:
     * …"), so it would state, in four locales, that a rate was built from
     * something it was not built from. The axis is scoped to the legs the
     * catalogue actually asks for a rate.
     */
    if (!legRequiresCurrentRate(leg.protocolId)) continue;
    const apy = byId.get(leg.protocolId);
    /**
     * `5.440` · LIVENESS IS A PROPERTY OF THE STAMP, NEVER THE PROVIDER'S NAME.
     *
     * This read `apy?.stamp.source === 'defillama'`. Substituting the provider
     * would have pushed every leg into `fixtureProtocolIds` and rendered a
     * cleared source's live rates as "reference values" — failing OPEN into a
     * false honesty claim on a pre-commit money surface. `isLiveObservation`
     * asks what the stamp actually says (OBSERVED, not a stand-in), so a newly
     * cleared source is live the day it arrives with no edit here.
     */
    if (apy && isLiveObservation(apy.stamp)) liveObservations.push(apy.stamp);
    else fixtureProtocolIds.push(leg.protocolId);
  }
  /**
   * THE APY AXIS — legs only (`5.402`). This is what the rate label must read.
   * Nothing about gas appears in it, by construction.
   */
  const allApysLive = fixtureProtocolIds.length === 0;
  const apyProvenance: ProvenanceState = allApysLive
    ? 'live'
    : liveObservations.length === 0
      ? 'fixture'
      : 'mixed';

  /**
   * THE FEE AXIS — the gas stamp only (Finding 1), now on independent axes.
   *
   * ORIGIN comes from the stamp itself, never from the source id: canon's
   * `EXTERNAL SOURCE ≠ OBSERVED` means a provider-sourced value can be MODELLED
   * and a fixture is MODELLED by construction. Reading `stamp.origin` is what
   * makes that true here rather than merely intended.
   */
  /* ONE leg wins both fields, so they can never disagree. */
  const newestLive = liveObservations.reduce<DataStamp | null>(
    (best, stamp) => (best === null || stamp.asOf > best.asOf ? stamp : best),
    null
  );

  const feeEvidence: FeeEvidence =
    gasStamp === undefined
      ? { rendered: false }
      : gasStamp === 'missing'
        ? {
            rendered: true,
            availability: 'UNAVAILABLE',
            reason: 'NO_OBSERVATION',
            coverage: NETWORK_COST,
          }
        : {
            rendered: true,
            availability: 'AVAILABLE',
            /* Practice network cost informs; it never authorizes. Stated, not inferred. */
            actionability: 'REFERENCE',
            origin: gasStamp.origin,
            coverage: NETWORK_COST,
          };

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
  /* Identical condition to the pre-decomposition `'reference' || 'unavailable'`,
     now expressed on the axes: a modelled fee or an absent one weakens the
     overall claim; an observed one does not. */
  const feeWeakens =
    feeEvidence.rendered &&
    (feeEvidence.availability === 'UNAVAILABLE' || feeEvidence.origin !== 'OBSERVED');
  const state: ProvenanceState = apyProvenance === 'live' && feeWeakens ? 'mixed' : apyProvenance;
  return {
    state,
    apyProvenance,
    feeEvidence,
    fixtureProtocolIds,
    // Index access, not `.at(-1)`: the domain packages target ES2020 by
    // config, and `.at` is ES2022 (the workspace type-check catches it even
    // though vitest/tsup strip types without checking).
    /* Newest by RETRIEVAL time, and the source id travels WITH it: picking the
       timestamp from one leg and the name from another is exactly the kind of
       split that let "Live from DeFiLlama" sit above a fixture fee (GAS-1). */
    newestLiveAsOf: newestLive?.asOf ?? null,
    newestLiveSource: newestLive?.source ?? null,
  };
}
