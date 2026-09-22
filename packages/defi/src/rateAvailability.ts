/**
 * Is a strategy's CURRENT rate knowable right now?
 *
 * `5.436`, Product ruling 2026-09-22. The rate half of the `5.309` age contract
 * — the half Stage H had to stop at until Product and Brand supplied the
 * semantics and the words.
 *
 * ⚑ NO SECOND FRESHNESS RULE LIVES HERE. This composes
 * `isRefusedForCurrentFacingUse`, the same single derivation of the `>14 days`
 * rule the network-cost path uses. There is no APY-specific algorithm, no
 * second `>14` comparison, no alternate stale/fallback policy: change the
 * policy in `freshnessPolicy.ts` and both paths move together, which is the
 * point of H being generic (system gate X1).
 *
 * ⚑ ALL-OR-NOTHING PER STRATEGY, and deliberately so. A blended rate is only as
 * knowable as its least knowable leg — a 50/30/20 blend where the 50% leg is
 * unknowable is not "80% of a rate", it is not a rate. This is the same
 * all-or-nothing posture `I-G1d` took for replay history (Strategy/M&E §7).
 *
 * ⚑ A MISSING LEG IS NOT A ZERO LEG. `blendedApy` reads `apyPercent ?? 0`, so a
 * leg absent from the array contributes 0 and quietly drags the blend down —
 * `MISSING != 0` at the blend, the same defect class `AUD-F05` recorded for the
 * network fee. This predicate refuses that case too (`NO_OBSERVATION`), which
 * is what keeps the display off that path rather than merely hoping the array
 * is complete.
 *
 * ⚑ STALE IS NOT UNAVAILABLE. Nothing here widens the `>7 <=14` band: a STALE
 * rate resolves AVAILABLE and keeps rendering under bounded reference use. Only
 * evidence the applicable policy has actually pushed to current-facing
 * UNAVAILABLE is refused.
 *
 * ⚑ CURRENT-FACING ONLY. Historical replay keeps the evidence belonging to its
 * own moment and never reaches this function (ruling §5 / §10).
 */

import { isRefusedForCurrentFacingUse } from './currentFacing';
import type { UnavailableReason } from './evidence';
import type { ProtocolApy, StrategyDef } from './types';

/**
 * Whether a strategy's current blended rate may be stated, and why not when it
 * may not.
 *
 * Deliberately NOT an `EvidenceEnvelope`: the envelope carries a VALUE, and
 * this answers a question about whether a value may be shown at all. Blending
 * needs Decimal, which `@diboas/defi` does not depend on and must not start
 * depending on for a predicate — so the arithmetic stays where it already is
 * and only the judgement moves here.
 */
export type RateAvailability =
  { available: true } | { available: false; reason: UnavailableReason };

const AVAILABLE: RateAvailability = { available: true };

/**
 * The current-facing rate availability for one strategy.
 *
 * Every allocation leg must be present AND inside the acceptable current-facing
 * vintage. The first leg that fails decides, and names why.
 */
export function strategyRateAvailability(
  strategy: StrategyDef,
  apys: ProtocolApy[],
  /** The current-facing reference moment. Required — silence must not mean "unenforced". */
  now: Date | string
): RateAvailability {
  const byId = new Map(apys.map((a) => [a.protocolId, a]));
  for (const leg of strategy.allocation) {
    const observation = byId.get(leg.protocolId);
    if (!observation) return { available: false, reason: 'NO_OBSERVATION' };
    if (isRefusedForCurrentFacingUse(observation.stamp, now)) {
      return { available: false, reason: 'REFUSED_BY_CONTRACT' };
    }
  }
  return AVAILABLE;
}
