/**
 * ADAPTER-LAYER NORMALIZATION — a source's reading becomes shared evidence here.
 *
 * Canon §21 assigns *source/provider adaptation · normalization · cost-category
 * truth · normalization/conversion provenance* to **G**. Until now this work sat
 * in the APP composition layer: `lib/evidence/ingest.ts` hand-built the envelope
 * for a gas quote, and `lib/networkFeeEvidence.ts` attached the conversion. Both
 * were correct and both were in the wrong layer — which meant every future
 * consumer would have had to repeat them, and the two could drift.
 *
 * ⚑ WHAT THIS MODULE DOES NOT DO, deliberately:
 *
 * - **No freshness.** Nothing here reads a clock or compares an age. `asOf` and
 *   `observedAt` are carried as FACTS; `CURRENT / DELAYED / STALE / MISSING` is
 *   H's evaluation and is not computed, stored or implied here.
 * - **No availability policy.** A refusal here means the evidence cannot be
 *   TRUTHFULLY CONSTRUCTED (no observation, no conversion rate, no representable
 *   subject) — never "this is too old to use", which is H's judgement.
 * - **No actionability by journey state.** Everything this module can build is
 *   `REFERENCE`, because a reference reading is all any current source supplies.
 * - **No origin invention.** The source's own stamp travels through untouched:
 *   a fixture stays MODELLED, a provider reading stays what the provider's
 *   adapter declared. `EXTERNAL SOURCE ≠ OBSERVED` is preserved by NOT deciding
 *   origin here at all.
 */

import { referenceEvidence, unavailableEvidence, type EvidenceEnvelope } from '../evidence';
import { isMultiNetworkCandidate } from '../catalog';
import type { Chain, DataStamp, GasQuote, StrategyDef } from '../types';

/** Network cost is one economic category, with nothing bundled into it. */
const NETWORK_COST: { kind: 'single'; category: 'network' } = {
  kind: 'single',
  category: 'network',
};

/** The unit a gas quote is natively expressed in. Identity, not decoration. */
export const NETWORK_COST_NATIVE_UNIT = 'USD';

/**
 * A chain's network cost, in its native unit, as shared evidence.
 *
 * The quote's own stamp is passed through unchanged — this is adaptation, not
 * re-attribution. `converted: false` is stated rather than omitted, because a
 * value in its native unit has made no conversion and must say so.
 */
export function networkCostEvidence(quote: GasQuote): EvidenceEnvelope<number> {
  return referenceEvidence({
    value: quote.typicalFeeUsd,
    stamp: quote.stamp,
    normalization: { converted: false },
    coverage: NETWORK_COST,
  });
}

/**
 * The network cost for a strategy's entry chain, in the requested unit.
 *
 * Three refusals, each NAMED — where a bare number collapses all of them into
 * `null` and invites a caller to substitute zero:
 *
 * - `NOT_REPRESENTABLE` — a multi-network Candidate has no truthful
 *   whole-Candidate network cost (`5.406`). Never summed, never modelled.
 * - `NO_OBSERVATION` — no quote for that chain.
 * - `NO_CONVERSION` — no rate, so the value in the requested unit is unknown.
 *
 * When a conversion happens the rate's OWN stamp travels with the converted
 * number, so the two can never be separated again (`5.225`). Nothing here
 * decides WHICH rate source is acceptable, or how old a rate may be — those are
 * provider selection and H.
 */
export function networkCostEvidenceFor(input: {
  gas: GasQuote[];
  strategy: StrategyDef;
  toCurrency: string;
  rate: number | null;
  rateStamp: DataStamp | null;
}): EvidenceEnvelope<number> {
  if (isMultiNetworkCandidate(input.strategy)) {
    return unavailableEvidence('NOT_REPRESENTABLE', NETWORK_COST);
  }
  const quote = input.gas.find((g) => g.chain === (input.strategy.entryChain as Chain));
  if (!quote) return unavailableEvidence('NO_OBSERVATION', NETWORK_COST);
  if (input.toCurrency === NETWORK_COST_NATIVE_UNIT) return networkCostEvidence(quote);

  /* Two independent inputs, each with its own source and vintage: the network
     cost OBSERVATION and the rate. Either missing makes the result unknown —
     never zero, never carried forward from something else. */
  if (input.rate === null || input.rateStamp === null) {
    return unavailableEvidence('NO_CONVERSION', NETWORK_COST);
  }
  return referenceEvidence({
    value: quote.typicalFeeUsd * input.rate,
    stamp: quote.stamp,
    normalization: {
      converted: true,
      fromCurrency: NETWORK_COST_NATIVE_UNIT,
      toCurrency: input.toCurrency,
      rateStamp: input.rateStamp,
    },
    coverage: NETWORK_COST,
  });
}
