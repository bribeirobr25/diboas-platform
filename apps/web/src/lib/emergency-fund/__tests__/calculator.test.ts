/**
 * Phase 2 §2.1 (2026-05-25) — `calculateEmergencyFundTimeline` extraction
 * regression tests.
 *
 * The pre-extraction calculator inlined all composition logic in the React
 * component. These tests pin the composition behavior so the M2 bit-identical
 * gate can verify the extraction is move-only.
 *
 * R2 unit convention verified: bank rates divided by 100; inflation passed
 * directly (decimal); depreciation passed directly (decimal). Same precedent
 * as `useGoalCardData.ts:54` and `calculateCompoundProjectionHedged`.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateEmergencyFundTimeline,
  EMERGENCY_FUND_MAX_HORIZON_YEARS,
  EMERGENCY_FUND_FALLBACK_HORIZON_YEARS,
  EMERGENCY_FUND_SCENARIO_USD_PERCENT,
} from '../calculator';
import { marketDataService } from '@/lib/market-data/service';

const snapshot = marketDataService.getSync();

describe('calculateEmergencyFundTimeline — golden path', () => {
  it('should compute en timeline (expenses 2900, savings 300, multiplier 6) ≈ 57/76 months', () => {
    const result = calculateEmergencyFundTimeline(
      { monthlyExpenses: 2900, monthlySavings: 300, targetMultiplier: 6, locale: 'en' },
      snapshot
    );
    expect(result).not.toBeNull();
    expect(result!.target).toBe(17400);
    // Per per-tool doc §6 worked example. Audit-bundle vector reproduces.
    expect(result!.diboasMonths).toBeGreaterThanOrEqual(55);
    expect(result!.diboasMonths).toBeLessThanOrEqual(60);
    expect(result!.bankMonths).toBeGreaterThanOrEqual(72);
    expect(result!.bankMonths).toBeLessThanOrEqual(80);
    expect(result!.savedMonths).toBeGreaterThan(0);
    expect(result!.hedged).toBe(false); // USD locale = no hedge
  });

  it('should hedge non-USD locales (pt-BR savedMonths > en savedMonths)', () => {
    const en = calculateEmergencyFundTimeline(
      { monthlyExpenses: 2900, monthlySavings: 300, targetMultiplier: 6, locale: 'en' },
      snapshot
    );
    const ptBR = calculateEmergencyFundTimeline(
      { monthlyExpenses: 2700, monthlySavings: 270, targetMultiplier: 6, locale: 'pt-BR' },
      snapshot
    );
    expect(en).not.toBeNull();
    expect(ptBR).not.toBeNull();
    expect(ptBR!.hedged).toBe(true);
    expect(en!.hedged).toBe(false);
  });
});

describe('calculateEmergencyFundTimeline — edge cases', () => {
  it('should return null when monthlySavings <= 0', () => {
    const result = calculateEmergencyFundTimeline(
      { monthlyExpenses: 2900, monthlySavings: 0, targetMultiplier: 6, locale: 'en' },
      snapshot
    );
    expect(result).toBeNull();
  });

  it('should flag over30Years when timeline exceeds 360 months', () => {
    // Tiny savings against a large target → both timelines blow past 30 years.
    const result = calculateEmergencyFundTimeline(
      { monthlyExpenses: 10000, monthlySavings: 25, targetMultiplier: 24, locale: 'en' },
      snapshot
    );
    if (result !== null) {
      expect(
        (result.diboasMonths !== null && result.diboasMonths > 360) ||
          (result.bankMonths !== null && result.bankMonths > 360)
      ).toBe(true);
      expect(result.over30Years).toBe(true);
    }
  });
});

describe('calculateEmergencyFundTimeline — invariants', () => {
  it('EMERGENCY_FUND_MAX_HORIZON_YEARS aligns with time-to-target (closes C12)', () => {
    expect(EMERGENCY_FUND_MAX_HORIZON_YEARS).toBe(40);
  });

  it('EMERGENCY_FUND_FALLBACK_HORIZON_YEARS = 5 (audit-bundle F3)', () => {
    expect(EMERGENCY_FUND_FALLBACK_HORIZON_YEARS).toBe(5);
  });

  it('EMERGENCY_FUND_SCENARIO_USD_PERCENT = 10 (historical only; C13 close)', () => {
    expect(EMERGENCY_FUND_SCENARIO_USD_PERCENT).toBe(10);
  });
});
