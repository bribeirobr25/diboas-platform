// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';
import {
  STRATEGY_CATALOG,
  FIXTURE_STAMP,
  legRequiresCurrentRate,
  observedStamp,
  type ProtocolApy,
  type ProtocolId,
  type StrategyDef,
} from '@diboas/defi';

import { strategyRateDisplay } from '../StrategyPicker';

const NOW = '2026-09-22T00:00:00Z';
const FRESH = '2026-09-20T00:00:00Z';

const rate = (protocolId: ProtocolId, apyPercent = 4, stamp = observedStamp('defillama', FRESH)) =>
  ({ protocolId, apyPercent, tvlUsd: null, chain: 'Arbitrum', stamp }) as ProtocolApy;

const accrualLegsOf = (s: StrategyDef) =>
  s.allocation.filter((l) => legRequiresCurrentRate(l.protocolId));
const isPureAccrual = (s: StrategyDef) => accrualLegsOf(s).length === s.allocation.length;
const allRates = (s: StrategyDef) => s.allocation.map((l) => rate(l.protocolId));

const PURE = STRATEGY_CATALOG.filter(isPureAccrual);
const HETERO = STRATEGY_CATALOG.filter((s) => !isPureAccrual(s));

/** S2 · RATE / BLEND TRUTHFULNESS (`5.444`). */
describe('S2 · the catalogue measures its own classes', () => {
  it('should find both classes, derived — never a hand-listed set of ids', () => {
    expect(PURE.length).toBe(5);
    expect(HETERO.length).toBe(5);
    expect(PURE.length + HETERO.length).toBe(10);
    expect(STRATEGY_CATALOG.length).toBe(10);
  });
});

describe('S2 · a rate is displayed only when it can be stated truthfully', () => {
  it('should display the blend for a PURE ACCRUAL strategy, unchanged to the cent', () => {
    for (const s of PURE) {
      const d = strategyRateDisplay(s, allRates(s), NOW);
      expect(d.displayable, s.id).toBe(true);
      if (!d.displayable) throw new Error('unreachable');
      /* The historical formula, restated independently: sum(apy * weight / 100). */
      const expected = s.allocation.reduce(
        (acc, l) => acc.plus(new Decimal(4).mul(l.weightPercent).div(100)),
        new Decimal(0)
      );
      expect(d.apy.toFixed(10), s.id).toBe(expected.toFixed(10));
    }
  });

  it('should OMIT the rate for every HETEROGENEOUS strategy', () => {
    for (const s of HETERO) {
      const d = strategyRateDisplay(s, allRates(s), NOW);
      expect(d.displayable, s.id).toBe(false);
      if (d.displayable) throw new Error('unreachable');
      expect(d.reason, s.id).toBe('HETEROGENEOUS');
    }
  });

  it('should WITHHOLD rather than zero-fill a missing REQUIRED accrual rate', () => {
    /**
     * The defect this slice exists for. `blendedApy` read `?? 0`, so a missing
     * rate silently contributed zero to a number a user reads — invisible only
     * because the availability gate happened to stop it rendering.
     */
    for (const s of PURE) {
      const missingOne = allRates(s).slice(1);
      const d = strategyRateDisplay(s, missingOne, NOW);
      expect(d.displayable, s.id).toBe(false);
      if (d.displayable) throw new Error('unreachable');
      expect(d.reason, s.id).toBe('MISSING_REQUIRED_RATE');
    }
  });

  it('should REFUSE a stale rate — presence and finiteness are not validity', () => {
    /* Caught by the `5.436` guard during S2: a rate outside the current-facing
       vintage is exactly the "stale number" that ruling forbids. */
    const s = PURE[0];
    const stale = s.allocation.map((l) => rate(l.protocolId, 4, FIXTURE_STAMP));
    const d = strategyRateDisplay(s, stale, NOW);
    expect(d.displayable).toBe(false);
  });

  it('should NEVER be able to return a number it must not show', () => {
    /* Structural: the refused arm carries a reason and no apy, so no caller can
       read a figure out of a refusal. */
    const d = strategyRateDisplay(HETERO[0], allRates(HETERO[0]), NOW);
    expect(d).not.toHaveProperty('apy');
    expect(Object.keys(d).sort()).toEqual(['displayable', 'reason']);
  });

  it('should NOT renormalise over the accrual legs of a heterogeneous strategy', () => {
    /**
     * Renormalising would silently change what the number MEANS while leaving
     * its label identical — prohibited by name in the ruling. Proven by the
     * absence of any figure at all, and by the weights not summing to 100 over
     * the accrual legs alone.
     */
    const s = HETERO.find((x) => accrualLegsOf(x).length > 0)!;
    const accrualWeight = accrualLegsOf(s).reduce((a, l) => a + l.weightPercent, 0);
    expect(accrualWeight).toBeLessThan(100);
    expect(strategyRateDisplay(s, allRates(s), NOW).displayable).toBe(false);
  });
});
