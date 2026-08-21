import { describe, expect, it } from 'vitest';
import {
  STRATEGY_CATALOG,
  getStrategy,
  horizonBandForMonths,
  strategiesForHorizon,
} from '../catalog';
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
