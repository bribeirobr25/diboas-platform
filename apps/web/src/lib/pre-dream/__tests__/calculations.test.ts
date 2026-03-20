/**
 * PreDream Calculation Tests
 *
 * All reference values verified by CTO Board using:
 * FV = S * (1+r)^n + PMT * ((1+r)^n - 1) / r
 * where r = (1 + APY/100)^(1/12) - 1
 */

import { describe, it, expect } from 'vitest';
import { futureValue, apyToMonthlyRate } from '@/lib/utils/financialMath';
import { calculatePreDreamResult, resolveBankRate, resolveStrategyApy } from '../calculations';

// ─── futureValue (from financialMath) ────────────────────────────────

describe('futureValue (from financialMath)', () => {
  it('should return initial amount when months is 0', () => {
    expect(futureValue(1000, 100, 0.005, 0)).toBe(1000);
  });

  it('should return simple sum when rate is 0', () => {
    expect(futureValue(1000, 100, 0, 12)).toBe(1000 + 100 * 12);
  });

  it('should calculate lump sum correctly with no monthly contribution', () => {
    // $1000 at 7% APY for 12 months
    const rate = apyToMonthlyRate(7);
    const result = futureValue(1000, 0, rate, 12);
    expect(result).toBeCloseTo(1070.0, 1);
  });

  it('should calculate annuity correctly with no initial amount', () => {
    // $0 initial, $100/month at 7% APY for 120 months = $17,105.17
    const rate = apyToMonthlyRate(7);
    const result = futureValue(0, 100, rate, 120);
    expect(result).toBeCloseTo(17105.17, 1);
  });

  it('should combine lump sum and annuity correctly', () => {
    // $1000 initial + $100/month at 7% APY for 12 months = $2,308.03
    const rate = apyToMonthlyRate(7);
    const result = futureValue(1000, 100, rate, 12);
    expect(result).toBeCloseTo(2308.03, 1);
  });
});

// ─── calculatePreDreamResult ─────────────────────────────────────────

describe('calculatePreDreamResult', () => {
  const US_BANK_APY = 0.45;
  const BR_BANK_APY = 7.50;
  const EU_BANK_APY = 3.25;

  // Safety (7% APY), $0 initial, $100/month
  it('should calculate Safety 7%, 1yr = $1,238.03', () => {
    const result = calculatePreDreamResult('safety', '1year', 0, 100, US_BANK_APY);
    expect(result.defiBalance).toBeCloseTo(1238.03, 1);
  });

  it('should calculate Safety 7%, 3yr = $3,980.14', () => {
    const result = calculatePreDreamResult('safety', '3years', 0, 100, US_BANK_APY);
    expect(result.defiBalance).toBeCloseTo(3980.14, 1);
  });

  it('should calculate Safety 7%, 5yr = $7,119.59', () => {
    const result = calculatePreDreamResult('safety', '5years', 0, 100, US_BANK_APY);
    expect(result.defiBalance).toBeCloseTo(7119.59, 1);
  });

  it('should calculate Safety 7%, 10yr = $17,105.17', () => {
    const result = calculatePreDreamResult('safety', '10years', 0, 100, US_BANK_APY);
    expect(result.defiBalance).toBeCloseTo(17105.17, 1);
  });

  // Balance (12% APY), $0 initial, $100/month
  it('should calculate Balance 12%, 1yr = $1,264.65', () => {
    const result = calculatePreDreamResult('balance', '1year', 0, 100, US_BANK_APY);
    expect(result.defiBalance).toBeCloseTo(1264.65, 1);
  });

  it('should calculate Balance 12%, 3yr = $4,267.43', () => {
    const result = calculatePreDreamResult('balance', '3years', 0, 100, US_BANK_APY);
    expect(result.defiBalance).toBeCloseTo(4267.43, 1);
  });

  it('should calculate Balance 12%, 5yr = $8,034.13', () => {
    const result = calculatePreDreamResult('balance', '5years', 0, 100, US_BANK_APY);
    expect(result.defiBalance).toBeCloseTo(8034.13, 1);
  });

  it('should calculate Balance 12%, 10yr = $22,193.00', () => {
    const result = calculatePreDreamResult('balance', '10years', 0, 100, US_BANK_APY);
    expect(result.defiBalance).toBeCloseTo(22193.00, 1);
  });

  // Growth (18% APY), $0 initial, $100/month
  it('should calculate Growth 18%, 1yr = $1,296.04', () => {
    const result = calculatePreDreamResult('growth', '1year', 0, 100, US_BANK_APY);
    expect(result.defiBalance).toBeCloseTo(1296.04, 1);
  });

  it('should calculate Growth 18%, 3yr = $4,629.98', () => {
    const result = calculatePreDreamResult('growth', '3years', 0, 100, US_BANK_APY);
    expect(result.defiBalance).toBeCloseTo(4629.98, 1);
  });

  it('should calculate Growth 18%, 5yr = $9,272.16', () => {
    const result = calculatePreDreamResult('growth', '5years', 0, 100, US_BANK_APY);
    expect(result.defiBalance).toBeCloseTo(9272.16, 1);
  });

  it('should calculate Growth 18%, 10yr = $30,484.62', () => {
    const result = calculatePreDreamResult('growth', '10years', 0, 100, US_BANK_APY);
    expect(result.defiBalance).toBeCloseTo(30484.62, 1);
  });

  // Bank comparison, $0 initial, $100/month, 10yr
  it('should calculate US bank 0.45% = $12,271.18', () => {
    const result = calculatePreDreamResult('safety', '10years', 0, 100, US_BANK_APY);
    expect(result.bankBalance).toBeCloseTo(12271.18, 1);
  });

  it('should calculate BR bank 7.50% = $17,552.45', () => {
    const result = calculatePreDreamResult('safety', '10years', 0, 100, BR_BANK_APY);
    expect(result.bankBalance).toBeCloseTo(17552.45, 1);
  });

  it('should calculate EU bank 3.25% = $14,122.19', () => {
    const result = calculatePreDreamResult('safety', '10years', 0, 100, EU_BANK_APY);
    expect(result.bankBalance).toBeCloseTo(14122.19, 1);
  });

  // With starting amount: Safety 7%, $1000 initial, $100/month
  it('should calculate Safety+$1000, 1yr = $2,308.03', () => {
    const result = calculatePreDreamResult('safety', '1year', 1000, 100, US_BANK_APY);
    expect(result.defiBalance).toBeCloseTo(2308.03, 1);
  });

  it('should calculate Safety+$1000, 3yr = $5,205.18', () => {
    const result = calculatePreDreamResult('safety', '3years', 1000, 100, US_BANK_APY);
    expect(result.defiBalance).toBeCloseTo(5205.18, 1);
  });

  it('should calculate Safety+$1000, 5yr = $8,522.14', () => {
    const result = calculatePreDreamResult('safety', '5years', 1000, 100, US_BANK_APY);
    expect(result.defiBalance).toBeCloseTo(8522.14, 1);
  });

  it('should calculate Safety+$1000, 10yr = $19,072.32', () => {
    const result = calculatePreDreamResult('safety', '10years', 1000, 100, US_BANK_APY);
    expect(result.defiBalance).toBeCloseTo(19072.32, 1);
  });

  // Brazil depreciation
  it('should apply 6% annual BRL depreciation to bank interest for pt-BR', () => {
    const result = calculatePreDreamResult('safety', '10years', 0, 100, BR_BANK_APY, 0.06);
    // Bank interest before depreciation: 17552.45 - 12000 = 5552.45
    // Depreciation factor: (1 - 0.06)^10 = 0.53861...
    // Adjusted bank interest: 5552.45 * 0.53861... = 2990.64
    // Adjusted bank balance: 12000 + 2990.64 = 14990.64
    expect(result.bankBalance).toBeCloseTo(14990.64, 0);
    expect(result.bankInterest).toBeCloseTo(2990.64, 0);
    // Verify depreciation reduced bank balance below the non-deprecated value
    const resultNoDep = calculatePreDreamResult('safety', '10years', 0, 100, BR_BANK_APY, 0);
    expect(result.bankBalance).toBeLessThan(resultNoDep.bankBalance);
  });

  it('should not apply depreciation for US/EU locales', () => {
    const result = calculatePreDreamResult('safety', '10years', 0, 100, US_BANK_APY, 0);
    expect(result.bankBalance).toBeCloseTo(12271.18, 1);
  });

  // Edge cases
  it('should handle $0 initial and $0 monthly', () => {
    const result = calculatePreDreamResult('safety', '1year', 0, 0, US_BANK_APY);
    expect(result.totalInvestment).toBe(0);
    expect(result.defiBalance).toBe(0);
    expect(result.bankBalance).toBe(0);
    expect(result.difference).toBe(0);
  });

  it('should handle $10000 initial and $0 monthly', () => {
    const result = calculatePreDreamResult('safety', '1year', 10000, 0, US_BANK_APY);
    expect(result.totalInvestment).toBe(10000);
    expect(result.defiBalance).toBeCloseTo(10700, 0);
  });

  it('should handle $0 initial and $1000 monthly', () => {
    const result = calculatePreDreamResult('safety', '1year', 0, 1000, US_BANK_APY);
    expect(result.totalInvestment).toBe(12000);
    expect(result.defiBalance).toBeCloseTo(12380.3, 0);
  });

  it('should return 0 growthPercentage when totalInvestment is 0', () => {
    const result = calculatePreDreamResult('safety', '1year', 0, 0, US_BANK_APY);
    expect(result.growthPercentage).toBe(0);
  });

  it('should include bankApy in result', () => {
    const result = calculatePreDreamResult('safety', '1year', 0, 100, US_BANK_APY);
    expect(result.bankApy).toBe(US_BANK_APY);
  });
});

// ─── resolveBankRate ─────────────────────────────────────────────────

describe('resolveBankRate', () => {
  it('should return override APY when provided', () => {
    const rate = resolveBankRate('en', 5.0);
    expect(rate.apy).toBe(5.0);
  });

  it('should return US FDIC rate (0.45%) for en locale', () => {
    const rate = resolveBankRate('en');
    expect(rate.apy).toBe(0.45);
  });

  it('should return Selic rate (7.50%) for pt-BR locale', () => {
    const rate = resolveBankRate('pt-BR');
    expect(rate.apy).toBe(7.50);
  });

  it('should return ECB rate (3.25%) for de locale', () => {
    const rate = resolveBankRate('de');
    expect(rate.apy).toBe(3.25);
  });

  it('should return ECB rate (3.25%) for es locale', () => {
    const rate = resolveBankRate('es');
    expect(rate.apy).toBe(3.25);
  });

  it('should return currencyDepreciation 0.06 for pt-BR', () => {
    const rate = resolveBankRate('pt-BR');
    expect(rate.currencyDepreciation).toBe(0.06);
  });

  it('should return currencyDepreciation 0 for non-BR locales', () => {
    expect(resolveBankRate('en').currencyDepreciation).toBe(0);
    expect(resolveBankRate('de').currencyDepreciation).toBe(0);
    expect(resolveBankRate('es').currencyDepreciation).toBe(0);
  });

  it('should return US default for unknown locale', () => {
    const rate = resolveBankRate('ja');
    expect(rate.apy).toBe(0.45);
    expect(rate.currencyDepreciation).toBe(0);
  });

  it('should ignore negative override and use locale rate', () => {
    const rate = resolveBankRate('en', -1);
    expect(rate.apy).toBe(0.45);
  });
});

// ─── resolveStrategyApy ─────────────────────────────────────────────

describe('resolveStrategyApy', () => {
  it('should return hardcoded fallback when no override provided', () => {
    expect(resolveStrategyApy('safety')).toBe(7);
    expect(resolveStrategyApy('balance')).toBe(12);
    expect(resolveStrategyApy('growth')).toBe(18);
  });

  it('should return override when provided for a specific path', () => {
    expect(resolveStrategyApy('safety', { safety: 8.5 })).toBe(8.5);
    expect(resolveStrategyApy('balance', { balance: 14 })).toBe(14);
    expect(resolveStrategyApy('growth', { growth: 22 })).toBe(22);
  });

  it('should return fallback for paths not in overrides', () => {
    expect(resolveStrategyApy('balance', { safety: 8.5 })).toBe(12);
    expect(resolveStrategyApy('growth', { safety: 8.5, balance: 14 })).toBe(18);
  });

  it('should ignore zero override and use fallback', () => {
    expect(resolveStrategyApy('safety', { safety: 0 })).toBe(7);
  });

  it('should ignore negative override and use fallback', () => {
    expect(resolveStrategyApy('safety', { safety: -5 })).toBe(7);
  });

  it('should return fallback when overrides is undefined', () => {
    expect(resolveStrategyApy('safety', undefined)).toBe(7);
  });
});

// ─── calculatePreDreamResult with defiApy override ──────────────────

describe('calculatePreDreamResult with defiApy override', () => {
  it('should use provided defiApy instead of path default', () => {
    const result = calculatePreDreamResult('safety', '10years', 0, 100, 0.45, 0, 10);
    // 10% APY, not the default 7%
    expect(result.pathApy).toBe(10);
    expect(result.defiBalance).toBeGreaterThan(17105); // Should be more than 7% result
  });

  it('should fall back to path APY when defiApy is undefined', () => {
    const result = calculatePreDreamResult('safety', '10years', 0, 100, 0.45, 0);
    expect(result.pathApy).toBe(7);
    expect(result.defiBalance).toBeCloseTo(17105.17, 0);
  });
});
