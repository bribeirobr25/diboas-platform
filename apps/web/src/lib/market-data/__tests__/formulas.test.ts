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
  calculateMonthlyPathDependentHedge,
  buildMonthlyValuePath,
  buildHedgedMonthlyValuePath,
  monthsToInflationAdjustedTarget,
  monthsToStaticTarget,
  purchasingPower,
  calculateFee,
  applyPlatformFees,
} from '../formulas';
import type { FxBucket } from '../types';
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
    // Phase C (TOOLS_IMPROVEMENT.md, 2026-05-23): en.current updated to 0.038
    // (April 2026 BLS CPI-U live).
    expect(selectInflationRate('en', 12, FALLBACK_MARKET_DATA.inflationRates)).toBe(0.038);
    expect(selectInflationRate('en', 24, FALLBACK_MARKET_DATA.inflationRates)).toBe(0.038);
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
    const result = calculateFee(10000, 0.0039, 0.25, 25.0);
    expect(result.feeAmount).toBe(25.0);
  });

  it('should floor at minimum', () => {
    const result = calculateFee(10, 0.0039, 0.25, 25.0);
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
    expect(result.principalAfterEntry).toBeCloseTo(995.2, 2);
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

describe('Phase A (2026-05-16) / Phase C (2026-05-23 TOOLS_IMPROVEMENT) — exchange-rate historical anchors', () => {
  it('BRL.historicalCagr matches Phase A live BCB PTAX full-series CAGR (6.21%)', () => {
    // Phase C: refreshed from research-narrative 6.71% to live full-series
    // CAGR Jan 2010 → May 2026 = 6.21% (Phase A measurement).
    expect(FALLBACK_MARKET_DATA.exchangeRates.rates.BRL.historicalCagr).toBeCloseTo(0.0621, 3);
  });

  it('EUR.historicalCagr matches Phase A live ECB EXR full-series CAGR (1.23%)', () => {
    // Phase C: refreshed from research-narrative 1.45% to live full-series
    // EUR-depreciation CAGR Jan 2010 → Apr 2026 = 1.23% (sign-corrected per
    // Phase A; ECB EXR inverted to EUR_per_USD canonical form).
    expect(FALLBACK_MARKET_DATA.exchangeRates.rates.EUR.historicalCagr).toBeCloseTo(0.0123, 3);
  });

  it('BRL historical anchors span Jan 2010 → May 2026 (Phase A live)', () => {
    const brl = FALLBACK_MARKET_DATA.exchangeRates.rates.BRL;
    expect(brl.historicalAnchorStart).toBe('2010-01-01');
    expect(brl.historicalAnchorEnd).toBe('2026-05-22');
    expect(brl.historicalRateStart).toBeCloseTo(1.874, 2);
    expect(brl.historicalRateEnd).toBeCloseTo(5.0134, 2);
  });

  it('EUR historical anchors span Jan 2010 → Apr 2026 (Phase A live)', () => {
    const eur = FALLBACK_MARKET_DATA.exchangeRates.rates.EUR;
    expect(eur.historicalAnchorStart).toBe('2010-01-01');
    expect(eur.historicalAnchorEnd).toBe('2026-04-30');
    expect(eur.historicalRateStart).toBeCloseTo(1.4272, 2);
    expect(eur.historicalRateEnd).toBeCloseTo(1.1706, 2);
  });

  it('forward annualDepreciation matches calibrated values per FX-16 D1/D8', () => {
    // BRL 0.0621 (live full-series, Phase C / PT1 unchanged).
    // EUR 0.0055 (FX-16 adoption D1, Bar 2026-05-26): forward calibration assumption
    // from long-horizon FRED AEXUSEU annual series — supersedes prior PT3 1.23%
    // which was an endpoint-pair retrospective CAGR mistakenly placed in the
    // forward field. 1.23% now lives in `historicalCagr` only.
    expect(FALLBACK_MARKET_DATA.exchangeRates.rates.BRL.annualDepreciation).toBeCloseTo(0.0621, 4);
    expect(FALLBACK_MARKET_DATA.exchangeRates.rates.EUR.annualDepreciation).toBeCloseTo(0.0055, 4);
  });
});

describe('Phase A — inflation cumulative-since-2010 fields', () => {
  it('US cumulative inflation 2010→2026 matches BLS CPI-U 52.3%', () => {
    expect(FALLBACK_MARKET_DATA.inflationRates.rates.en.cumulativeSince2010).toBeCloseTo(0.523, 3);
  });

  it('Brazil cumulative inflation 2010→2026 matches IBGE IPCA 145%', () => {
    expect(FALLBACK_MARKET_DATA.inflationRates.rates['pt-BR'].cumulativeSince2010).toBeCloseTo(
      1.45,
      2
    );
  });

  it('Germany cumulative inflation 2010→2026 matches Destatis 41%', () => {
    expect(FALLBACK_MARKET_DATA.inflationRates.rates.de.cumulativeSince2010).toBeCloseTo(0.41, 2);
  });

  it('Spain cumulative inflation 2010→2026 matches INE 41%', () => {
    expect(FALLBACK_MARKET_DATA.inflationRates.rates.es.cumulativeSince2010).toBeCloseTo(0.41, 2);
  });

  it('forward current matches Phase C live April 2026 BLS print; average5y stays quarterly-refreshed', () => {
    // Phase C (TOOLS_IMPROVEMENT.md, 2026-05-23): `current` refreshed to live
    // April 2026 print (0.038); `average5y` stays at 0.045 per Decision F2
    // until next quarterly refresh (Decision X1).
    const en = FALLBACK_MARKET_DATA.inflationRates.rates.en;
    expect(en.current).toBe(0.038);
    expect(en.average5y).toBe(0.045);
  });

  it('average16y is geometric average of cumulativeSince2010 over 16.33 years', () => {
    // (1 + cumulative)^(1/16.33) − 1
    const en = FALLBACK_MARKET_DATA.inflationRates.rates.en;
    const derived = Math.pow(1 + (en.cumulativeSince2010 ?? 0), 1 / 16.33) - 1;
    expect(en.average16y).toBeCloseTo(derived, 3);
  });
});

describe('Phase A (2026-05-16) / Phase C (2026-05-23) — asset prices refreshed', () => {
  it('BTC spot matches Phase C live May 22 2026 anchor (Fortune $77,262)', () => {
    // Phase C: refreshed from $80,000 (Phase A May 15 anchor) to $77,262
    // (Fortune May 21 09:15 ET — Phase A reconciliation reference).
    expect(FALLBACK_MARKET_DATA.assetPrices.crypto.BTC).toBe(77262);
  });

  it('updatedAt stamp reflects Phase C 2026-05-22 refresh', () => {
    expect(FALLBACK_MARKET_DATA.assetPrices.updatedAt).toBe('2026-05-22T00:00:00Z');
  });
});

// ─── Phase B (2026-05-16) — path-dependent currency hedge ──────────────

/**
 * Brazilian DCA reference buckets — sourced from
 * docs/researches/btc-vs-assets-inflation-fx-final-analysis.md §Part 5
 * Methodology. 4 coarse buckets covering Jan 2010 → May 2026 inclusive.
 * Phase C will ship these same bucket values to historical.ts; for now the
 * test embeds them so Phase B is self-contained per §6.2 PR-2 vs PR-3.
 */
const BRL_RESEARCH_BUCKETS: readonly FxBucket[] = [
  { avgRate: 2.0, startDate: '2010-01-01', endDate: '2014-12-31' },
  { avgRate: 3.5, startDate: '2015-01-01', endDate: '2019-12-31' },
  { avgRate: 5.2, startDate: '2020-01-01', endDate: '2024-12-31' },
  { avgRate: 5.65, startDate: '2025-01-01', endDate: '2026-05-31' },
] as const;

describe('Phase B — calculateMonthlyPathDependentHedge (research Part 5 cross-validation)', () => {
  // Research Part 5: R$100/mo × 196 months, end-of-month timing, USD-yield
  // scenarios, FX bucket walk, reconverted at endRate 5.50 (May 2026 spot).
  const baseArgs = {
    monthlyContributionLocal: 100,
    startDate: '2010-01-01',
    months: 196,
    buckets: BRL_RESEARCH_BUCKETS,
    endRate: 5.5,
  };

  it('Scenario D (10% USD): matches research R$94,765 ± 5%', () => {
    const result = calculateMonthlyPathDependentHedge({ ...baseArgs, usdAnnualYield: 0.1 });
    expect(result.finalBalanceLocal).toBeGreaterThan(94765 * 0.95);
    expect(result.finalBalanceLocal).toBeLessThan(94765 * 1.05);
  });

  it('Scenario C (7% USD): matches research R$69,160 ± 5%', () => {
    const result = calculateMonthlyPathDependentHedge({ ...baseArgs, usdAnnualYield: 0.07 });
    expect(result.finalBalanceLocal).toBeGreaterThan(69160 * 0.95);
    expect(result.finalBalanceLocal).toBeLessThan(69160 * 1.05);
  });

  it('Scenario B (5% USD): matches research R$57,400 ± 5%', () => {
    const result = calculateMonthlyPathDependentHedge({ ...baseArgs, usdAnnualYield: 0.05 });
    expect(result.finalBalanceLocal).toBeGreaterThan(57400 * 0.95);
    expect(result.finalBalanceLocal).toBeLessThan(57400 * 1.05);
  });

  it('totalContributedLocal = monthlyContribution × months across all scenarios', () => {
    const result = calculateMonthlyPathDependentHedge({ ...baseArgs, usdAnnualYield: 0.07 });
    expect(result.totalContributedLocal).toBe(19600);
  });

  it('reports a positive effectiveLocalCagr when finalBalance exceeds contributions', () => {
    const result = calculateMonthlyPathDependentHedge({ ...baseArgs, usdAnnualYield: 0.1 });
    // Scenario D 10% USD ≈ 16-17% effective BRL (FX tailwind on top of USD yield)
    expect(result.effectiveLocalCagr).toBeGreaterThan(0.13);
    expect(result.effectiveLocalCagr).toBeLessThan(0.2);
  });
});

describe('Phase B — path-dependent hedge edge cases', () => {
  it('1-bucket window (no path variation) approximates the smoothed model', () => {
    // 5-year window, single bucket with constant rate. The path-dependent
    // and smoothed-CAGR models converge when there is no FX path variation
    // within the window (no bucket-walk gain to capture).
    const buckets: FxBucket[] = [{ avgRate: 5.5, startDate: '2021-01-01', endDate: '2026-05-31' }];
    const pathResult = calculateMonthlyPathDependentHedge({
      monthlyContributionLocal: 100,
      usdAnnualYield: 0.07,
      startDate: '2021-01-01',
      months: 60,
      buckets,
      endRate: 5.5,
    });
    // Smoothed model with 0% depreciation (single bucket → no path bias)
    const smoothedResult = calculateMonthlyWithCurrencyHedge(
      100, // local-currency contribution per month
      0.07, // USD yield
      0, // no depreciation within the bucket
      0, // ignore inflation for this convergence test
      60
    );
    // Smoothed nominalFV is in local-currency assuming initial conversion at
    // rate 1; we compare USD-equivalent slices. Path result's finalBalanceUsd
    // should match smoothed's nominalFV / 5.50 (since 100 BRL = 100/5.50 USD
    // every month under the constant-rate bucket).
    const expectedUsd = smoothedResult.nominalFV / 5.5;
    expect(pathResult.finalBalanceUsd).toBeCloseTo(expectedUsd, 1);
  });

  it('throws when buckets array is empty', () => {
    expect(() =>
      calculateMonthlyPathDependentHedge({
        monthlyContributionLocal: 100,
        usdAnnualYield: 0.07,
        startDate: '2020-01-01',
        months: 12,
        buckets: [],
        endRate: 5.5,
      })
    ).toThrow(/at least one FxBucket/);
  });

  it('throws when a month falls outside all bucket windows', () => {
    const buckets: FxBucket[] = [{ avgRate: 5.2, startDate: '2020-01-01', endDate: '2020-12-31' }];
    expect(() =>
      calculateMonthlyPathDependentHedge({
        monthlyContributionLocal: 100,
        usdAnnualYield: 0.07,
        startDate: '2020-01-01',
        months: 24, // month 13 = Jan 2021 — uncovered
        buckets,
        endRate: 5.5,
      })
    ).toThrow(/No FxBucket covers/);
  });

  it('throws on non-positive months', () => {
    expect(() =>
      calculateMonthlyPathDependentHedge({
        monthlyContributionLocal: 100,
        usdAnnualYield: 0.07,
        startDate: '2020-01-01',
        months: 0,
        buckets: BRL_RESEARCH_BUCKETS,
        endRate: 5.5,
      })
    ).toThrow(/months must be > 0/);
  });

  it('throws on non-positive endRate', () => {
    expect(() =>
      calculateMonthlyPathDependentHedge({
        monthlyContributionLocal: 100,
        usdAnnualYield: 0.07,
        startDate: '2020-01-01',
        months: 12,
        buckets: BRL_RESEARCH_BUCKETS,
        endRate: 0,
      })
    ).toThrow(/endRate must be > 0/);
  });

  it('throws on bucket with non-positive avgRate', () => {
    const buckets: FxBucket[] = [{ avgRate: 0, startDate: '2020-01-01', endDate: '2020-12-31' }];
    expect(() =>
      calculateMonthlyPathDependentHedge({
        monthlyContributionLocal: 100,
        usdAnnualYield: 0.07,
        startDate: '2020-01-01',
        months: 6,
        buckets,
        endRate: 5.5,
      })
    ).toThrow(/avgRate must be > 0/);
  });
});

// ─── buildMonthlyValuePath / buildHedgedMonthlyValuePath ───────────────────
// Chart value-path helpers (ComparisonTable "data as hero" divergence line).
describe('buildMonthlyValuePath', () => {
  it('should return months + 1 points starting at the principal', () => {
    const path = buildMonthlyValuePath(1000, 0.07, 12);
    expect(path).toHaveLength(13);
    expect(path[0]).toBe(1000); // month 0 = principal (no growth yet)
  });

  it('should compound geometrically so month 12 == principal * (1 + annualRate)', () => {
    const path = buildMonthlyValuePath(1000, 0.07, 12);
    expect(path[12]).toBeCloseTo(1000 * 1.07, 6);
  });
});

describe('buildHedgedMonthlyValuePath', () => {
  it('should make the 12-month endpoint agree with calculateWithCurrencyHedge (chart == table figure)', () => {
    const principal = 1000;
    const usdYield = 0.07;
    const depreciation = 0.05; // BRL-like positive depreciation
    const path = buildHedgedMonthlyValuePath(
      principal,
      usdYield,
      depreciation,
      12,
      'test'
    );
    // The chart's diBoaS endpoint must equal the table's nominal future value
    // (principal + nominalGain) — proving both share one clamped formula.
    const table = calculateWithCurrencyHedge(principal, usdYield, depreciation, 0, 1);
    expect(path[12]).toBeCloseTo(principal + table.nominalGain, 6);
    expect(path[12]).toBeCloseTo(table.nominalFV, 6);
  });

  it('should apply the effective-rate clamp on pathological depreciation', () => {
    // depreciation <= -1 would drive the effective rate below the -0.99 floor;
    // the hedged path must clamp (not produce NaN/complex via Math.pow).
    const path = buildHedgedMonthlyValuePath(1000, 0.07, -1.5, 12, 'test');
    expect(path).toHaveLength(13);
    expect(Number.isFinite(path[12])).toBe(true);
    // clamped to -0.99 → month 12 = 1000 * (1 - 0.99) = 10
    expect(path[12]).toBeCloseTo(10, 6);
  });
});
