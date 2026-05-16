/**
 * Market Data Formula Tests
 *
 * Validates all canonical formulas from Section 15 of
 * docs/audit/PREPARING_FOR_ANALYTICS_DATA.md against
 * Section 16 reference values.
 *
 * All reference values were computed by running exact formulas
 * with 5-year average rates from Section 14.
 */

import { describe, it, expect } from 'vitest';
import {
  annualToMonthlyRate,
  selectInflationRate,
  calculateLumpSum,
  calculateMonthlyContributions,
  calculateWithCurrencyHedge,
  calculateMonthlyWithCurrencyHedge,
  monthsToInflationAdjustedTarget,
  monthsToStaticTarget,
  purchasingPower,
  calculateFee,
  applyPlatformFees,
} from '../formulas';
import { FALLBACK_MARKET_DATA } from '../constants';

// ─── annualToMonthlyRate ───────────────────────────────────────────────

describe('annualToMonthlyRate', () => {
  it('should convert 7% APY to monthly rate', () => {
    expect(annualToMonthlyRate(0.07)).toBeCloseTo(0.005654, 6);
  });

  it('should return 0 for 0% rate', () => {
    expect(annualToMonthlyRate(0)).toBe(0);
  });

  it('should throw for rate <= -100%', () => {
    expect(() => annualToMonthlyRate(-1)).toThrow();
    expect(() => annualToMonthlyRate(-1.5)).toThrow();
  });

  it('should handle negative rates above -100%', () => {
    expect(annualToMonthlyRate(-0.01)).toBeLessThan(0);
  });
});

// ─── selectInflationRate ───────────────────────────────────────────────

describe('selectInflationRate', () => {
  it('should use current inflation for <= 24 months', () => {
    expect(selectInflationRate('en', 12, FALLBACK_MARKET_DATA.inflationRates)).toBe(0.026);
    expect(selectInflationRate('en', 24, FALLBACK_MARKET_DATA.inflationRates)).toBe(0.026);
  });

  it('should use 5-year avg for > 24 months', () => {
    expect(selectInflationRate('en', 25, FALLBACK_MARKET_DATA.inflationRates)).toBe(0.045);
    expect(selectInflationRate('en', 360, FALLBACK_MARKET_DATA.inflationRates)).toBe(0.045);
  });

  it('should return locale-specific rates', () => {
    expect(selectInflationRate('pt-BR', 60, FALLBACK_MARKET_DATA.inflationRates)).toBe(0.059);
    expect(selectInflationRate('de', 60, FALLBACK_MARKET_DATA.inflationRates)).toBe(0.041);
  });
});

// ─── calculateMonthlyContributions ─────────────────────────────────────

describe('calculateMonthlyContributions', () => {
  it('should compute US 10% Rule (Section 16.1)', () => {
    const result = calculateMonthlyContributions(460, 0.07, 0.045, 60);
    expect(result.nominalFV).toBeCloseTo(32750, 0);
  });

  it('should compute US Christmas (Section 16.1)', () => {
    const result = calculateMonthlyContributions(500, 0.07, 0.045, 12);
    expect(result.nominalFV).toBeCloseTo(6190, 0);
  });

  it('should compute US Retirement (Section 16.1)', () => {
    const result = calculateMonthlyContributions(100, 0.07, 0.045, 360);
    expect(result.nominalFV).toBeCloseTo(116945, 0);
  });

  it('should compute US Bank 10% Rule at 5yr avg rate', () => {
    const result = calculateMonthlyContributions(460, 0.0032, 0.045, 60);
    expect(result.nominalFV).toBeCloseTo(27818, 0);
  });

  it('should handle zero rate', () => {
    const result = calculateMonthlyContributions(100, 0, 0.026, 12);
    expect(result.nominalFV).toBeCloseTo(1200, 0);
  });

  it('should compute real FV with inflation', () => {
    const result = calculateMonthlyContributions(100, 0.07, 0.045, 60);
    expect(result.realFV).toBeLessThan(result.nominalFV);
  });
});

// ─── calculateMonthlyWithCurrencyHedge ─────────────────────────────────

describe('calculateMonthlyWithCurrencyHedge', () => {
  it('should compute Brazil 10% Rule (Section 16.2)', () => {
    const result = calculateMonthlyWithCurrencyHedge(270, 0.07, 0.03, 0.059, 60);
    expect(result.nominalFV).toBeCloseTo(20777, 0);
  });

  it('should compute Brazil Christmas (Section 16.2)', () => {
    const result = calculateMonthlyWithCurrencyHedge(345, 0.07, 0.03, 0.059, 12);
    expect(result.nominalFV).toBeCloseTo(4330, 0);
  });

  it('should compute Brazil Retirement (Section 16.2)', () => {
    const result = calculateMonthlyWithCurrencyHedge(100, 0.07, 0.03, 0.059, 360);
    expect(result.nominalFV).toBeCloseTo(214853, 0);
  });

  it('should compute Germany 10% Rule (Section 16.3)', () => {
    const result = calculateMonthlyWithCurrencyHedge(220, 0.07, 0.009, 0.041, 60);
    expect(result.nominalFV).toBeCloseTo(16033, 0);
  });

  it('should compute Spain 10% Rule (Section 16.4)', () => {
    const result = calculateMonthlyWithCurrencyHedge(170, 0.07, 0.009, 0.041, 60);
    expect(result.nominalFV).toBeCloseTo(12389, 0);
  });

  it('should compute effective local APY for BRL', () => {
    const result = calculateMonthlyWithCurrencyHedge(100, 0.07, 0.03, 0, 12);
    expect(result.effectiveLocalAPY).toBeCloseTo(0.1021, 4);
  });

  it('should compute effective local APY for EUR', () => {
    const result = calculateMonthlyWithCurrencyHedge(100, 0.07, 0.009, 0, 12);
    expect(result.effectiveLocalAPY).toBeCloseTo(0.07963, 4);
  });

  it('should provide estimated USD equivalent', () => {
    const result = calculateMonthlyWithCurrencyHedge(100, 0.07, 0.03, 0.059, 360);
    expect(result.estimatedUsdEquivalent).toBeDefined();
    expect(result.estimatedUsdEquivalent).toBeLessThan(result.nominalFV);
  });
});

// ─── monthsToInflationAdjustedTarget ───────────────────────────────────

describe('monthsToInflationAdjustedTarget', () => {
  it('should compute US emergency fund timing (Section 16.1)', () => {
    const diboasMonths = monthsToInflationAdjustedTarget(17400, 300, 0.07, 0.045);
    const bankMonths = monthsToInflationAdjustedTarget(17400, 300, 0.0032, 0.045);
    expect(diboasMonths).toBe(61);
    expect(bankMonths).toBe(76);
  });

  it('should compute Brazil emergency fund timing (Section 16.2)', () => {
    const effectiveBR = (1 + 0.07) * (1 + 0.03) - 1;
    const diboasMonths = monthsToInflationAdjustedTarget(16200, 270, effectiveBR, 0.059);
    const bankMonths = monthsToInflationAdjustedTarget(16200, 270, 0.0683, 0.059);
    expect(diboasMonths).toBe(63);
    expect(bankMonths).toBe(69);
  });

  it('should compute Germany emergency fund timing (Section 16.3)', () => {
    const effectiveDE = (1 + 0.07) * (1 + 0.009) - 1;
    const diboasMonths = monthsToInflationAdjustedTarget(12000, 200, effectiveDE, 0.041);
    const bankMonths = monthsToInflationAdjustedTarget(12000, 200, 0.0122, 0.041);
    expect(diboasMonths).toBe(61);
    expect(bankMonths).toBe(75);
  });

  it('should throw for zero monthly payment', () => {
    expect(() => monthsToInflationAdjustedTarget(12000, 0, 0.07, 0.026)).toThrow();
  });

  it('should take longer than static target', () => {
    const staticMonths = monthsToStaticTarget(17400, 300, 0.07);
    const inflationMonths = monthsToInflationAdjustedTarget(17400, 300, 0.07, 0.045);
    expect(inflationMonths).toBeGreaterThan(staticMonths);
  });
});

// ─── monthsToStaticTarget ──────────────────────────────────────────────

describe('monthsToStaticTarget', () => {
  it('should handle zero rate', () => {
    expect(monthsToStaticTarget(12000, 200, 0)).toBe(60);
  });

  it('should handle very low rate', () => {
    const months = monthsToStaticTarget(100000, 500, 0.001);
    expect(months).toBeGreaterThanOrEqual(199);
    expect(months).toBeLessThanOrEqual(200);
  });

  it('should throw for zero payment', () => {
    expect(() => monthsToStaticTarget(12000, 0, 0.07)).toThrow();
  });
});

// ─── calculateFee ──────────────────────────────────────────────────────

describe('calculateFee', () => {
  it('should apply fee rate', () => {
    const result = calculateFee(100, 0.0039);
    expect(result.feeAmount).toBeCloseTo(0.39, 2);
    expect(result.netAmount).toBeCloseTo(99.61, 2);
  });

  it('should cap at maximum', () => {
    const result = calculateFee(10000, 0.0039, 0.25, 25.00);
    expect(result.feeAmount).toBe(25.00);
  });

  it('should floor at minimum', () => {
    const result = calculateFee(10, 0.0039, 0.25, 25.00);
    expect(result.feeAmount).toBe(0.25);
  });

  it('should return zero fee for zero rate', () => {
    const result = calculateFee(1000, 0);
    expect(result.feeAmount).toBe(0);
    expect(result.netAmount).toBe(1000);
  });
});

// ─── applyPlatformFees ─────────────────────────────────────────────────

describe('applyPlatformFees', () => {
  it('should apply entry and exit fees', () => {
    const result = applyPlatformFees(1000, 1100, 0.0048, 0.0039);
    expect(result.principalAfterEntry).toBeCloseTo(995.20, 2);
    expect(result.endAfterExit).toBeLessThan(1100);
  });

  it('should handle zero principal', () => {
    const result = applyPlatformFees(0, 1000, 0.0048, 0.0039);
    expect(result.principalAfterEntry).toBe(0);
    expect(result.endAfterExit).toBeLessThan(1000);
  });
});

// ─── calculateLumpSum ──────────────────────────────────────────────────

describe('calculateLumpSum', () => {
  it('should compute simple 1-year growth', () => {
    const result = calculateLumpSum(1000, 0.07, 0.026, 1);
    expect(result.nominalFV).toBeCloseTo(1070, 0);
    expect(result.nominalGain).toBeCloseTo(70, 0);
  });

  it('should compute real FV with inflation', () => {
    const result = calculateLumpSum(1000, 0.07, 0.045, 5);
    expect(result.realFV).toBeLessThan(result.nominalFV);
  });
});

// ─── calculateWithCurrencyHedge ────────────────────────────────────────

describe('calculateWithCurrencyHedge', () => {
  it('should compute Brazil 1-year lump sum', () => {
    const result = calculateWithCurrencyHedge(1000, 0.07, 0.03, 0.0426, 1);
    expect(result.effectiveLocalAPY).toBeCloseTo(0.1021, 4);
    expect(result.nominalFV).toBeCloseTo(1102, 0);
  });

  it('should handle negative inflation (deflation)', () => {
    const result = calculateWithCurrencyHedge(1000, 0.07, 0.03, -0.01, 1);
    expect(result.realFV).toBeGreaterThan(result.nominalFV);
  });
});

// ─── purchasingPower (Phase 6D.1) ──────────────────────────────────────

describe('purchasingPower', () => {
  it('should return amount unchanged at year 0', () => {
    expect(purchasingPower(1000, 0, 0.045)).toBeCloseTo(1000, 5);
  });

  it('should erode amount by ~36% over 10y at 4.5% inflation', () => {
    // 1000 / (1.045)^10 ≈ 643.93
    expect(purchasingPower(1000, 10, 0.045)).toBeCloseTo(643.93, 1);
  });

  it('should erode amount by ~26% over 10y at 3.0% inflation (BR-style)', () => {
    // 1000 / (1.03)^10 ≈ 744.09
    expect(purchasingPower(1000, 10, 0.03)).toBeCloseTo(744.09, 1);
  });

  it('should be unchanged when inflation is 0', () => {
    expect(purchasingPower(1000, 25, 0)).toBe(1000);
  });

  it('should grow amount when inflation is negative (deflation)', () => {
    expect(purchasingPower(1000, 5, -0.02)).toBeGreaterThan(1000);
  });

  it('should throw when years is negative', () => {
    expect(() => purchasingPower(1000, -1, 0.045)).toThrow();
  });

  it('should be inverse of compound growth (round-trip identity)', () => {
    const principal = 1000;
    const rate = 0.07;
    const years = 10;
    const fv = principal * Math.pow(1 + rate, years);
    expect(purchasingPower(fv, years, rate)).toBeCloseTo(principal, 5);
  });
});

// ─── monthsToInflationAdjustedTarget — initialAmount path (Phase 6D.2) ──

describe('monthsToInflationAdjustedTarget — initialAmount support', () => {
  it('should return 0 when initialAmount already meets target', () => {
    expect(monthsToInflationAdjustedTarget(1000, 100, 0.07, 0, 'end', 1500)).toBe(0);
    expect(monthsToInflationAdjustedTarget(1000, 100, 0.07, 0, 'end', 1000)).toBe(0);
  });

  it('should reach target faster with non-zero initialAmount', () => {
    const withSeed = monthsToInflationAdjustedTarget(10000, 100, 0.07, 0, 'end', 5000);
    const withoutSeed = monthsToInflationAdjustedTarget(10000, 100, 0.07, 0, 'end', 0);
    expect(withSeed).toBeLessThan(withoutSeed);
  });

  it('should default initialAmount to 0 when not provided (backwards-compat)', () => {
    const a = monthsToInflationAdjustedTarget(10000, 200, 0.07, 0);
    const b = monthsToInflationAdjustedTarget(10000, 200, 0.07, 0, 'end', 0);
    expect(a).toBe(b);
  });

  it('should throw when both monthlyPayment and initialAmount are 0', () => {
    expect(() => monthsToInflationAdjustedTarget(1000, 0, 0.07, 0, 'end', 0)).toThrow();
  });

  it('should still work with monthlyPayment=0 if initialAmount can grow to target', () => {
    // No regression on the original guard: monthlyPayment <= 0 used to throw
    // unconditionally. Now it's allowed when initialAmount > 0.
    const months = monthsToInflationAdjustedTarget(2000, 0, 0.07, 0, 'end', 1000);
    // 1000 * 1.00566^months ≥ 2000  → ~123 months ≈ 10.3 years
    expect(months).toBeGreaterThan(110);
    expect(months).toBeLessThan(140);
  });
});

// ─── Phase A (2026-05-16) — calibration: historical anchor fields ──────

describe('Phase A — exchange-rate historical anchors', () => {
  it('BRL.historicalCagr matches research-verified 6.71% within 0.1pp', () => {
    expect(FALLBACK_MARKET_DATA.exchangeRates.rates.BRL.historicalCagr).toBeCloseTo(0.0671, 3);
  });

  it('EUR.historicalCagr matches research-verified 1.45% within 0.1pp', () => {
    expect(FALLBACK_MARKET_DATA.exchangeRates.rates.EUR.historicalCagr).toBeCloseTo(0.0145, 3);
  });

  it('BRL historical anchors span Jan 2010 → May 2026', () => {
    const brl = FALLBACK_MARKET_DATA.exchangeRates.rates.BRL;
    expect(brl.historicalAnchorStart).toBe('2010-01-01');
    expect(brl.historicalAnchorEnd).toBe('2026-05-15');
    expect(brl.historicalRateStart).toBeCloseTo(1.78, 2);
    expect(brl.historicalRateEnd).toBeCloseTo(5.50, 2);
  });

  it('EUR historical anchors span Jan 2010 → May 2026', () => {
    const eur = FALLBACK_MARKET_DATA.exchangeRates.rates.EUR;
    expect(eur.historicalAnchorStart).toBe('2010-01-01');
    expect(eur.historicalAnchorEnd).toBe('2026-05-15');
    expect(eur.historicalRateStart).toBeCloseTo(1.43, 2);
    expect(eur.historicalRateEnd).toBeCloseTo(1.13, 2);
  });

  it('forward annualDepreciation unchanged (no regression for existing calculators)', () => {
    expect(FALLBACK_MARKET_DATA.exchangeRates.rates.BRL.annualDepreciation).toBe(0.03);
    expect(FALLBACK_MARKET_DATA.exchangeRates.rates.EUR.annualDepreciation).toBe(0.009);
  });
});

describe('Phase A — inflation cumulative-since-2010 fields', () => {
  it('US cumulative inflation 2010→2026 matches BLS CPI-U 52.3%', () => {
    expect(FALLBACK_MARKET_DATA.inflationRates.rates.en.cumulativeSince2010).toBeCloseTo(0.523, 3);
  });

  it('Brazil cumulative inflation 2010→2026 matches IBGE IPCA 145%', () => {
    expect(FALLBACK_MARKET_DATA.inflationRates.rates['pt-BR'].cumulativeSince2010).toBeCloseTo(1.45, 2);
  });

  it('Germany cumulative inflation 2010→2026 matches Destatis 41%', () => {
    expect(FALLBACK_MARKET_DATA.inflationRates.rates.de.cumulativeSince2010).toBeCloseTo(0.41, 2);
  });

  it('Spain cumulative inflation 2010→2026 matches INE 41%', () => {
    expect(FALLBACK_MARKET_DATA.inflationRates.rates.es.cumulativeSince2010).toBeCloseTo(0.41, 2);
  });

  it('forward current + average5y unchanged (no regression)', () => {
    const en = FALLBACK_MARKET_DATA.inflationRates.rates.en;
    expect(en.current).toBe(0.026);
    expect(en.average5y).toBe(0.045);
  });

  it('average16y is geometric average of cumulativeSince2010 over 16.33 years', () => {
    // (1 + cumulative)^(1/16.33) − 1
    const en = FALLBACK_MARKET_DATA.inflationRates.rates.en;
    const derived = Math.pow(1 + (en.cumulativeSince2010 ?? 0), 1 / 16.33) - 1;
    expect(en.average16y).toBeCloseTo(derived, 3);
  });
});

describe('Phase A — asset prices refreshed to May 2026', () => {
  it('BTC spot matches research May 2026 anchor (~$80k)', () => {
    expect(FALLBACK_MARKET_DATA.assetPrices.crypto.BTC).toBe(80000);
  });

  it('updatedAt stamp reflects May 2026 refresh (not stale March)', () => {
    expect(FALLBACK_MARKET_DATA.assetPrices.updatedAt).toBe('2026-05-15T00:00:00Z');
  });
});
