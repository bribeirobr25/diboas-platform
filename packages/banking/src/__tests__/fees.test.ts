import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  computeAddMoneyFee,
  computeExitFee,
  computeStrategyEntryFee,
  EXIT_FEE_FLOOR,
  MIN_ADD_MONEY,
} from '../fees';

/**
 * Contract tests against the canonical schedule (docs/full-view/FEES.md v3.5,
 * FE-1/FC-13 2026-08-03): Add Money 0.48% — no cap, B2C and B2B alike ·
 * Strategy Exit 0.39% — floor 0.25 per currency, no cap · Entry FREE ·
 * minimum add-money $10/€10/R$20 (FE-1b).
 */
describe('computeAddMoneyFee (0.48% ramp, no cap)', () => {
  it('should charge 0.48% proportionally', () => {
    expect(computeAddMoneyFee(new Decimal(1000), 'USD').toFixed(2)).toBe('4.80');
    expect(computeAddMoneyFee(new Decimal(10000), 'BRL').toFixed(2)).toBe('48.00');
  });

  it('should NOT cap B2C — large adds pay proportionally (FE-1: $100k → $480)', () => {
    for (const currency of ['USD', 'BRL', 'EUR'] as const) {
      expect(computeAddMoneyFee(new Decimal(100_000), currency, 'b2c').toFixed(2)).toBe('480.00');
    }
  });

  it('should charge B2B identically to B2C (no cap either — FE-1 supersedes D-005)', () => {
    expect(computeAddMoneyFee(new Decimal(250_000), 'USD', 'b2b').toFixed(2)).toBe('1200.00');
    expect(computeAddMoneyFee(new Decimal(250_000), 'USD', 'b2c').toFixed(2)).toBe('1200.00');
  });
});

describe('computeExitFee (0.39% with floor, no cap)', () => {
  it('should charge 0.39% in the normal band', () => {
    expect(computeExitFee(new Decimal(1000), 'USD').toFixed(2)).toBe('3.90');
  });

  it('should apply the 0.25 floor on tiny exits (FE-1a: floor KEPT)', () => {
    for (const currency of ['USD', 'BRL', 'EUR'] as const) {
      const fee = computeExitFee(new Decimal(10), currency); // 0.39% = 0.039 → floored
      expect(fee.eq(EXIT_FEE_FLOOR[currency])).toBe(true);
    }
  });

  it('should NOT cap large exits — 0.39% proportional (FE-1a: caps removed)', () => {
    for (const currency of ['USD', 'BRL', 'EUR'] as const) {
      expect(computeExitFee(new Decimal(100_000), currency).toFixed(2)).toBe('390.00');
    }
  });
});

describe('MIN_ADD_MONEY (FE-1b transaction minimum)', () => {
  it('should be $10 / €10 / R$20 per market currency', () => {
    expect(MIN_ADD_MONEY.USD.eq(10)).toBe(true);
    expect(MIN_ADD_MONEY.EUR.eq(10)).toBe(true);
    expect(MIN_ADD_MONEY.BRL.eq(20)).toBe(true);
  });

  it('should bound the exit floor to ≤2.5% of the smallest position (the FE-1b rationale)', () => {
    for (const currency of ['USD', 'EUR', 'BRL'] as const) {
      const worstCase = EXIT_FEE_FLOOR[currency].div(MIN_ADD_MONEY[currency]);
      expect(worstCase.lte('0.025')).toBe(true);
    }
  });
});

describe('computeStrategyEntryFee', () => {
  it('should always be zero (Strategy Entry is FREE per FEES.md)', () => {
    expect(computeStrategyEntryFee().isZero()).toBe(true);
  });
});
