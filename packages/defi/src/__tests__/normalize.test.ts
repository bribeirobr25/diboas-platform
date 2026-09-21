import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FIXTURE_STAMP } from '../fixtures';
import { getStrategy } from '../catalog';
import {
  NETWORK_COST_NATIVE_UNIT,
  networkCostEvidence,
  networkCostEvidenceFor,
} from '../providers/normalize';
import { evidenceStamp } from '../types';
import type { GasQuote, StrategyDef } from '../types';

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

function strategy(id: 'safeHarbor' | 'fullThrottle'): StrategyDef {
  const found = getStrategy(id);
  if (!found) throw new Error(`catalogue no longer contains ${id}`);
  return found;
}

const single = strategy('safeHarbor');
const multi = strategy('fullThrottle');
const entry = () => single.entryChain as 'Arbitrum' | 'Solana';

/**
 * Stage G · adapter-layer normalization.
 *
 * The requirement under test is canon §21's assignment of *normalization*,
 * *cost-category truth* and *conversion provenance* to the adapter layer — and,
 * just as load-bearing, what this layer must NOT do: decide origin, evaluate
 * freshness, or take an availability policy decision that belongs to H.
 */
describe('network-cost normalization — provenance travels, origin is never invented', () => {
  it('should pass the source stamp through UNCHANGED', () => {
    const e = networkCostEvidence(gas('Arbitrum', 0.03));
    if (e.availability !== 'AVAILABLE') throw new Error('expected AVAILABLE');
    /* Identity, not equality: re-attribution would be a new object. */
    expect(e.stamp).toBe(FIXTURE_STAMP);
    expect(e.stamp.origin).toBe('MODELLED');
  });

  it('should NEVER promote a source reading to OBSERVED', () => {
    const e = networkCostEvidence(gas('Solana', 0.001));
    expect(JSON.stringify(e)).not.toContain('OBSERVED');
  });

  it('should state converted:false for a native-unit value rather than omitting it', () => {
    const e = networkCostEvidence(gas('Arbitrum', 0.03));
    if (e.availability !== 'AVAILABLE') throw new Error('expected AVAILABLE');
    expect(e.normalization).toEqual({ converted: false });
    expect(e.actionability).toBe('REFERENCE');
  });

  it('should claim exactly ONE cost category, never an aggregate', () => {
    const e = networkCostEvidence(gas('Arbitrum', 0.03));
    if (e.availability !== 'AVAILABLE') throw new Error('expected AVAILABLE');
    expect(e.coverage).toEqual({ kind: 'single', category: 'network' });
  });

  it('should attach the RATE stamp to a converted value, beside the base stamp', () => {
    const e = networkCostEvidenceFor({
      gas: [gas(entry(), 0.03)],
      strategy: single,
      toCurrency: 'EUR',
      rate: 0.92,
      rateStamp: RATE_STAMP,
    });
    if (e.availability !== 'AVAILABLE') throw new Error('expected AVAILABLE');
    expect(e.normalization).toEqual({
      converted: true,
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rateStamp: RATE_STAMP,
    });
    /* Two inputs, two vintages: the base keeps its OWN stamp. */
    expect(e.stamp).toBe(FIXTURE_STAMP);
    expect(e.value).toBeCloseTo(0.03 * 0.92, 12);
  });

  it('should not claim a conversion when the requested unit IS the native one', () => {
    const e = networkCostEvidenceFor({
      gas: [gas(entry(), 0.03)],
      strategy: single,
      toCurrency: NETWORK_COST_NATIVE_UNIT,
      rate: 1,
      rateStamp: RATE_STAMP,
    });
    if (e.availability !== 'AVAILABLE') throw new Error('expected AVAILABLE');
    expect(e.normalization).toEqual({ converted: false });
  });
});

describe('network-cost normalization — three NAMED refusals, never a zero', () => {
  it('should refuse a multi-network Candidate as NOT_REPRESENTABLE', () => {
    expect(
      networkCostEvidenceFor({
        gas: [gas('Arbitrum', 0.03), gas('Solana', 0.001)],
        strategy: multi,
        toCurrency: 'USD',
        rate: 1,
        rateStamp: RATE_STAMP,
      })
    ).toEqual({
      availability: 'UNAVAILABLE',
      reason: 'NOT_REPRESENTABLE',
      coverage: { kind: 'single', category: 'network' },
    });
  });

  it('should refuse a missing quote as NO_OBSERVATION', () => {
    expect(
      networkCostEvidenceFor({
        gas: [],
        strategy: single,
        toCurrency: 'USD',
        rate: 1,
        rateStamp: RATE_STAMP,
      })
    ).toMatchObject({ availability: 'UNAVAILABLE', reason: 'NO_OBSERVATION' });
  });

  it('should refuse a missing rate as NO_CONVERSION, carrying no value at all', () => {
    for (const missing of [
      { rate: null, rateStamp: RATE_STAMP },
      { rate: 0.92, rateStamp: null },
    ]) {
      const e = networkCostEvidenceFor({
        gas: [gas(entry(), 0.03)],
        strategy: single,
        toCurrency: 'EUR',
        ...missing,
      });
      expect(e).toMatchObject({ availability: 'UNAVAILABLE', reason: 'NO_CONVERSION' });
      expect(JSON.stringify(e)).not.toContain('"value"');
    }
  });
});

describe('network-cost normalization — what this layer must NOT do (G/H boundary)', () => {
  it('should read no clock and compute no freshness', () => {
    const src = readFileSync(new URL('../providers/normalize.ts', import.meta.url), 'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    for (const forbidden of ['Date.now', 'dataFreshness', 'TimeState', 'STALE', 'DELAYED']) {
      expect(code, `${forbidden} would put H's judgement in G's layer`).not.toContain(forbidden);
    }
  });

  it('should take no mode, scope or journey-state argument', () => {
    const src = readFileSync(new URL('../providers/normalize.ts', import.meta.url), 'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    for (const forbidden of ['LedgerScope', 'practice', 'Practice', 'journey']) {
      expect(code).not.toContain(forbidden);
    }
  });

  it("should build only REFERENCE evidence — executability is not this layer's to grant", () => {
    const e = networkCostEvidence(gas('Arbitrum', 0.03));
    if (e.availability !== 'AVAILABLE') throw new Error('expected AVAILABLE');
    expect(e.actionability).toBe('REFERENCE');
    expect(e).not.toHaveProperty('validity');
    expect(e).not.toHaveProperty('identity');
  });
});
