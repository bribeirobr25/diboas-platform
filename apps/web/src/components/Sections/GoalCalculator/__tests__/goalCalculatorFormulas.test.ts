import { describe, it, expect } from 'vitest';
import {
  annualToMonthlyRate,
  futureValue,
  suggestedMonthly,
  computeScenarios,
  monthsUntil,
  getChristmasTarget,
  isBadCaseLoss,
} from '../goalCalculatorFormulas';

describe('annualToMonthlyRate', () => {
  it('should return 0 for 0% APY', () => {
    expect(annualToMonthlyRate(0)).toBe(0);
  });

  it('should convert 7% APY to monthly rate using geometric compounding', () => {
    const r = annualToMonthlyRate(0.07);
    // (1.07)^(1/12) - 1 ≈ 0.005654
    expect(r).toBeCloseTo(0.005654, 4);
  });

  it('should convert 10% APY to monthly rate', () => {
    const r = annualToMonthlyRate(0.10);
    expect(r).toBeCloseTo(0.007974, 4);
  });

  it('should convert 15% APY to monthly rate', () => {
    const r = annualToMonthlyRate(0.15);
    expect(r).toBeCloseTo(0.011715, 4);
  });

  it('should handle negative APY for principal loss', () => {
    const r = annualToMonthlyRate(-0.15);
    // -(1 - (1 + (-0.15))^(1/12)) = -(1 - 0.85^(1/12))
    expect(r).toBeLessThan(0);
    expect(r).toBeCloseTo(-0.013452, 4);
  });

  it('should produce correct compounding: (1+r)^12 ≈ (1+y)', () => {
    const apy = 0.07;
    const r = annualToMonthlyRate(apy);
    expect(Math.pow(1 + r, 12)).toBeCloseTo(1 + apy, 6);
  });
});

describe('futureValue', () => {
  it('should return initial deposit when months is 0', () => {
    expect(futureValue(1000, 100, 0.005, 0)).toBe(1000);
  });

  it('should compute correctly with zero rate', () => {
    expect(futureValue(1000, 100, 0, 12)).toBe(1000 + 100 * 12);
  });

  it('should compute FV with compound interest', () => {
    const r = annualToMonthlyRate(0.07);
    const fv = futureValue(1000, 200, r, 12);
    // I*(1+r)^12 + M*((1+r)^12 - 1)/r
    const cf = Math.pow(1 + r, 12);
    const expected = 1000 * cf + 200 * ((cf - 1) / r);
    expect(fv).toBeCloseTo(expected, 2);
  });

  it('should handle zero initial deposit', () => {
    const r = annualToMonthlyRate(0.07);
    const fv = futureValue(0, 200, r, 12);
    expect(fv).toBeGreaterThan(200 * 12);
  });

  it('should handle zero monthly deposit', () => {
    const r = annualToMonthlyRate(0.07);
    const fv = futureValue(1000, 0, r, 12);
    expect(fv).toBeCloseTo(1000 * Math.pow(1 + r, 12), 2);
  });

  it('should handle negative monthly rate (loss scenario)', () => {
    const r = annualToMonthlyRate(-0.15);
    const fv = futureValue(1000, 100, r, 12);
    // With negative returns, FV should be less than total deposits
    expect(fv).toBeLessThan(1000 + 100 * 12);
  });
});

describe('suggestedMonthly', () => {
  it('should return 0 when months is 0', () => {
    expect(suggestedMonthly(5000, 1000, 0.005, 0)).toBe(0);
  });

  it('should compute correctly with zero rate', () => {
    const m = suggestedMonthly(2000, 500, 0, 10);
    expect(m).toBeCloseTo(150, 0);
  });

  it('should return 0 when initial deposit already covers target', () => {
    const r = annualToMonthlyRate(0.07);
    expect(suggestedMonthly(1000, 2000, r, 12)).toBe(0);
  });

  it('should compute a positive monthly for achievable target', () => {
    const r = annualToMonthlyRate(0.07);
    const m = suggestedMonthly(5000, 0, r, 12);
    expect(m).toBeGreaterThan(0);
    // Verify: FV with this monthly should equal target
    const fv = futureValue(0, m, r, 12);
    expect(fv).toBeCloseTo(5000, 0);
  });

  it('should account for initial deposit growth', () => {
    const r = annualToMonthlyRate(0.07);
    const mWithDeposit = suggestedMonthly(5000, 1000, r, 12);
    const mWithout = suggestedMonthly(5000, 0, r, 12);
    expect(mWithDeposit).toBeLessThan(mWithout);
  });
});

describe('computeScenarios', () => {
  it('should compute good > expected > bad for careful tier', () => {
    const result = computeScenarios(1000, 200, 12, 0);
    expect(result.good).toBeGreaterThan(result.expected);
    expect(result.expected).toBeGreaterThan(result.bad);
  });

  it('should compute good > expected > bad for moderate tier', () => {
    const result = computeScenarios(1000, 200, 12, 1);
    expect(result.good).toBeGreaterThan(result.expected);
    expect(result.expected).toBeGreaterThan(result.bad);
  });

  it('should compute good > expected for aggressive tier', () => {
    const result = computeScenarios(1000, 200, 12, 2);
    expect(result.good).toBeGreaterThan(result.expected);
    // Bad case can be less than deposits for aggressive
  });

  it('should show potential loss in aggressive bad case', () => {
    const result = computeScenarios(1000, 200, 12, 2);
    const totalDeposits = 1000 + 200 * 12;
    expect(result.bad).toBeLessThan(totalDeposits);
  });

  it('should return rounded integers', () => {
    const result = computeScenarios(1000, 200, 12, 0);
    expect(Number.isInteger(result.good)).toBe(true);
    expect(Number.isInteger(result.expected)).toBe(true);
    expect(Number.isInteger(result.bad)).toBe(true);
  });
});

describe('monthsUntil', () => {
  it('should return 0 for past dates', () => {
    const past = new Date();
    past.setMonth(past.getMonth() - 1);
    expect(monthsUntil(past)).toBe(0);
  });

  it('should return positive months for future dates', () => {
    const future = new Date();
    future.setMonth(future.getMonth() + 6);
    const months = monthsUntil(future);
    expect(months).toBeGreaterThanOrEqual(5);
    expect(months).toBeLessThanOrEqual(7);
  });
});

describe('getChristmasTarget', () => {
  it('should return a date in December', () => {
    const result = getChristmasTarget();
    expect(result.date.getMonth()).toBe(11); // December = 11
    expect(result.date.getDate()).toBe(1);
  });

  it('should return a future date', () => {
    const result = getChristmasTarget();
    expect(result.date.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('isBadCaseLoss', () => {
  it('should return true when bad case is less than total deposits', () => {
    expect(isBadCaseLoss(2000, 1000, 200, 12)).toBe(true);
    // total deposits = 1000 + 200*12 = 3400 > 2000
  });

  it('should return false when bad case exceeds total deposits', () => {
    expect(isBadCaseLoss(4000, 1000, 200, 12)).toBe(false);
    // total deposits = 1000 + 200*12 = 3400 < 4000
  });

  it('should return false when bad case equals total deposits', () => {
    expect(isBadCaseLoss(3400, 1000, 200, 12)).toBe(false);
  });
});
