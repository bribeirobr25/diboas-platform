/**
 * Money Jobs engine tests (spec §9): golden paths per locale × 2 modes,
 * jobs-reconcile-to-income invariant (M4), safety-first step transitions,
 * dignity state, netBurn/cash-positive branch, runway-mode boundary at
 * exactly runwayComfortMonths, bounds, null on invalid input.
 */

import { describe, it, expect } from 'vitest';
import {
  MONEY_JOBS_MODEL,
  calculateMoneyJobsPersonal,
  calculateMoneyJobsBusiness,
} from '../calculator';
import { FALLBACK_MARKET_DATA } from '@/lib/market-data/constants';
import type { SupportedLocale } from '@diboas/i18n/config';

const snapshot = FALLBACK_MARKET_DATA;
const LOCALES: SupportedLocale[] = ['en', 'pt-BR', 'es', 'de'];

// Attested B2C income defaults (attestation §3) with derived essentials.
const B2C_INCOME: Record<SupportedLocale, number> = {
  en: 6000,
  'pt-BR': 6000,
  es: 2800,
  de: 3200,
};

describe('calculateMoneyJobsPersonal — golden paths', () => {
  it.each(LOCALES)(
    'should produce a reconciled three-job split for the %s default income when savings are zero',
    (locale) => {
      const income = B2C_INCOME[locale];
      const essentials = income * MONEY_JOBS_MODEL.essentialsShare[locale];
      const r = calculateMoneyJobsPersonal(
        { monthlyIncome: income, monthlyEssentials: essentials, currentSavings: 0, locale },
        snapshot
      );
      expect(r).not.toBeNull();
      const res = r!;
      expect(res.dignityState).toBe(false);
      expect(res.floor).toBeCloseTo(essentials, 6);
      expect(res.cushionTarget).toBeCloseTo(essentials * 6, 6);
      // 0% funded → high rate 35%
      expect(res.cushionRate).toBe(MONEY_JOBS_MODEL.cushionStep.highRate);
      // M4: floor + cushion contribution + workingMax reconcile to income
      expect(res.floor + res.cushionContribution + res.workingMax).toBeCloseTo(income, 6);
      // ideal < max invariant (prudence slack)
      expect(res.workingIdeal).toBeLessThan(res.workingMax);
      expect(res.workingIdeal).toBeCloseTo(res.workingMax * 0.75, 6);
      // headline: the unassigned pile is the surplus
      expect(res.joblessMoney).toBeCloseTo(income - essentials, 6);
      // cost line present and positive (inflation > 0 in all locales)
      expect(res.joblessCostOfInflation).not.toBeNull();
      expect(res.joblessCostOfInflation!).toBeGreaterThan(0);
    }
  );

  it('should step the cushion rate 35% → 25% → 0 exactly at the funding thresholds', () => {
    const base = { monthlyIncome: 6000, monthlyEssentials: 3720, locale: 'en' as const };
    const target = 3720 * 6; // 22,320
    const rateAt = (savings: number) =>
      calculateMoneyJobsPersonal({ ...base, currentSavings: savings }, snapshot)!.cushionRate;
    expect(rateAt(0)).toBe(0.35);
    expect(rateAt(target * 0.249)).toBe(0.35);
    expect(rateAt(target * 0.25)).toBe(0.25); // threshold reached → normal rate
    expect(rateAt(target * 0.999)).toBe(0.25);
    expect(rateAt(target)).toBe(0); // fully funded → released to working money
    expect(rateAt(target * 2)).toBe(0);
  });

  it('should enter the dignity state when surplus is zero or negative, without throwing', () => {
    const r = calculateMoneyJobsPersonal(
      { monthlyIncome: 3000, monthlyEssentials: 3200, currentSavings: 0, locale: 'pt-BR' },
      snapshot
    )!;
    expect(r.dignityState).toBe(true);
    expect(r.cushionContribution).toBe(0);
    expect(r.workingMax).toBe(0);
    expect(r.joblessMoney).toBe(0);
    expect(r.joblessCostOfInflation).toBeNull();
  });

  it('should enter the dignity state when surplus is thin (below 5% of income)', () => {
    // surplus = 120 = 4% of income → below dignityFloorRatio (5%)
    const r = calculateMoneyJobsPersonal(
      { monthlyIncome: 3000, monthlyEssentials: 2880, currentSavings: 0, locale: 'es' },
      snapshot
    )!;
    expect(r.dignityState).toBe(true);
  });

  it('should NOT enter the dignity state when surplus sits just above the 5% floor', () => {
    const r = calculateMoneyJobsPersonal(
      { monthlyIncome: 3000, monthlyEssentials: 2840, currentSavings: 0, locale: 'es' },
      snapshot
    )!;
    expect(r.dignityState).toBe(false);
    expect(r.workingMax).toBeGreaterThan(0);
  });

  it('should return null on invalid input', () => {
    const bad = { currentSavings: 0, locale: 'en' as const };
    expect(
      calculateMoneyJobsPersonal({ monthlyIncome: 0, monthlyEssentials: 100, ...bad }, snapshot)
    ).toBeNull();
    expect(
      calculateMoneyJobsPersonal({ monthlyIncome: NaN, monthlyEssentials: 100, ...bad }, snapshot)
    ).toBeNull();
    expect(
      calculateMoneyJobsPersonal({ monthlyIncome: 5000, monthlyEssentials: -1, ...bad }, snapshot)
    ).toBeNull();
    expect(
      calculateMoneyJobsPersonal(
        { monthlyIncome: 5000, monthlyEssentials: 100, currentSavings: -5, locale: 'en' },
        snapshot
      )
    ).toBeNull();
  });
});

describe('calculateMoneyJobsBusiness — golden paths and branches', () => {
  it('should produce floor/excess with the ideal band for the en default (burning, comfortable runway is impossible here)', () => {
    // Attested en defaults: rev 30k / burn 25k / cash 250k → cash-positive
    const r = calculateMoneyJobsBusiness(
      { monthlyRevenue: 30_000, monthlyBurn: 25_000, cashOnHand: 250_000, locale: 'en' },
      snapshot
    )!;
    expect(r.operatingFloor).toBe(75_000);
    expect(r.excess).toBe(175_000);
    expect(r.excessIdeal).toBeCloseTo(131_250, 6);
    expect(r.cashPositive).toBe(true);
    expect(r.runwayMonths).toBeNull();
    expect(r.runwayMode).toBe(false); // cash-positive never enters runway mode
    expect(r.grossCoverageMonths).toBe(10);
    expect(r.idleExcessCostOfInflation).toBeGreaterThan(0);
  });

  it('should enter runway mode for a burning startup with runway under the comfort threshold', () => {
    // pt-BR campaign case: burn 120k, no revenue, cash 600k → runway 5 months
    const r = calculateMoneyJobsBusiness(
      { monthlyRevenue: 0, monthlyBurn: 120_000, cashOnHand: 600_000, locale: 'pt-BR' },
      snapshot
    )!;
    expect(r.netBurn).toBe(120_000);
    expect(r.runwayMonths).toBe(5);
    expect(r.runwayMode).toBe(true);
    // floor + excess still computed (shown, but invest framing suppressed by UI)
    expect(r.operatingFloor).toBe(360_000);
    expect(r.excess).toBe(240_000);
  });

  it('should treat runway of exactly runwayComfortMonths as comfortable (boundary test)', () => {
    // netBurn 10k, cash 120k → runway exactly 12 → NOT runway mode
    const at = calculateMoneyJobsBusiness(
      { monthlyRevenue: 15_000, monthlyBurn: 25_000, cashOnHand: 120_000, locale: 'de' },
      snapshot
    )!;
    expect(at.runwayMonths).toBe(12);
    expect(at.runwayMode).toBe(false);
    // one dollar less cash → under the threshold → runway mode
    const under = calculateMoneyJobsBusiness(
      { monthlyRevenue: 15_000, monthlyBurn: 25_000, cashOnHand: 119_999, locale: 'de' },
      snapshot
    )!;
    expect(under.runwayMode).toBe(true);
  });

  it('should show the cash-positive state when revenue covers burn ("runway isn\'t your constraint")', () => {
    const r = calculateMoneyJobsBusiness(
      { monthlyRevenue: 25_000, monthlyBurn: 22_000, cashOnHand: 200_000, locale: 'es' },
      snapshot
    )!;
    expect(r.cashPositive).toBe(true);
    expect(r.runwayMonths).toBeNull();
    expect(r.grossCoverageMonths).toBeCloseTo(200_000 / 22_000, 6);
  });

  it('should clamp excess at zero when cash sits below the operating floor', () => {
    const r = calculateMoneyJobsBusiness(
      { monthlyRevenue: 0, monthlyBurn: 50_000, cashOnHand: 100_000, locale: 'en' },
      snapshot
    )!;
    expect(r.excess).toBe(0);
    expect(r.idleExcess).toBe(0);
    expect(r.idleExcessCostOfInflation).toBeNull();
    expect(r.runwayMode).toBe(true); // runway 2 months
  });

  it('should return null on invalid input (zero burn, negatives, NaN)', () => {
    expect(
      calculateMoneyJobsBusiness(
        { monthlyRevenue: 10_000, monthlyBurn: 0, cashOnHand: 100_000, locale: 'en' },
        snapshot
      )
    ).toBeNull();
    expect(
      calculateMoneyJobsBusiness(
        { monthlyRevenue: -1, monthlyBurn: 10_000, cashOnHand: 100_000, locale: 'en' },
        snapshot
      )
    ).toBeNull();
    expect(
      calculateMoneyJobsBusiness(
        { monthlyRevenue: 0, monthlyBurn: 10_000, cashOnHand: NaN, locale: 'en' },
        snapshot
      )
    ).toBeNull();
  });
});
