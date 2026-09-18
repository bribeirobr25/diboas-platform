import { describe, expect, it } from 'vitest';
import {
  CURRENT_CATALOG_PROTOCOL_NETWORK,
  STRATEGY_CATALOG,
  candidateNetworks,
  getStrategy,
  horizonBandForMonths,
  isMultiNetworkCandidate,
  strategiesForHorizon,
} from '../catalog';
import { POOL_MATCHERS } from '../providers/defillama';
import { FIXTURE_APYS } from '../fixtures';
import { PROTOCOL_RETURN_MODEL } from '../types';

describe('STRATEGY_CATALOG (data invariants — D-8 catalog-as-data)', () => {
  it('should carry 10 strategies with unique ids', () => {
    expect(STRATEGY_CATALOG).toHaveLength(10);
    const ids = new Set(STRATEGY_CATALOG.map((s) => s.id));
    expect(ids.size).toBe(10);
  });

  it('should have every allocation summing to exactly 100 percent', () => {
    for (const s of STRATEGY_CATALOG) {
      const sum = s.allocation.reduce((acc, leg) => acc + leg.weightPercent, 0);
      expect(sum, `allocation of ${s.id}`).toBe(100);
    }
  });

  it('should mark stable strategies with zero growth exposure and growth strategies with more', () => {
    for (const s of STRATEGY_CATALOG) {
      if (s.riskBand === 'stable') expect(s.growthExposurePercent, s.id).toBe(0);
      else expect(s.growthExposurePercent, s.id).toBeGreaterThan(0);
    }
  });

  it('should never expose a recommendation field (guidance-without-advising, R-3)', () => {
    for (const s of STRATEGY_CATALOG) {
      expect(s).not.toHaveProperty('recommended');
      expect(s).not.toHaveProperty('default');
      expect(s).not.toHaveProperty('score');
    }
  });
});

describe('strategiesForHorizon (the objective filter)', () => {
  it('should return every matching strategy in stable catalog order with no reordering', () => {
    const short = strategiesForHorizon('short');
    const idsInCatalogOrder = STRATEGY_CATALOG.filter((s) => short.includes(s)).map((s) => s.id);
    expect(short.map((s) => s.id)).toEqual(idsInCatalogOrder);
  });

  it('should include anytime strategies in every band', () => {
    for (const band of ['short', 'medium', 'long', 'wealth'] as const) {
      const ids = strategiesForHorizon(band).map((s) => s.id);
      expect(ids, band).toContain('safeHarbor');
    }
  });

  it('should return EXACTLY two stable and two growth options per band (E11 — the F6 disclosure is a shipped regulatory claim, so the guard is exactly as strong as the claim)', () => {
    for (const band of ['short', 'medium', 'long', 'wealth'] as const) {
      const list = strategiesForHorizon(band);
      expect(list, band).toHaveLength(4);
      expect(
        list.filter((s) => s.riskBand === 'stable'),
        band
      ).toHaveLength(2);
      expect(
        list.filter((s) => s.riskBand === 'growth'),
        band
      ).toHaveLength(2);
    }
  });
});

describe('horizonBandForMonths', () => {
  it('should map month counts to the copy’s own bands', () => {
    expect(horizonBandForMonths(6)).toBe('short');
    expect(horizonBandForMonths(23)).toBe('short');
    expect(horizonBandForMonths(24)).toBe('medium');
    expect(horizonBandForMonths(59)).toBe('medium');
    expect(horizonBandForMonths(60)).toBe('long');
    expect(horizonBandForMonths(119)).toBe('long');
    expect(horizonBandForMonths(120)).toBe('wealth');
  });
});

describe('getStrategy', () => {
  it('should resolve known ids and reject unknown ones', () => {
    expect(getStrategy('safeHarbor')?.id).toBe('safeHarbor');
    expect(getStrategy('nope')).toBeUndefined();
  });
});

describe('allocation invariants (the replay depends on these)', () => {
  it('should allocate exactly 100% in every strategy', () => {
    // `replayLegged` computes earnings as Σ(share × Π factors) − principal, so
    // it assumes the shares reconstitute the whole principal. Weights summing
    // to 90 in a FLAT market report a 10% LOSS — silent, and always in the
    // same direction. Verified: 90% flat on 1,000 returns −100.
    for (const strategy of STRATEGY_CATALOG) {
      const sum = strategy.allocation.reduce((total, leg) => total + leg.weightPercent, 0);
      expect(sum, strategy.id).toBe(100);
    }
  });

  it('should give every allocated protocol a declared return model', () => {
    // A protocol with no model would throw at replay time rather than at
    // build time; PROTOCOL_RETURN_MODEL is a Record<ProtocolId,…> so this is
    // belt-and-braces on the catalogue side.
    for (const strategy of STRATEGY_CATALOG) {
      for (const leg of strategy.allocation) {
        expect(
          PROTOCOL_RETURN_MODEL[leg.protocolId],
          `${strategy.id}/${leg.protocolId}`
        ).toBeDefined();
      }
    }
  });
});

/**
 * `5.406` · network identity, and the classification the containment turns on.
 *
 * Founder/Strategy 2026-09-17 §7: *"Prove the classification across all ten
 * current strategies: 5 single-network, 5 multi-network, and prove the
 * containment affects only the class that requires it."*
 */
describe('5.406 — Product-owned network identity per leg', () => {
  it('should declare a network for every protocol the catalogue actually uses', () => {
    for (const strategy of STRATEGY_CATALOG) {
      for (const leg of strategy.allocation) {
        expect(
          CURRENT_CATALOG_PROTOCOL_NETWORK[leg.protocolId],
          `${strategy.id}/${leg.protocolId}`
        ).toBeDefined();
      }
    }
  });

  /**
   * This is what makes `CURRENT_CATALOG_PROTOCOL_NETWORK` a TRANSCRIPTION and not an invention:
   * the same fact was already declared twice — as provider search config and as
   * fixture data — and all three must agree. Asserted in BOTH directions so
   * neither side can drift silently; if Product ever moves a leg's network, all
   * three change together or this fails.
   */
  it('should agree with both pre-existing declarations, in both directions', () => {
    for (const [protocolId, network] of Object.entries(CURRENT_CATALOG_PROTOCOL_NETWORK)) {
      const id = protocolId as keyof typeof CURRENT_CATALOG_PROTOCOL_NETWORK;
      expect(POOL_MATCHERS[id].preferredChains[0], `${id} preferredChains[0]`).toBe(network);
      expect(FIXTURE_APYS[id].chain, `${id} fixture chain`).toBe(network);
    }
    // …and nothing is declared in the matchers that identity does not know.
    for (const id of Object.keys(POOL_MATCHERS)) {
      expect(
        CURRENT_CATALOG_PROTOCOL_NETWORK[id as keyof typeof CURRENT_CATALOG_PROTOCOL_NETWORK],
        id
      ).toBeDefined();
    }
  });

  it('should classify EXACTLY five single-network and five multi-network strategies', () => {
    const multi = STRATEGY_CATALOG.filter(isMultiNetworkCandidate).map((s) => s.id);
    const single = STRATEGY_CATALOG.filter((s) => !isMultiNetworkCandidate(s)).map((s) => s.id);
    expect(multi.sort()).toEqual(
      [
        'balancedBuilder',
        'fullThrottle',
        'stableGrowth',
        'steadyProgress',
        'wealthAccelerator',
      ].sort()
    );
    expect(single.sort()).toEqual(
      ['fullHarvest', 'goalKeeper', 'patientBuilder', 'safeHarbor', 'steadyCompounder'].sort()
    );
    expect(multi).toHaveLength(5);
    expect(single).toHaveLength(5);
  });

  it('should show every multi-network strategy declares an entryChain it does not fully run on', () => {
    /* The mechanism, not just the count: each of the five declares
       `entryChain: 'Solana'` while holding `skySsr`, an ARBITRUM lending leg, at
       a material share of allocation. That share is what the single-chain fee
       was silently omitting. */
    for (const strategy of STRATEGY_CATALOG.filter(isMultiNetworkCandidate)) {
      const offEntry = strategy.allocation
        .filter((leg) => CURRENT_CATALOG_PROTOCOL_NETWORK[leg.protocolId] !== strategy.entryChain)
        .reduce((sum, leg) => sum + leg.weightPercent, 0);
      expect(offEntry, `${strategy.id} weight off entryChain`).toBeGreaterThan(0);
      expect(candidateNetworks(strategy).length, strategy.id).toBe(2);
    }
  });

  it('should leave every single-network strategy fully on its declared entryChain (§7)', () => {
    for (const strategy of STRATEGY_CATALOG.filter((s) => !isMultiNetworkCandidate(s))) {
      expect(candidateNetworks(strategy), strategy.id).toEqual([strategy.entryChain]);
    }
  });
});
