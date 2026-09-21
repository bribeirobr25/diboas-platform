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
 * untouched and is what `StrategyDetail` and `GoalDetailScreen` render from, so
 * no rendered value moves. A test pins the two to the same arithmetic, which is
 * what keeps a deliberate second derivation from drifting (system gate X1).
 */

import { networkCostEvidenceFor } from '@diboas/defi';
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
}): EvidenceEnvelope<number> {
  return networkCostEvidenceFor({
    gas: input.gas,
    strategy: input.strategy,
    toCurrency: input.toCurrency,
    rate: input.usdPriceLocal,
    rateStamp: input.usdPriceStamp,
  });
}
