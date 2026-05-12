import { describe, it, expect } from 'vitest';
import { convertCadenceToMonthly, isOneTime } from '../cadence';

describe('convertCadenceToMonthly', () => {
  it('should multiply by 365/12 when cadence is daily', () => {
    expect(convertCadenceToMonthly(5, 'daily')).toBeCloseTo(152.083, 3);
  });

  it('should multiply by 52/12 when cadence is weekly', () => {
    expect(convertCadenceToMonthly(40, 'weekly')).toBeCloseTo(173.333, 3);
  });

  it('should pass through unchanged when cadence is monthly', () => {
    expect(convertCadenceToMonthly(25, 'monthly')).toBe(25);
  });

  it('should multiply by 4/12 when cadence is quarterly', () => {
    expect(convertCadenceToMonthly(120, 'quarterly')).toBeCloseTo(40, 5);
  });

  it('should multiply by 2/12 when cadence is semiAnnual', () => {
    expect(convertCadenceToMonthly(120, 'semiAnnual')).toBeCloseTo(20, 5);
  });

  it('should multiply by 1/12 when cadence is yearly', () => {
    expect(convertCadenceToMonthly(120, 'yearly')).toBeCloseTo(10, 5);
  });

  it('should return 0 when cadence is oneTime (callers must handle lump-sum branch)', () => {
    expect(convertCadenceToMonthly(1000, 'oneTime')).toBe(0);
    expect(convertCadenceToMonthly(0, 'oneTime')).toBe(0);
  });

  it('should handle zero amount as zero monthly equivalent', () => {
    expect(convertCadenceToMonthly(0, 'daily')).toBe(0);
    expect(convertCadenceToMonthly(0, 'weekly')).toBe(0);
    expect(convertCadenceToMonthly(0, 'monthly')).toBe(0);
    expect(convertCadenceToMonthly(0, 'quarterly')).toBe(0);
    expect(convertCadenceToMonthly(0, 'semiAnnual')).toBe(0);
    expect(convertCadenceToMonthly(0, 'yearly')).toBe(0);
  });

  it('should handle large amounts without losing precision', () => {
    expect(convertCadenceToMonthly(10_000, 'daily')).toBeCloseTo(304_166.667, 2);
  });

  it('should handle non-integer amounts', () => {
    expect(convertCadenceToMonthly(2.5, 'daily')).toBeCloseTo(76.042, 3);
    expect(convertCadenceToMonthly(12.75, 'weekly')).toBeCloseTo(55.25, 2);
  });
});

describe('isOneTime', () => {
  it('should return true for oneTime', () => {
    expect(isOneTime('oneTime')).toBe(true);
  });

  it('should return false for any recurring cadence', () => {
    expect(isOneTime('daily')).toBe(false);
    expect(isOneTime('weekly')).toBe(false);
    expect(isOneTime('monthly')).toBe(false);
    expect(isOneTime('quarterly')).toBe(false);
    expect(isOneTime('semiAnnual')).toBe(false);
    expect(isOneTime('yearly')).toBe(false);
  });
});
