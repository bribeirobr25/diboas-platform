/**
 * Phase-7 hedged variant tests.
 *
 * Per M3 test-oracle rule: NEVER hardcode hand-computed effective-rate values.
 * Test expectations are derived by recomputing the canonical formula in-test.
 */

import { describe, it, expect } from 'vitest';
import { calculateCompoundProjectionHedged } from '../calculatorHedged';
import { calculateCompoundProjection } from '../calculator';
import { SCENARIO_RATES } from '../scenarios';
import { FALLBACK_MARKET_DATA } from '@/lib/market-data/constants';

describe('calculateCompoundProjectionHedged — USD locale (en)', () => {
  it('should be byte-identical to non-hedged for en (no depreciation)', () => {
    const input = {
      amount: 5,
      cadence: 'daily' as const,
      years: 12,
      locale: 'en' as const,
    };
    const hedged = calculateCompoundProjectionHedged(input);
    const nominal = calculateCompoundProjection(input);

    // Scenario rates and yearly values must match exactly.
    expect(hedged.series.map((s) => s.rate)).toEqual(nominal.series.map((s) => s.rate));
    hedged.series.forEach((s, i) => {
      expect(s.finalValue).toBeCloseTo(nominal.series[i]!.finalValue, 5);
    });
  });
});

describe('calculateCompoundProjectionHedged — pt-BR (BRL hedge)', () => {
  it('should apply effective-rate APY to scenario rates', () => {
    const input = {
      amount: 25,
      cadence: 'daily' as const,
      years: 12,
      locale: 'pt-BR' as const,
    };
    const out = calculateCompoundProjectionHedged(input);
    const dep = FALLBACK_MARKET_DATA.exchangeRates.rates.BRL!.annualDepreciation;

    const expectedConservative =
      ((1 + SCENARIO_RATES.conservative / 100) * (1 + dep) - 1) * 100;
    const conservative = out.series.find((s) => s.scenario === 'conservative')!;
    expect(conservative.rate).toBeCloseTo(expectedConservative, 5);

    const expectedHistorical =
      ((1 + SCENARIO_RATES.historical / 100) * (1 + dep) - 1) * 100;
    const historical = out.series.find((s) => s.scenario === 'historical')!;
    expect(historical.rate).toBeCloseTo(expectedHistorical, 5);
  });

  it('should leave bank scenario at locale savings rate (no hedge applied)', () => {
    const input = {
      amount: 25,
      cadence: 'daily' as const,
      years: 12,
      locale: 'pt-BR' as const,
    };
    const out = calculateCompoundProjectionHedged(input);
    expect(out.series.find((s) => s.scenario === 'bank')!.rate).toBe(
      FALLBACK_MARKET_DATA.rates.bankRates['pt-BR']!.savings,
    );
  });
});

describe('calculateCompoundProjectionHedged — de (EUR hedge)', () => {
  it('should apply effective-rate APY to scenario rates using EUR depreciation', () => {
    const input = {
      amount: 4,
      cadence: 'daily' as const,
      years: 12,
      locale: 'de' as const,
    };
    const out = calculateCompoundProjectionHedged(input);
    const dep = FALLBACK_MARKET_DATA.exchangeRates.rates.EUR!.annualDepreciation;

    const expectedConservative =
      ((1 + SCENARIO_RATES.conservative / 100) * (1 + dep) - 1) * 100;
    expect(out.series.find((s) => s.scenario === 'conservative')!.rate).toBeCloseTo(
      expectedConservative,
      5,
    );
  });
});

describe('calculateCompoundProjectionHedged — cadence coverage', () => {
  const cadences = ['oneTime', 'monthly', 'yearly'] as const;

  for (const cadence of cadences) {
    it(`should preserve bank < conservative < historical < optimistic ordering for ${cadence} in pt-BR`, () => {
      const out = calculateCompoundProjectionHedged({
        amount: 1000,
        cadence,
        years: 10,
        locale: 'pt-BR',
      });
      const fv = (k: string) => out.series.find((s) => s.scenario === k)!.finalValue;
      expect(fv('bank')).toBeLessThan(fv('conservative'));
      expect(fv('conservative')).toBeLessThan(fv('historical'));
      expect(fv('historical')).toBeLessThan(fv('optimistic'));
    });
  }
});
