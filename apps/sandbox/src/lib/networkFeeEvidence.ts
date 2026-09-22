/**
 * C.1's conversion-provenance path, now DELEGATING to the adapter layer.
 *
 * ⚑ Stage G moved the construction into `@diboas/defi`
 * (`providers/normalize.ts`), where canon §21 assigns *normalization* and
 * *normalization/conversion provenance*. What remains here is the app-shaped
 * call: the market response supplies the FX rate and its stamp, and this
 * translates that into the shared normalizer's arguments.
 *
 * ⚑ STILL A SIBLING, NOT A REPLACEMENT. `networkFeeLocal` (networkFee.ts) is
 * what `StrategyDetail` and `GoalDetailScreen` render from. A test pins the two
 * to the same arithmetic, which is what keeps a deliberate second derivation
 * from drifting (system gate X1).
 *
 * ⛑ CORRECTED 2026-09-22 (Stage H). This header read *"`networkFeeLocal` …
 * is untouched … so no rendered value moves"*. Both halves are now false and
 * saying so is the point: Stage H added the current-facing age contract to BOTH
 * paths, and under the shipped 66-day fixture it DOES move rendered values —
 * the network-cost row goes absent and entry/exit price as unavailable. That is
 * the `5.309` B2 enforcement, not a regression.
 */

import { enforceCurrentFacingAvailability, networkCostEvidenceFor } from '@diboas/defi';
import type { DataStamp, EvidenceEnvelope, GasQuote, StrategyDef } from '@diboas/defi';

/**
 * The network cost for a strategy's entry chain, expressed in the ledger
 * currency, as evidence — with the conversion's own stamp attached when a
 * conversion happened (`5.225`), and a NAMED refusal when it could not be.
 */
export function networkFeeEvidence(input: {
  gas: GasQuote[];
  strategy: StrategyDef;
  usdPriceLocal: number | null;
  usdPriceStamp: DataStamp | null;
  /** The unit the caller wants the value IN. Identity, not decoration. */
  toCurrency: string;
  /**
   * The CURRENT-FACING reference moment — required for the same reason
   * `networkFeeLocal` requires it: silence must not mean "unenforced".
   */
  now: Date | string;
}): EvidenceEnvelope<number> {
  /**
   * ⛑ STAGE H. Adaptation/normalization (G) builds the envelope; the
   * current-facing age contract (H) is applied here, at the composition layer,
   * because `providers/normalize.ts` is required to read no clock at all — the
   * G/H boundary its own guard test pins.
   *
   * Same derivation as the number path: both reach
   * `isRefusedForCurrentFacingUse`, so a >14-day quote refuses in both, with
   * this path keeping the reason (`REFUSED_BY_CONTRACT`) the number path can
   * only express as `null`.
   */
  return enforceCurrentFacingAvailability(
    networkCostEvidenceFor({
      gas: input.gas,
      strategy: input.strategy,
      toCurrency: input.toCurrency,
      rate: input.usdPriceLocal,
      rateStamp: input.usdPriceStamp,
    }),
    input.now
  );
}
