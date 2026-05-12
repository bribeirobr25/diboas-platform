/**
 * Card Fee Savings projection tests (Phase 6E.1).
 */

import { describe, it, expect } from 'vitest';
import { projectCardFeeSavings } from '../cardFees';

describe('projectCardFeeSavings', () => {
  it('should compute monthly and annual fees from volume × rate', () => {
    const result = projectCardFeeSavings(50_000, 0.029);
    expect(result.monthlyFeePaid).toBeCloseTo(1450, 5);
    expect(result.annualFeePaid).toBeCloseTo(17_400, 5);
  });

  it('should set annualSavingsWithDiboas equal to annualFeePaid (v1 model)', () => {
    const result = projectCardFeeSavings(50_000, 0.029);
    expect(result.annualSavingsWithDiboas).toBe(result.annualFeePaid);
  });

  it('should return perTransactionFee when avgTransactionAmount is provided', () => {
    const result = projectCardFeeSavings(50_000, 0.029, 75);
    expect(result.perTransactionFee).toBeCloseTo(2.175, 5);
  });

  it('should omit perTransactionFee when avgTransactionAmount is undefined', () => {
    const result = projectCardFeeSavings(50_000, 0.029);
    expect(result.perTransactionFee).toBeUndefined();
  });

  it('should omit perTransactionFee when avgTransactionAmount is 0', () => {
    const result = projectCardFeeSavings(50_000, 0.029, 0);
    expect(result.perTransactionFee).toBeUndefined();
  });

  it('should return zeros when monthlyVolume is 0', () => {
    const result = projectCardFeeSavings(0, 0.029);
    expect(result.monthlyFeePaid).toBe(0);
    expect(result.annualFeePaid).toBe(0);
    expect(result.annualSavingsWithDiboas).toBe(0);
  });

  it('should return zeros when processorFeeRate is 0', () => {
    const result = projectCardFeeSavings(50_000, 0);
    expect(result.monthlyFeePaid).toBe(0);
    expect(result.annualFeePaid).toBe(0);
  });

  it('should throw when monthlyVolume is negative', () => {
    expect(() => projectCardFeeSavings(-1, 0.029)).toThrow();
  });

  it('should throw when processorFeeRate is negative', () => {
    expect(() => projectCardFeeSavings(50_000, -0.01)).toThrow();
  });

  it('should handle EU-typical rate (1.75%) at BR-typical volume', () => {
    const result = projectCardFeeSavings(40_000, 0.0175);
    expect(result.monthlyFeePaid).toBeCloseTo(700, 5);
    expect(result.annualFeePaid).toBeCloseTo(8_400, 5);
  });

  it('should handle BR-typical rate (3.0%) at BR-typical volume', () => {
    const result = projectCardFeeSavings(250_000, 0.03);
    expect(result.monthlyFeePaid).toBeCloseTo(7_500, 5);
    expect(result.annualFeePaid).toBeCloseTo(90_000, 5);
  });
});
