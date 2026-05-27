/**
 * Phase 2 §2.4 — `lib/currency-depreciation/` extraction regression tests.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCurrencyDepreciationForward,
  calculateCurrencyDepreciationRetrospective,
  CURRENCY_DEPRECIATION_OPTIONS,
  CURRENCY_DEPRECIATION_SCENARIO_USD_PERCENT,
  CURRENCY_TO_LOCALE,
  getBankRateForCurrency,
} from '../calculator';
import { CURRENCY_BUCKET } from '../buckets';
import { marketDataService } from '@/lib/market-data/service';

const snapshot = marketDataService.getSync();

describe('calculateCurrencyDepreciationForward', () => {
  it('returns null on amount <= 0', () => {
    expect(
      calculateCurrencyDepreciationForward({ amount: 0, years: 5, currency: 'BRL' }, snapshot)
    ).toBeNull();
  });

  it('returns null on years <= 0', () => {
    expect(
      calculateCurrencyDepreciationForward({ amount: 50000, years: 0, currency: 'BRL' }, snapshot)
    ).toBeNull();
  });

  it('BRL, 50000, 5y: diBoaS line > bank line > cashUsdEquivalent', () => {
    const r = calculateCurrencyDepreciationForward(
      { amount: 50000, years: 5, currency: 'BRL' },
      snapshot
    );
    expect(r).not.toBeNull();
    expect(r!.usdcLocal).toBeGreaterThan(r!.bankLocal);
    expect(r!.bankLocal).toBeGreaterThan(r!.cashUsdEquivalent);
    expect(r!.diboasGain).toBeGreaterThan(0);
    expect(r!.depreciation).toBeGreaterThan(0);
  });

  it('USD: depreciation = 0 (graceful degradation, C30)', () => {
    const r = calculateCurrencyDepreciationForward(
      { amount: 10000, years: 5, currency: 'USD' },
      snapshot
    );
    expect(r).not.toBeNull();
    expect(r!.depreciation).toBe(0);
    expect(r!.cashUsdEquivalent).toBe(10000);
  });
});

describe('calculateCurrencyDepreciationRetrospective', () => {
  it('returns null for USD', () => {
    expect(
      calculateCurrencyDepreciationRetrospective({ amount: 50000, currency: 'USD' }, snapshot)
    ).toBeNull();
  });

  it('BRL: percentLossInUsdTerms > 0 (BRL has depreciated against USD 2010→now)', () => {
    const r = calculateCurrencyDepreciationRetrospective(
      { amount: 50000, currency: 'BRL' },
      snapshot
    );
    expect(r).not.toBeNull();
    expect(r!.percentLossInUsdTerms).toBeGreaterThan(0);
    expect(r!.usdValueNow).toBeLessThan(r!.usdValueThen);
  });
});

describe('Constants', () => {
  it('CURRENCY_DEPRECIATION_SCENARIO_USD_PERCENT = 10', () => {
    expect(CURRENCY_DEPRECIATION_SCENARIO_USD_PERCENT).toBe(10);
  });

  it('CURRENCY_DEPRECIATION_OPTIONS includes USD + 16 FX-model currencies', () => {
    // FX-16 adoption D1+D8 (Bar 2026-05-26): 3 → 17 currencies. ARS/CLP/COP
    // excluded per FX model §5 hyperinflation/multi-regime gate.
    expect(CURRENCY_DEPRECIATION_OPTIONS).toEqual([
      'USD',
      'BRL',
      'EUR',
      'GBP',
      'CAD',
      'AUD',
      'JPY',
      'INR',
      'MXN',
      'ZAR',
      'KRW',
      'SGD',
      'HKD',
      'AED',
      'ILS',
      'CHF',
      'PLN',
    ]);
  });

  it('CURRENCY_DEPRECIATION_OPTIONS.length === 17', () => {
    expect(CURRENCY_DEPRECIATION_OPTIONS.length).toBe(17);
  });

  it('every currency has a CURRENCY_BUCKET classification', () => {
    for (const c of CURRENCY_DEPRECIATION_OPTIONS) {
      expect(CURRENCY_BUCKET[c]).toBeDefined();
    }
  });

  it('CURRENCY_TO_LOCALE maps only USD/BRL/EUR (FX-16 D3)', () => {
    expect(CURRENCY_TO_LOCALE.USD).toBe('en');
    expect(CURRENCY_TO_LOCALE.BRL).toBe('pt-BR');
    expect(CURRENCY_TO_LOCALE.EUR).toBe('de');
    // The 14 FX-16 currencies have no locale mapping → bank card hides.
    expect(CURRENCY_TO_LOCALE.GBP).toBeUndefined();
    expect(CURRENCY_TO_LOCALE.JPY).toBeUndefined();
    expect(CURRENCY_TO_LOCALE.HKD).toBeUndefined();
    expect(CURRENCY_TO_LOCALE.CHF).toBeUndefined();
  });
});

describe('FX-16 forward paths (D1+D8 adoption, 2026-05-26)', () => {
  it('CHF (negative-FX): depreciation < 0; cashUsdEquivalent > amount (local currency strengthened)', () => {
    const r = calculateCurrencyDepreciationForward(
      { amount: 10000, years: 5, currency: 'CHF' },
      snapshot
    );
    expect(r).not.toBeNull();
    expect(r!.depreciation).toBeLessThan(0);
    // Negative depreciation means local strengthens vs USD; cash held in CHF
    // is worth MORE in USD-equivalent terms after the window, not less.
    expect(r!.cashUsdEquivalent).toBeGreaterThan(10000);
    // No bank rate available → null
    expect(r!.bankRatePercent).toBeNull();
  });

  it('HKD (peg): depreciation = 0 (FX = 0 by policy)', () => {
    const r = calculateCurrencyDepreciationForward(
      { amount: 10000, years: 5, currency: 'HKD' },
      snapshot
    );
    expect(r).not.toBeNull();
    expect(r!.depreciation).toBe(0);
    // Peg means USD-equivalent of cash held = original amount exactly.
    expect(r!.cashUsdEquivalent).toBe(10000);
    expect(r!.bankRatePercent).toBeNull();
  });

  it('JPY (no bank rate proxy): bankRatePercent === null; bank card hides', () => {
    const r = calculateCurrencyDepreciationForward(
      { amount: 10000, years: 5, currency: 'JPY' },
      snapshot
    );
    expect(r).not.toBeNull();
    expect(r!.bankRatePercent).toBeNull();
    expect(r!.depreciation).toBeGreaterThan(0);
  });

  it('EUR forward uses calibrated 0.55%, not live ~1.23% (FX-16 D1)', () => {
    const r = calculateCurrencyDepreciationForward(
      { amount: 10000, years: 25, currency: 'EUR' },
      snapshot
    );
    expect(r).not.toBeNull();
    // D1 priority: calibrated constant wins over live FX derivation.
    expect(r!.depreciation).toBeCloseTo(0.0055, 4);
  });

  it('BRL forward unchanged at 0.0621 (both methodologies coincide)', () => {
    const r = calculateCurrencyDepreciationForward(
      { amount: 10000, years: 25, currency: 'BRL' },
      snapshot
    );
    expect(r).not.toBeNull();
    expect(r!.depreciation).toBeCloseTo(0.0621, 4);
  });

  it('getBankRateForCurrency returns null for FX-16 currencies (D3 hide rule)', () => {
    for (const c of [
      'GBP',
      'CAD',
      'AUD',
      'JPY',
      'INR',
      'MXN',
      'ZAR',
      'KRW',
      'SGD',
      'HKD',
      'AED',
      'ILS',
      'CHF',
      'PLN',
    ] as const) {
      expect(getBankRateForCurrency(c, snapshot)).toBeNull();
    }
  });

  it('getBankRateForCurrency returns a number for USD/BRL/EUR', () => {
    expect(typeof getBankRateForCurrency('USD', snapshot)).toBe('number');
    expect(typeof getBankRateForCurrency('BRL', snapshot)).toBe('number');
    expect(typeof getBankRateForCurrency('EUR', snapshot)).toBe('number');
  });
});

describe('FX-16 retrospective gate (D4 — BRL/EUR only)', () => {
  it('returns null for currencies without historical anchors (D4)', () => {
    for (const c of ['GBP', 'JPY', 'HKD', 'CHF'] as const) {
      const r = calculateCurrencyDepreciationRetrospective(
        { amount: 10000, currency: c },
        snapshot
      );
      expect(r).toBeNull();
    }
  });

  it('returns a result for BRL (anchor data present)', () => {
    const r = calculateCurrencyDepreciationRetrospective(
      { amount: 50000, currency: 'BRL' },
      snapshot
    );
    expect(r).not.toBeNull();
  });

  it('returns a result for EUR (anchor data present; historicalCagr === 0.0123)', () => {
    const r = calculateCurrencyDepreciationRetrospective(
      { amount: 50000, currency: 'EUR' },
      snapshot
    );
    expect(r).not.toBeNull();
    // EUR historicalCagr remains 1.23% — the retrospective endpoint-pair CAGR
    // is unchanged by D1 (which only moved the forward field). Anchor pair
    // 1.4272 → 1.1706 USD/EUR over 16.33y produces 1.227% CAGR.
    expect(r!.historicalCagr).toBeCloseTo(0.0123, 3);
  });
});

describe('FX-16 audit §6.1 — cashUsdEquivalent clamp (defensive)', () => {
  it('all 16 calibrated currencies stay well above the EFFECTIVE_RATE_FLOOR (-0.99)', () => {
    // Worst calibrated values: ZAR +4.73% (positive); CHF -1.79% (negative).
    // Neither approaches the -0.99 floor; the clamp is purely defensive against
    // future bad rates or fat-finger constants. This test pins that no
    // production currency triggers the clamp under normal operation —
    // a future calibration that does should require explicit acknowledgement.
    const calibrated = snapshot.exchangeRates.rates;
    for (const ccy of [
      'BRL',
      'EUR',
      'GBP',
      'CAD',
      'AUD',
      'JPY',
      'INR',
      'MXN',
      'ZAR',
      'KRW',
      'SGD',
      'HKD',
      'AED',
      'ILS',
      'CHF',
      'PLN',
    ]) {
      const dep = calibrated[ccy]?.annualDepreciation;
      expect(typeof dep).toBe('number');
      expect(dep).toBeGreaterThan(-0.99);
    }
  });

  it('cashUsdEquivalent is always finite + positive for calibrated rates', () => {
    // The math is `amount / Math.pow(1 + depreciation, years)`.
    // For (1 + dep) > 0 (clamp guarantees this), Math.pow is always finite positive,
    // so cashUsdEquivalent stays finite positive.
    for (const ccy of ['BRL', 'EUR', 'CHF', 'HKD', 'JPY', 'AED'] as const) {
      const r = calculateCurrencyDepreciationForward(
        { amount: 10000, years: 25, currency: ccy },
        snapshot
      );
      expect(r).not.toBeNull();
      expect(Number.isFinite(r!.cashUsdEquivalent)).toBe(true);
      expect(r!.cashUsdEquivalent).toBeGreaterThan(0);
    }
  });
});
