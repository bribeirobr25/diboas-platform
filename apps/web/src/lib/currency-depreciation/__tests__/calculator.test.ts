/**
 * Phase 2 §2.4 — `lib/currency-depreciation/` extraction regression tests.
 */

import monthlyFx from '@/lib/market-data/data/monthlyFx.json';
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

  it('should compute the yearly rate from the two rates the card shows (5.854)', () => {
    // Requirement: one card, one basis. EUR 0.70067 -> 0.85426 over 2010-01-01..2026-04-30
    // and BRL 1.874 -> 5.0134 over 2010-01-01..2026-05-22.
    const eur = calculateCurrencyDepreciationRetrospective(
      { amount: 50000, currency: 'EUR' },
      snapshot
    );
    const brl = calculateCurrencyDepreciationRetrospective(
      { amount: 50000, currency: 'BRL' },
      snapshot
    );
    for (const [r, years] of [
      [eur!, (Date.parse('2026-04-30') - Date.parse('2010-01-01')) / (365.25 * 86_400_000)],
      [brl!, (Date.parse('2026-05-22') - Date.parse('2010-01-01')) / (365.25 * 86_400_000)],
    ] as const) {
      expect(r.historicalCagr).toBeCloseTo(Math.pow(r.rateEnd / r.rateStart, 1 / years) - 1, 10);
    }
    expect((eur!.historicalCagr * 100).toFixed(2)).toBe('1.22');
    expect((brl!.historicalCagr * 100).toFixed(2)).toBe('6.19');
  });

  it('should only show a yearly rate for a currency that weakened, as the card words it', () => {
    // The card reads "{currency} weakened {cagr}% / year against USD". A currency whose anchor
    // pair shows it strengthening needs other wording x4 before its anchors ship (plan MP-9).
    const rates = snapshot.exchangeRates.rates as Record<
      string,
      { historicalRateStart?: number; historicalRateEnd?: number }
    >;
    const anchored = Object.entries(rates).filter(([, r]) => r.historicalRateStart !== undefined);
    expect(anchored.length).toBeGreaterThanOrEqual(2);
    for (const [currency, r] of anchored)
      expect(r.historicalRateEnd! > r.historicalRateStart!, currency).toBe(true);
  });

  it('should move in the same direction as the Fed series between the anchor months (5.848)', () => {
    // Requirement: the result's direction follows the published Fed series, never the
    // storage convention of a constant. Compared at the ANCHOR months, which are fixed,
    // so a later market move can never turn this red (the 5.478 rule).
    const fx = monthlyFx as unknown as Record<
      string,
      { months: { ym: string; closeLocalPerUsd: number }[] }
    >;
    const rates = snapshot.exchangeRates.rates as Record<
      string,
      { historicalAnchorStart?: string; historicalAnchorEnd?: string }
    >;
    const fedAt = (currency: string, iso: string) =>
      fx[currency].months.find((m) => m.ym === `${iso.slice(0, 7)}-01`)?.closeLocalPerUsd;
    for (const currency of ['BRL', 'EUR'] as const) {
      const start = fedAt(currency, rates[currency].historicalAnchorStart!);
      const end = fedAt(currency, rates[currency].historicalAnchorEnd!);
      expect(start, `${currency} Fed month at the start anchor`).toBeDefined();
      expect(end, `${currency} Fed month at the end anchor`).toBeDefined();
      const fedSaysFell = end! > start!;
      const r = calculateCurrencyDepreciationRetrospective({ amount: 10000, currency }, snapshot);
      expect(r, currency).not.toBeNull();
      expect(r!.percentLossInUsdTerms > 0, currency).toBe(fedSaysFell);
      expect(r!.usdValueNow < r!.usdValueThen, currency).toBe(fedSaysFell);
    }
  });

  it('carries the locked anchor dates on the result (MSG-08 vintage labels)', () => {
    // The UI derives "Now (<month year>)" and the "<n> years" span from these —
    // they must equal the constants' anchor pair, never a hand-typed date.
    const r = calculateCurrencyDepreciationRetrospective(
      { amount: 50000, currency: 'BRL' },
      snapshot
    );
    expect(r!.anchorStart).toBe('2010-01-01');
    expect(r!.anchorEnd).toBe('2026-05-22');
    const eur = calculateCurrencyDepreciationRetrospective(
      { amount: 50000, currency: 'EUR' },
      snapshot
    );
    expect(eur!.anchorEnd).toBe('2026-04-30');
  });

  it('returns null when rate endpoints exist but anchor dates are missing (D4 complete-set rule)', () => {
    // historical* fields ship as a complete set or not at all; a partial
    // provider response must fail safe (retrospective card hides).
    const partial = {
      ...snapshot,
      exchangeRates: {
        ...snapshot.exchangeRates,
        rates: {
          ...snapshot.exchangeRates.rates,
          BRL: {
            ...snapshot.exchangeRates.rates.BRL,
            historicalAnchorStart: undefined,
            historicalAnchorEnd: undefined,
          },
        },
      },
    } as typeof snapshot;
    const r = calculateCurrencyDepreciationRetrospective(
      { amount: 50000, currency: 'BRL' },
      partial
    );
    expect(r).toBeNull();
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
