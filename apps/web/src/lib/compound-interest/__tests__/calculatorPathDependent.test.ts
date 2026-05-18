/**
 * Phase D.3 — `calculateCompoundProjectionPathDependent` cross-validation.
 *
 * R1 discipline test: confirms this is a separate named function from
 * `calculateCompoundProjectionHedged` (NOT a flag on the hedged function).
 *
 * Math validation: the Brazilian R$100/mo 2010→2026 @ 10% USD scenario is
 * the same as Phase B's `calculateMonthlyPathDependentHedge` cross-validation
 * (research Part 5 Scenario D = R$94,765 ± 5%). Verifies the wrapper plumbing.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCompoundProjection,
  calculateCompoundProjectionHedged,
  calculateCompoundProjectionPathDependent,
  type CalculatorInput,
} from '../index';

describe('calculateCompoundProjectionPathDependent — R1 discipline', () => {
  it('is a separate named function from calculateCompoundProjectionHedged', () => {
    expect(calculateCompoundProjectionPathDependent).not.toBe(calculateCompoundProjectionHedged);
    expect(calculateCompoundProjectionPathDependent).not.toBe(calculateCompoundProjection);
    expect(typeof calculateCompoundProjectionPathDependent).toBe('function');
  });
});

describe('calculateCompoundProjectionPathDependent — USD locale graceful delegation', () => {
  it('returns the same shape as calculateCompoundProjectionHedged for USD locale', () => {
    const input: CalculatorInput = {
      amount: 100,
      cadence: 'monthly',
      years: 10,
      locale: 'en',
    };
    const pathResult = calculateCompoundProjectionPathDependent(input);
    const hedgedResult = calculateCompoundProjectionHedged(input);
    // USD locale: no FX path data, so pathDependent delegates to hedged.
    expect(pathResult.series.length).toBe(hedgedResult.series.length);
    expect(pathResult.series[0]!.scenario).toBe(hedgedResult.series[0]!.scenario);
    expect(pathResult.series[0]!.finalValue).toBeCloseTo(hedgedResult.series[0]!.finalValue, 1);
  });
});

describe('calculateCompoundProjectionPathDependent — BRL Scenario D (research Part 5)', () => {
  it('Historical (10% USD) 16-year R$100/mo monthly DCA → ~R$94,765 ± 5%', () => {
    const input: CalculatorInput = {
      amount: 100,
      cadence: 'monthly',
      years: 16,
      locale: 'pt-BR',
    };
    const result = calculateCompoundProjectionPathDependent(input);
    const historical = result.series.find((s) => s.scenario === 'historical');
    expect(historical).toBeDefined();
    // Research target: R$94,765 ± 5% (Scenario D, Part 5 Methodology).
    expect(historical!.finalValue).toBeGreaterThan(94765 * 0.95);
    expect(historical!.finalValue).toBeLessThan(94765 * 1.05);
  });

  it('yearlyValues array has length years + 1 (year 0 .. years), starts at 0 for monthly DCA', () => {
    const input: CalculatorInput = {
      amount: 100,
      cadence: 'monthly',
      years: 16,
      locale: 'pt-BR',
    };
    const result = calculateCompoundProjectionPathDependent(input);
    const historical = result.series.find((s) => s.scenario === 'historical')!;
    expect(historical.yearlyValues.length).toBe(17);
    expect(historical.yearlyValues[0]).toBe(0);
    expect(historical.yearlyValues[16]).toBeCloseTo(historical.finalValue, 5);
  });

  it('bank scenario stays in local currency (no FX hedge — same as smoothed engine)', () => {
    const input: CalculatorInput = {
      amount: 100,
      cadence: 'monthly',
      years: 5,
      locale: 'pt-BR',
    };
    const pathResult = calculateCompoundProjectionPathDependent(input);
    const hedgedResult = calculateCompoundProjectionHedged(input);
    const pathBank = pathResult.series.find((s) => s.scenario === 'bank')!;
    const hedgedBank = hedgedResult.series.find((s) => s.scenario === 'bank')!;
    expect(pathBank.finalValue).toBeCloseTo(hedgedBank.finalValue, 1);
  });
});

describe('calculateCompoundProjectionPathDependent — years cap', () => {
  it('throws InvalidCalculatorInputError when years > 16 (bucket coverage cap)', () => {
    const input: CalculatorInput = {
      amount: 100,
      cadence: 'monthly',
      years: 20,
      locale: 'pt-BR',
    };
    expect(() => calculateCompoundProjectionPathDependent(input)).toThrow(/path-dependent retrospective requires years between/);
  });

  it('accepts years = 1 (minimum valid)', () => {
    const input: CalculatorInput = {
      amount: 100,
      cadence: 'monthly',
      years: 1,
      locale: 'pt-BR',
    };
    expect(() => calculateCompoundProjectionPathDependent(input)).not.toThrow();
  });
});
