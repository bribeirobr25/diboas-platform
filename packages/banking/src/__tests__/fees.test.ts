import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  computeAddMoneyFee,
  computeExitFee,
  computeStrategyEntryFee,
  EXIT_FEE_CAP,
  EXIT_FEE_FLOOR,
  RAMP_FEE_CAP_B2C,
} from '../fees';

/**
 * Contract tests against the canonical schedule (docs/full-view/FEES.md):
 * Add Money 0.48% (B2C capped 250/currency; B2B no cap) · Strategy Exit 0.39%
 * (floor 0.25 / cap 25 per currency) · Entry FREE.
 */
describe('computeAddMoneyFee (0.48% ramp)', () => {
  it('should charge 0.48% below the cap', () => {
    expect(computeAddMoneyFee(new Decimal(1000), 'USD').toFixed(2)).toBe('4.80');
    expect(computeAddMoneyFee(new Decimal(10000), 'BRL').toFixed(2)).toBe('48.00');
  });

  it('should cap B2C at 250 per currency', () => {
    // 0.48% of 100_000 = 480 → capped at 250 for B2C, in every market currency.
    for (const currency of ['USD', 'BRL', 'EUR'] as const) {
      const fee = computeAddMoneyFee(new Decimal(100_000), currency, 'b2c');
      expect(fee.eq(RAMP_FEE_CAP_B2C[currency])).toBe(true);
    }
  });

  it('should not cap B2B (FEES.md: no cap)', () => {
    expect(computeAddMoneyFee(new Decimal(250_000), 'USD', 'b2b').toFixed(2)).toBe('1200.00');
  });
});

describe('computeExitFee (0.39% with floor/cap)', () => {
  it('should charge 0.39% in the normal band', () => {
    expect(computeExitFee(new Decimal(1000), 'USD').toFixed(2)).toBe('3.90');
  });

  it('should apply the 0.25 floor on tiny exits', () => {
    for (const currency of ['USD', 'BRL', 'EUR'] as const) {
      const fee = computeExitFee(new Decimal(10), currency); // 0.39% = 0.039 → floored
      expect(fee.eq(EXIT_FEE_FLOOR[currency])).toBe(true);
    }
  });

  it('should apply the 25 cap on large exits', () => {
    for (const currency of ['USD', 'BRL', 'EUR'] as const) {
      const fee = computeExitFee(new Decimal(100_000), currency); // 0.39% = 390 → capped
      expect(fee.eq(EXIT_FEE_CAP[currency])).toBe(true);
    }
  });
});

describe('computeStrategyEntryFee', () => {
  it('should always be zero (Strategy Entry is FREE per FEES.md)', () => {
    expect(computeStrategyEntryFee().isZero()).toBe(true);
  });
});
