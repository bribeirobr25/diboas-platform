import { describe, it, expect } from 'vitest';
import { computeStep2, resolveScenarioRates, SCENARIO_RATES, DIBOAS_RECEIVE_FEE } from '../calculatorUtils';
import { futureValue, apyToMonthlyRate } from '@/lib/utils/financialMath';

describe('computeStep2', () => {
  describe('CashFlow (isCashflow = true)', () => {
    it('should return compound annuity result for 1 year at 7% APY', () => {
      // $1,000/day revenue, 2.9% fee rate, 7% APY, 1 year
      const field1 = 1000;      // daily revenue
      const field2 = 2.9;       // fee rate %
      const periodMultiplier = 1; // 1 year
      const scenarioRate = 7;    // APY %

      const result = computeStep2(true, field1, field2, periodMultiplier, scenarioRate);

      // monthlySavings = 1000 * ((2.9 - 0) / 100) * 30 = $870/month
      // months = 12
      // futureValue(0, 870, apyToMonthlyRate(7), 12) ≈ $10,771
      const monthlySavings = field1 * ((field2 - DIBOAS_RECEIVE_FEE) / 100) * 30;
      expect(monthlySavings).toBeCloseTo(870, 5);

      const expected = Math.round(
        futureValue(0, monthlySavings, apyToMonthlyRate(scenarioRate), 12),
      );
      expect(result).toBe(expected);
      // CTO Board verified: approximately $10,771
      expect(result).toBeGreaterThanOrEqual(10700);
      expect(result).toBeLessThanOrEqual(10850);
    });

    it('should return compound annuity result for 6 months at 7% APY', () => {
      const result = computeStep2(true, 1000, 2.9, 0.5, 7);

      // months = 6, monthlySavings = $870
      const expected = Math.round(
        futureValue(0, 870, apyToMonthlyRate(7), 6),
      );
      expect(result).toBe(expected);
      // CTO Board verified: approximately $5,294
      expect(result).toBeGreaterThanOrEqual(5250);
      expect(result).toBeLessThanOrEqual(5350);
    });

    it('should return compound annuity result for 1 month at 7% APY', () => {
      const result = computeStep2(true, 1000, 2.9, 1 / 12, 7);

      // months = 1, monthlySavings = $870
      const expected = Math.round(
        futureValue(0, 870, apyToMonthlyRate(7), 1),
      );
      expect(result).toBe(expected);
      // 1 month: essentially just the monthly savings ($870) + tiny interest
      expect(result).toBeGreaterThanOrEqual(865);
      expect(result).toBeLessThanOrEqual(880);
    });

    it('should handle zero fee rate', () => {
      const result = computeStep2(true, 1000, 0, 1, 7);
      expect(result).toBe(0);
    });
  });

  describe('Treasury (isCashflow = false)', () => {
    it('should return compound lump sum growth for 1 year at 7% APY', () => {
      // $200,000 treasury, 7% APY, 1 year
      const field1 = 200000;
      const field2 = 0; // not used for treasury step2
      const periodMultiplier = 1;
      const scenarioRate = 7;

      const result = computeStep2(false, field1, field2, periodMultiplier, scenarioRate);

      // futureValue(200000, 0, apyToMonthlyRate(7), 12) - 200000
      // = 200000 * 1.07 - 200000 = $14,000
      const expected = Math.round(
        futureValue(field1, 0, apyToMonthlyRate(scenarioRate), 12) - field1,
      );
      expect(result).toBe(expected);
      // CTO Board verified: approximately $14,000
      expect(result).toBeGreaterThanOrEqual(13900);
      expect(result).toBeLessThanOrEqual(14100);
    });

    it('should return compound lump sum growth for 6 months at 7% APY', () => {
      const result = computeStep2(false, 200000, 0, 0.5, 7);

      const expected = Math.round(
        futureValue(200000, 0, apyToMonthlyRate(7), 6) - 200000,
      );
      expect(result).toBe(expected);
      // CTO Board verified: approximately $6,882
      expect(result).toBeGreaterThanOrEqual(6800);
      expect(result).toBeLessThanOrEqual(6950);
    });

    it('should return zero growth for zero rate', () => {
      const result = computeStep2(false, 200000, 0, 1, 0);
      expect(result).toBe(0);
    });
  });
});

describe('resolveScenarioRates', () => {
  it('should return default SCENARIO_RATES when no overrides provided', () => {
    const result = resolveScenarioRates();
    expect(result).toEqual({ ...SCENARIO_RATES });
  });

  it('should return default SCENARIO_RATES when undefined passed', () => {
    const result = resolveScenarioRates(undefined);
    expect(result).toEqual({ ...SCENARIO_RATES });
  });

  it('should apply valid overrides', () => {
    const result = resolveScenarioRates({ conservative: 5, optimistic: 12 });
    expect(result).toEqual({
      conservative: 5,
      historical: SCENARIO_RATES.historical,
      optimistic: 12,
    });
  });

  it('should fall back to defaults for zero or negative overrides', () => {
    const result = resolveScenarioRates({ conservative: 0, historical: -1 });
    expect(result).toEqual({
      conservative: SCENARIO_RATES.conservative,
      historical: SCENARIO_RATES.historical,
      optimistic: SCENARIO_RATES.optimistic,
    });
  });

  it('should apply all overrides when all are valid', () => {
    const result = resolveScenarioRates({ conservative: 3, historical: 6, optimistic: 9 });
    expect(result).toEqual({ conservative: 3, historical: 6, optimistic: 9 });
  });

  it('should not mutate the original SCENARIO_RATES', () => {
    const before = { ...SCENARIO_RATES };
    resolveScenarioRates({ conservative: 99 });
    expect(SCENARIO_RATES).toEqual(before);
  });
});
