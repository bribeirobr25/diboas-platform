/**
 * Pre-demo fee calculation tests (Phase 8 Item E).
 *
 * Verifies that the service-derived rates produce identical results to the
 * pre-Item-E hardcoded FEE_RATES. Locks in the canonical values so future
 * service changes that drift from these expected outputs surface here.
 */

import { describe, it, expect } from 'vitest';
import {
  resolveFeeRates,
  calculateDepositFees,
  calculateSendFees,
  calculateBuyFees,
  type FeeRates,
} from '../calculations';

describe('resolveFeeRates (Phase 8 Item E — service-derived)', () => {
  it('should return canonical rates matching pre-Item-E FEE_RATES values', () => {
    const rates = resolveFeeRates();
    expect(rates.deposit).toEqual({
      paymentProcessor: 0.01,
      network: 0.00001,
      diboas: 0.0048,
      diboasMin: 0,
      diboasMax: 250,
    });
    expect(rates.send).toEqual({
      network: 0.00001,
      priority: 0.009,
      diboas: 0,
    });
    expect(rates.buy).toEqual({
      btcSwap: 0.003,
      btcMinerRate: 0.02,
      xautIssuer: 0.0025,
      xautSwapGas: 0.09,
      xautLp: 0.001,
      defaultRate: 0.0006,
      diboas: 0.0039,
      btcDiboas: 0,
      xautDiboas: 0,
    });
  });

  it('should apply overrides without mutating the base service-derived rates', () => {
    const overridden = resolveFeeRates({ deposit: { diboas: 0.01 } });
    expect(overridden.deposit.diboas).toBe(0.01);
    // Other deposit fields preserved
    expect(overridden.deposit.paymentProcessor).toBe(0.01);
    expect(overridden.deposit.diboasMin).toBe(0);
    // Send + buy untouched
    expect(overridden.send.priority).toBe(0.009);
    expect(overridden.buy.btcSwap).toBe(0.003);
    // Subsequent call without overrides returns canonical base
    expect(resolveFeeRates().deposit.diboas).toBe(0.0048);
  });
});

describe('calculateDepositFees', () => {
  it('should compute $100 deposit fees correctly', () => {
    const result = calculateDepositFees(100);
    // $100 × 1% payment processor = $1
    expect(result.processorFee).toBe(1);
    // $100 × 0.001% network = $0.001
    expect(result.networkFee).toBeCloseTo(0.001, 4);
    // $100 × 0.48% diBoaS = $0.48 (within min/max bounds)
    expect(result.diboasFee).toBe(0.48);
    // Total = $1.481; net = $98.519
    expect(result.totalFees).toBeCloseTo(1.481, 4);
    expect(result.netAmount).toBeCloseTo(98.519, 4);
  });

  it('should apply the deposit max cap and no minimum (FEES.md B2C: $250 cap, no Add-Money min)', () => {
    // $10 deposit × 0.48% = $0.048 → no minimum floor on Add Money
    expect(calculateDepositFees(10).diboasFee).toBeCloseTo(0.048, 4);
    // $10,000 deposit × 0.48% = $48 → under the $250 maximum (not clamped)
    expect(calculateDepositFees(10000).diboasFee).toBeCloseTo(48, 4);
  });
});

describe('calculateSendFees', () => {
  it('should compute $50 send fees correctly', () => {
    const result = calculateSendFees(50);
    // Send is FREE — diboas = 0
    expect(result.diboasFee).toBe(0);
    // Network = $50 × 0.001%
    expect(result.networkFee).toBeCloseTo(0.0005, 5);
    // Priority = $0.009 (fixed)
    expect(result.priorityFee).toBe(0.009);
  });
});

describe('calculateBuyFees', () => {
  it('should compute BTC buy fees ($100 BTC)', () => {
    const result = calculateBuyFees(100, 'BTC');
    // BTC: swap 0.3% + miner 2% + diboas 0 (free on buy)
    expect(result.totalFees).toBeCloseTo(2.3, 4);
    expect(result.netAmount).toBeCloseTo(97.7, 4);
  });

  it('should compute XAUT buy fees ($100 gold)', () => {
    const result = calculateBuyFees(100, 'XAUT');
    // XAUT: issuer 0.25% + gas $0.09 + LP 0.1% + diboas 0 = $0.25 + $0.09 + $0.1 = $0.44
    expect(result.totalFees).toBeCloseTo(0.44, 4);
  });

  it('should compute default-asset buy fees ($100 other)', () => {
    const result = calculateBuyFees(100, 'SOL');
    // Default: defaultRate 0.06% × $100 = $0.06
    // diboas 0.39% × $100 = $0.39 (within $0.25 min / $25 max — not clamped)
    // Total = $0.06 + $0.39 = $0.45
    expect(result.totalFees).toBeCloseTo(0.45, 4);
  });

  it('should clamp diboas buy fee to min $0.25 for tiny amounts', () => {
    // $10 × 0.39% = $0.039 → clamped UP to $0.25
    const result = calculateBuyFees(10, 'SOL');
    // defaultRate $0.006 + diboas $0.25 = $0.256
    expect(result.totalFees).toBeCloseTo(0.256, 4);
  });
});
