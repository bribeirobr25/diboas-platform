import { describe, expect, it } from 'vitest';
import { FIXTURE_STAMP, evidenceStamp, getStrategy, type GasQuote } from '@diboas/defi';
import { networkFeeLocal } from '../networkFee';
import { networkFeeEvidence } from '../networkFeeEvidence';

/** ⛑ Stage H: the explicit current-facing moment, two days after FIXTURE_STAMP. */
const NOW = '2026-07-20T00:00:00.000Z';

const RATE_STAMP = evidenceStamp({
  source: 'coingecko',
  origin: 'OBSERVED',
  asOf: '2026-09-21T00:00:00.000Z',
});

const gas = (chain: 'Arbitrum' | 'Solana', fee: number): GasQuote => ({
  chain,
  typicalFeeUsd: fee,
  stamp: FIXTURE_STAMP,
});

/** A single-network strategy and a multi-network one, taken from the catalogue. */
function strategy(id: 'safeHarbor' | 'fullThrottle') {
  const found = getStrategy(id);
  /* Checked, not cast: if the catalogue ever stops carrying one of these, the
     failure should be this sentence and not a confusing downstream null. */
  if (!found) throw new Error(`catalogue no longer contains ${id}`);
  return found;
}

const singleNetwork = strategy('safeHarbor');
const multiNetwork = strategy('fullThrottle');

/**
 * C.1 — the conversion carries its own provenance.
 *
 * The requirement (`5.225`): a converted number and the vintage of the rate
 * that produced it must not be separable. `networkFeeLocal` returns a bare
 * number and is deliberately unchanged; this is the evidence-shaped sibling.
 */
describe('networkFeeEvidence — conversion provenance is attached to the converted value', () => {
  it('should carry the rate stamp on a converted value', () => {
    const evidence = networkFeeEvidence({
      gas: [gas(singleNetwork.entryChain as 'Arbitrum' | 'Solana', 0.03)],
      strategy: singleNetwork,
      usdPriceLocal: 0.92,
      usdPriceStamp: RATE_STAMP,
      toCurrency: 'EUR',
      now: NOW,
    });
    if (evidence.availability !== 'AVAILABLE') throw new Error('expected AVAILABLE');
    expect(evidence.normalization).toEqual({
      converted: true,
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rateStamp: RATE_STAMP,
    });
    /* The base observation keeps its OWN stamp: two inputs, two vintages. */
    expect(evidence.stamp).toBe(FIXTURE_STAMP);
  });

  it('should claim NO conversion when the value is already in its native unit', () => {
    const evidence = networkFeeEvidence({
      gas: [gas(singleNetwork.entryChain as 'Arbitrum' | 'Solana', 0.03)],
      strategy: singleNetwork,
      usdPriceLocal: 1,
      usdPriceStamp: RATE_STAMP,
      toCurrency: 'USD',
      now: NOW,
    });
    if (evidence.availability !== 'AVAILABLE') throw new Error('expected AVAILABLE');
    expect(evidence.normalization).toEqual({ converted: false });
    expect(evidence.value).toBe(0.03);
  });

  it('should agree with the number-returning sibling on the converted amount', () => {
    const quotes = [gas(singleNetwork.entryChain as 'Arbitrum' | 'Solana', 0.03)];
    const evidence = networkFeeEvidence({
      gas: quotes,
      strategy: singleNetwork,
      usdPriceLocal: 0.92,
      usdPriceStamp: RATE_STAMP,
      toCurrency: 'EUR',
      now: NOW,
    });
    if (evidence.availability !== 'AVAILABLE') throw new Error('expected AVAILABLE');
    /* One fact, one arithmetic: the evidence path must not become a second
       derivation that is free to drift from what Product renders (X1). */
    expect(evidence.value).toBe(networkFeeLocal(quotes, singleNetwork, 0.92, NOW));
  });
});

describe('networkFeeEvidence — the three refusals the number path collapses into null', () => {
  it('should refuse a multi-network Candidate as NOT_REPRESENTABLE', () => {
    const evidence = networkFeeEvidence({
      gas: [gas('Arbitrum', 0.03), gas('Solana', 0.001)],
      strategy: multiNetwork,
      usdPriceLocal: 1,
      usdPriceStamp: RATE_STAMP,
      toCurrency: 'USD',
      now: NOW,
    });
    expect(evidence).toEqual({
      availability: 'UNAVAILABLE',
      reason: 'NOT_REPRESENTABLE',
      coverage: { kind: 'single', category: 'network' },
    });
    /* And the number path still refuses too — behaviour is unchanged. */
    expect(networkFeeLocal([gas('Arbitrum', 0.03)], multiNetwork, 1, NOW)).toBeNull();
  });

  it('should refuse a missing gas quote as NO_OBSERVATION', () => {
    const evidence = networkFeeEvidence({
      gas: [],
      strategy: singleNetwork,
      usdPriceLocal: 1,
      usdPriceStamp: RATE_STAMP,
      toCurrency: 'USD',
      now: NOW,
    });
    expect(evidence).toMatchObject({ availability: 'UNAVAILABLE', reason: 'NO_OBSERVATION' });
  });

  it('should refuse a missing FX rate as NO_CONVERSION — never as zero', () => {
    for (const missing of [
      { usdPriceLocal: null, usdPriceStamp: RATE_STAMP },
      { usdPriceLocal: 0.92, usdPriceStamp: null },
    ]) {
      const evidence = networkFeeEvidence({
        gas: [gas(singleNetwork.entryChain as 'Arbitrum' | 'Solana', 0.03)],
        strategy: singleNetwork,
        toCurrency: 'EUR',
        now: NOW,
        ...missing,
      });
      expect(evidence).toMatchObject({ availability: 'UNAVAILABLE', reason: 'NO_CONVERSION' });
      expect(JSON.stringify(evidence)).not.toContain('"value"');
    }
  });
});
