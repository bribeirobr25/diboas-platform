/**
 * Phase 2 §2.3 — `lib/inflation-impact/` extraction regression tests + C42.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateInflationImpactForward,
  calculateInflationImpactRetrospective,
  INFLATION_IMPACT_SCENARIO_USD_PERCENT,
} from '../calculator';
import { marketDataService } from '@/lib/market-data/service';
import type { MarketDataSnapshot } from '@/lib/market-data/types';

const snapshot = marketDataService.getSync();

describe('calculateInflationImpactForward', () => {
  it('returns null when amount <= 0', () => {
    expect(
      calculateInflationImpactForward({ amount: 0, years: 10, country: 'en' }, snapshot)
    ).toBeNull();
  });

  it('returns null when years <= 0', () => {
    expect(
      calculateInflationImpactForward({ amount: 1000, years: 0, country: 'en' }, snapshot)
    ).toBeNull();
  });

  it('en, amount 1000, years 10: cashValueReal < amount, investedReal > cashValueReal', () => {
    const r = calculateInflationImpactForward({ amount: 1000, years: 10, country: 'en' }, snapshot);
    expect(r).not.toBeNull();
    expect(r!.cashValueReal).toBeGreaterThan(0);
    expect(r!.cashValueReal).toBeLessThan(1000);
    expect(r!.investedReal).toBeGreaterThan(r!.cashValueReal);
    expect(r!.lostToInflation).toBeGreaterThan(0);
    expect(r!.inflationRate).toBeGreaterThan(0);
  });

  it('24-month boundary: years=2 uses `current`, years=3 uses `average5y`', () => {
    const at2 = calculateInflationImpactForward(
      { amount: 1000, years: 2, country: 'en' },
      snapshot
    );
    const at3 = calculateInflationImpactForward(
      { amount: 1000, years: 3, country: 'en' },
      snapshot
    );
    expect(at2).not.toBeNull();
    expect(at3).not.toBeNull();
    expect(at2!.inflationRate).toBe(snapshot.inflationRates.rates.en?.current);
    expect(at3!.inflationRate).toBe(snapshot.inflationRates.rates.en?.average5y);
  });
});

describe('calculateInflationImpactRetrospective', () => {
  it('returns null when amount <= 0', () => {
    expect(
      calculateInflationImpactRetrospective({ amount: 0, country: 'en' }, snapshot)
    ).toBeNull();
  });

  it('en, amount 1000: lostToInflation > 0, percentLoss ≈ 34%', () => {
    const r = calculateInflationImpactRetrospective({ amount: 1000, country: 'en' }, snapshot);
    expect(r).not.toBeNull();
    expect(r!.cumulative).toBeGreaterThan(0);
    expect(r!.todayPurchasingPower).toBeLessThan(1000);
    expect(r!.lostToInflation).toBeGreaterThan(0);
    expect(r!.percentLoss).toBeGreaterThan(0);
    expect(r!.percentLoss).toBeLessThan(100);
  });

  /**
   * C42 close (CTO-board v1.1 §4 S4): when `snapshot.inflationRates.rates`
   * is missing a locale (degraded provider fetch), the engine MUST return
   * `null` — not crash with a TypeError on `.cumulativeSince2010`.
   */
  it('returns null when locale missing from inflationRates (C42 reproducer)', () => {
    // Construct a degraded snapshot: rates missing the requested country.
    const degraded: MarketDataSnapshot = {
      ...snapshot,
      inflationRates: {
        ...snapshot.inflationRates,
        rates: {
          // Intentionally omit 'pt-BR' to simulate provider returning a partial map
          en: snapshot.inflationRates.rates.en!,
          es: snapshot.inflationRates.rates.es!,
          de: snapshot.inflationRates.rates.de!,
        } as MarketDataSnapshot['inflationRates']['rates'],
      },
    };
    expect(() =>
      calculateInflationImpactRetrospective({ amount: 1000, country: 'pt-BR' }, degraded)
    ).not.toThrow();
    expect(
      calculateInflationImpactRetrospective({ amount: 1000, country: 'pt-BR' }, degraded)
    ).toBeNull();
  });
});

describe('Constants', () => {
  it('INFLATION_IMPACT_SCENARIO_USD_PERCENT = 10 (historical only)', () => {
    expect(INFLATION_IMPACT_SCENARIO_USD_PERCENT).toBe(10);
  });
});
