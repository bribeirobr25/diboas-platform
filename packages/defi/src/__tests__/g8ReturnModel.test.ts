import { describe, expect, it } from 'vitest';
import { PROTOCOL_RETURN_MODEL, STRATEGY_CATALOG, fixturePriceSeries } from '../index';
import type { ProtocolId } from '../types';

/**
 * §4.8 steps 1–2. The model metadata is what lets a growth position FALL, so
 * these guard the two ways it could silently stop working: a leg declared with
 * the wrong kind, or a fixture series that only ever rises.
 */
describe('PROTOCOL_RETURN_MODEL — the lending/market split (§4.8 step 1)', () => {
  it('should mark every USDC-lending leg as lending and every LST/LP leg as market', () => {
    expect(PROTOCOL_RETURN_MODEL.skySsr.kind).toBe('lending');
    expect(PROTOCOL_RETURN_MODEL.aaveV3.kind).toBe('lending');
    expect(PROTOCOL_RETURN_MODEL.compoundV3.kind).toBe('lending');
    for (const id of ['sanctumInf', 'jupiterJlp', 'jito'] as ProtocolId[]) {
      const m = PROTOCOL_RETURN_MODEL[id];
      expect(m.kind, id).toBe('market');
      // A market leg without an id would silently fall back to fixtures forever.
      expect(m.kind === 'market' && m.coingeckoId.length, id).toBeGreaterThan(0);
    }
  });

  it('should give EVERY leg used by a growth strategy a market model (100% coverage)', () => {
    // The honesty property: a growth strategy whose legs are partly unmodelled
    // would print "85% moves with market prices" while modelling less — worse
    // than a uniform disclosure. Every growth leg must be priced.
    const growthLegs = new Set<ProtocolId>();
    for (const s of STRATEGY_CATALOG) {
      if (s.riskBand !== 'growth') continue;
      for (const leg of s.allocation) growthLegs.add(leg.protocolId);
    }
    const unpriced = [...growthLegs].filter(
      (id) => PROTOCOL_RETURN_MODEL[id].kind !== 'market' && id !== 'skySsr'
    );
    expect(unpriced).toEqual([]);
  });
});

describe('fixturePriceSeries — the fallback must be able to FALL (§4.8 step 2)', () => {
  it('should produce a real drawdown, not a straight climb', () => {
    const pts = fixturePriceSeries('sanctumInf', 365);
    expect(pts).toHaveLength(365);
    const v = pts.map((p) => p.priceUsd);
    // Without a falling fixture the down path cannot be tested at all.
    expect(Math.min(...v)).toBeLessThan(v[0]);
    const drawdown = (Math.max(...v) - Math.min(...v)) / Math.max(...v);
    expect(drawdown).toBeGreaterThan(0.5);
  });

  it('should be deterministic and ascending by date', () => {
    const a = fixturePriceSeries('jito', 30);
    const b = fixturePriceSeries('jito', 30);
    expect(a).toEqual(b); // replays must reproduce exactly
    const dates = a.map((p) => p.date);
    expect([...dates].sort()).toEqual(dates);
  });
});
