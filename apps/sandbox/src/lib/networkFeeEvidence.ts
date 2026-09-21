/**
 * C.1 — the CONVERSION carries its own provenance.
 *
 * `networkFeeLocal` (networkFee.ts) multiplies a USD network cost by an FX rate
 * and returns a bare number; the rate's stamp exists and is carried route ->
 * client as `MarketData.usdPriceStamp`, but nothing associates it with the
 * product of that multiplication (`5.225`). The typed `Normalization` contract
 * already represents the association — this is the wiring that uses it.
 *
 * ⚑ A SIBLING, NOT A REPLACEMENT. `networkFeeLocal` is deliberately untouched
 * and keeps its exact behaviour, because `StrategyDetail` and
 * `GoalDetailScreen` render from it and F-A changes no rendered value. This
 * function is the evidence-shaped path; F-B is where a Product surface adopts it.
 *
 * ⚑ NO PROVIDER POLICY MOVES FROM G INTO F. Nothing here decides which source
 * an FX rate comes from, how stale it may be, or whether it may be used. It
 * carries provenance that already exists — the conversion's own stamp — and
 * refuses when an input is absent.
 *
 * The three refusals are DISTINCT and named, where the number-returning sibling
 * collapses all of them into `null`:
 *   NOT_REPRESENTABLE  a multi-network Candidate has no truthful whole-Candidate
 *                      network cost (`5.406`) — never summed, never modelled.
 *   NO_OBSERVATION     no gas quote for the strategy's entry chain.
 *   NO_CONVERSION      no FX rate, so the local-currency value is unknown.
 */

import {
  isMultiNetworkCandidate,
  referenceEvidence,
  unavailableEvidence,
  type DataStamp,
  type EvidenceEnvelope,
  type GasQuote,
  type StrategyDef,
} from '@diboas/defi';

const NETWORK_COST: { kind: 'single'; category: 'network' } = {
  kind: 'single',
  category: 'network',
};

/**
 * The network cost for a strategy's entry chain, expressed in the ledger
 * currency, as evidence.
 *
 * When a conversion happens the returned envelope carries
 * `{ converted: true, fromCurrency, toCurrency, rateStamp }` — so the converted
 * number and the vintage of the rate that produced it can never be separated
 * again. When nothing is converted it carries `{ converted: false }`, which is
 * the honest statement for a native-unit value.
 */
export function networkFeeEvidence(input: {
  gas: GasQuote[];
  strategy: StrategyDef;
  usdPriceLocal: number | null;
  usdPriceStamp: DataStamp | null;
  /** The unit the caller wants the value IN. Identity, not decoration. */
  toCurrency: string;
}): EvidenceEnvelope<number> {
  if (isMultiNetworkCandidate(input.strategy)) {
    return unavailableEvidence('NOT_REPRESENTABLE', NETWORK_COST);
  }
  const quote = input.gas.find((g) => g.chain === input.strategy.entryChain);
  if (!quote) return unavailableEvidence('NO_OBSERVATION', NETWORK_COST);

  /* Native unit: no conversion happened, so none is claimed. */
  if (input.toCurrency === 'USD') {
    return referenceEvidence({
      value: quote.typicalFeeUsd,
      stamp: quote.stamp,
      normalization: { converted: false },
      coverage: NETWORK_COST,
    });
  }

  /* Two independent inputs, each with its own source and vintage: the network
     cost OBSERVATION and the FX CONVERSION. Either missing makes the result
     unknown — never zero, never carried forward from something else. */
  if (input.usdPriceLocal === null || input.usdPriceStamp === null) {
    return unavailableEvidence('NO_CONVERSION', NETWORK_COST);
  }
  return referenceEvidence({
    value: quote.typicalFeeUsd * input.usdPriceLocal,
    stamp: quote.stamp,
    normalization: {
      converted: true,
      fromCurrency: 'USD',
      toCurrency: input.toCurrency,
      rateStamp: input.usdPriceStamp,
    },
    coverage: NETWORK_COST,
  });
}
