import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { legRequiresCurrentRate } from '../catalogueEvidence';
import { strategyRateAvailability } from '../rateAvailability';
import { STRATEGY_CATALOG } from '../catalog';
import { FIXTURE_STAMP } from '../fixtures';
import { observedStamp } from '../testing';
import type { ProtocolApy, ProtocolId, StrategyDef } from '../types';

const NOW = '2026-09-22T00:00:00Z';
const FRESH = '2026-09-20T00:00:00Z';

const live = (protocolId: ProtocolId): ProtocolApy => ({
  protocolId,
  apyPercent: 4,
  tvlUsd: null,
  chain: 'Arbitrum',
  stamp: observedStamp('defillama', FRESH),
});
const stale = (protocolId: ProtocolId): ProtocolApy => ({
  protocolId,
  apyPercent: 4,
  tvlUsd: null,
  chain: 'Arbitrum',
  stamp: FIXTURE_STAMP,
});

const accrualOf = (s: StrategyDef) =>
  s.allocation.filter((l) => legRequiresCurrentRate(l.protocolId));
const marketOf = (s: StrategyDef) =>
  s.allocation.filter((l) => !legRequiresCurrentRate(l.protocolId));
const isPure = (s: StrategyDef) => marketOf(s).length === 0;

const PURE = STRATEGY_CATALOG.filter(isPure);
const HETERO = STRATEGY_CATALOG.filter((s) => !isPure(s));
/** Rates for the legs that owe one. A market leg is deliberately NOT supplied. */
const accrualRates = (s: StrategyDef) => accrualOf(s).map((l) => live(l.protocolId));

/** S3 · CATALOGUE GATING SWITCHOVER (`5.444`). */
describe('S3 · availability asks each leg only for what it owes', () => {
  it('should measure both classes from the catalogue, never a hand-listed set', () => {
    expect(PURE.length).toBe(5);
    expect(HETERO.length).toBe(5);
    expect(PURE.length + HETERO.length).toBe(STRATEGY_CATALOG.length);
  });

  it('should make an ACCRUAL strategy available when every required rate is valid', () => {
    for (const s of PURE) {
      expect(strategyRateAvailability(s, accrualRates(s), NOW), s.id).toEqual({ available: true });
    }
  });

  it('should still REFUSE an accrual strategy missing a REQUIRED rate', () => {
    for (const s of PURE) {
      const missingOne = accrualRates(s).slice(1);
      const r = strategyRateAvailability(s, missingOne, NOW);
      expect(r.available, s.id).toBe(false);
      if (r.available) throw new Error('unreachable');
      expect(r.reason, s.id).toBe('NO_OBSERVATION');
    }
  });

  it('should still REFUSE an accrual strategy whose required rate is out of vintage', () => {
    for (const s of PURE) {
      const r = strategyRateAvailability(
        s,
        s.allocation.map((l) => stale(l.protocolId)),
        NOW
      );
      expect(r.available, s.id).toBe(false);
      if (r.available) throw new Error('unreachable');
      expect(r.reason, s.id).toBe('REFUSED_BY_CONTRACT');
    }
  });

  it('should make a HETEROGENEOUS strategy available with NO market-leg rate at all', () => {
    /**
     * The behaviour `5.444` exists for. A market leg's return is its PRICE; a
     * rate it never owed must not gate the strategy. Its APY is not supplied
     * here at all — not stale, not zero: absent.
     */
    for (const s of HETERO) {
      expect(marketOf(s).length, s.id).toBeGreaterThan(0);
      expect(strategyRateAvailability(s, accrualRates(s), NOW), s.id).toEqual({ available: true });
    }
  });

  it('should REFUSE a heterogeneous strategy when an ACCRUAL leg is the one missing', () => {
    /* The relaxation is scoped to legs that owe nothing — it must not become a
       blanket amnesty for the legs that do. */
    for (const s of HETERO.filter((x) => accrualOf(x).length > 0)) {
      const r = strategyRateAvailability(s, accrualRates(s).slice(1), NOW);
      expect(r.available, s.id).toBe(false);
    }
  });

  it('should resolve each leg INDEPENDENTLY — market rates change nothing either way', () => {
    /**
     * ⚑ MEASURED SHAPE OF THE CATALOGUE, not an assumption: every heterogeneous
     * strategy has exactly ONE accrual leg and one-to-three market legs. An
     * earlier version of this test looked for a heterogeneous strategy with two
     * accrual legs; none exists, and the test failed rather than quietly
     * proving nothing.
     *
     * Independence is shown on the axis the catalogue actually has: the accrual
     * leg decides, and supplying or withholding market rates — even absurd ones
     * — moves the verdict not at all.
     */
    const s = HETERO.reduce((a, b) => (marketOf(b).length > marketOf(a).length ? b : a));
    expect(marketOf(s).length).toBeGreaterThan(1);
    expect(accrualOf(s).length).toBe(1);

    const accrual = accrualRates(s);
    const absurdMarketRates = marketOf(s).map((l) => ({ ...live(l.protocolId), apyPercent: 999 }));
    const staleMarketRates = marketOf(s).map((l) => stale(l.protocolId));

    /* Accrual valid -> available, whatever the market legs do or do not say. */
    for (const extra of [[], absurdMarketRates, staleMarketRates]) {
      expect(strategyRateAvailability(s, [...accrual, ...extra], NOW).available).toBe(true);
    }
    /* Accrual stale -> refused, and no market rate can rescue it. */
    const accrualStale = accrualOf(s).map((l) => stale(l.protocolId));
    for (const extra of [[], absurdMarketRates]) {
      expect(strategyRateAvailability(s, [...accrualStale, ...extra], NOW).available).toBe(false);
    }
  });

  it('should give JLP its behaviour from the generic contract, with no special case', () => {
    const jlpStrategies = STRATEGY_CATALOG.filter((s) =>
      s.allocation.some((l) => l.protocolId === 'jupiterJlp')
    );
    expect(jlpStrategies.length).toBe(3);
    for (const s of jlpStrategies) {
      expect(strategyRateAvailability(s, accrualRates(s), NOW), s.id).toEqual({ available: true });
    }
    /* And the gate names no protocol — scanned as CODE, not prose. */
    const code = readFileSync(join(__dirname, '..', 'rateAvailability.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    for (const id of ['jupiterJlp', 'sanctumInf', 'jito', 'skySsr', 'aaveV3', 'compoundV3']) {
      expect(code, id).not.toContain(id);
    }
    expect(code).toContain('legRequiresCurrentRate');
  });

  it('should hold the measured class outcome: 5 unchanged · 5 available without a rate', () => {
    const rates = STRATEGY_CATALOG.flatMap((s) => accrualRates(s));
    const byClass = { pure: 0, hetero: 0 };
    for (const s of STRATEGY_CATALOG) {
      expect(strategyRateAvailability(s, rates, NOW).available, s.id).toBe(true);
      if (isPure(s)) byClass.pure += 1;
      else byClass.hetero += 1;
    }
    expect(byClass).toEqual({ pure: 5, hetero: 5 });
  });
});
