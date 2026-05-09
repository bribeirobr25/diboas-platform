import { describe, it, expect } from 'vitest';
import { convertCadenceToMonthly } from '../cadence';

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

  it('should handle zero amount as zero monthly equivalent', () => {
    expect(convertCadenceToMonthly(0, 'daily')).toBe(0);
    expect(convertCadenceToMonthly(0, 'weekly')).toBe(0);
    expect(convertCadenceToMonthly(0, 'monthly')).toBe(0);
  });

  it('should handle large amounts without losing precision', () => {
    expect(convertCadenceToMonthly(10_000, 'daily')).toBeCloseTo(304_166.667, 2);
  });

  it('should handle non-integer amounts', () => {
    expect(convertCadenceToMonthly(2.5, 'daily')).toBeCloseTo(76.042, 3);
    expect(convertCadenceToMonthly(12.75, 'weekly')).toBeCloseTo(55.25, 2);
  });
});
