/**
 * Phase 2 §2.2 — `calculateTimeToTargetTimeline` extraction regression tests.
 *
 * Pins R1 discipline (separate from emergency-fund), C15 cap alignment, and
 * the `computeScenarioMonths` composition helper that was previously inlined
 * in the React component (C17 close).
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTimeToTargetTimeline,
  computeScenarioMonths,
  TIMELINE_MAX_MONTHS,
  TIME_TO_TARGET_MAX_HORIZON_YEARS,
  TIME_TO_TARGET_FALLBACK_HORIZON_YEARS,
} from '../calculator';
import { calculateEmergencyFundTimeline } from '@/lib/emergency-fund';
import { marketDataService } from '@/lib/market-data/service';

const snapshot = marketDataService.getSync();

describe('calculateTimeToTargetTimeline — golden path', () => {
  it('should compute en timeline (target 50000, initial 0, $250/mo) reaching all 4 scenarios', () => {
    const result = calculateTimeToTargetTimeline(
      {
        target: 50000,
        initialAmount: 0,
        contribution: 250,
        cadence: 'monthly',
        locale: 'en',
      },
      snapshot
    );
    expect(result.months.bank).not.toBeNull();
    expect(result.months.conservative).not.toBeNull();
    expect(result.months.historical).not.toBeNull();
    expect(result.months.optimistic).not.toBeNull();
    // Better scenarios = fewer months
    expect(result.months.optimistic!).toBeLessThan(result.months.historical!);
    expect(result.months.historical!).toBeLessThan(result.months.conservative!);
    expect(result.months.conservative!).toBeLessThan(result.months.bank!);
    expect(result.hedged).toBe(false);
    expect(result.monthlyContribution).toBe(250);
  });

  it('should hedge non-bank scenarios for non-USD locales', () => {
    const en = calculateTimeToTargetTimeline(
      { target: 50000, initialAmount: 0, contribution: 250, cadence: 'monthly', locale: 'en' },
      snapshot
    );
    const ptBR = calculateTimeToTargetTimeline(
      { target: 250000, initialAmount: 0, contribution: 1000, cadence: 'monthly', locale: 'pt-BR' },
      snapshot
    );
    expect(en.hedged).toBe(false);
    expect(ptBR.hedged).toBe(true);
  });
});

describe('computeScenarioMonths — testable in isolation (C17 close)', () => {
  it('returns 0 when target <= initialAmount', () => {
    expect(
      computeScenarioMonths({
        target: 1000,
        initialAmount: 2000,
        monthlyContribution: 0,
        annualRate: 0.1,
      })
    ).toBe(0);
  });

  it('returns null on lump-sum path with initialAmount=0 (C18 reproducer)', () => {
    expect(
      computeScenarioMonths({
        target: 10000,
        initialAmount: 0,
        monthlyContribution: 0,
        annualRate: 0.1,
      })
    ).toBeNull();
  });

  it('returns months on recurring path', () => {
    const months = computeScenarioMonths({
      target: 10000,
      initialAmount: 0,
      monthlyContribution: 100,
      annualRate: 0.1,
    });
    expect(months).not.toBeNull();
    expect(months!).toBeGreaterThan(0);
    expect(months!).toBeLessThan(TIMELINE_MAX_MONTHS);
  });

  it('lump-sum loop cap aligns with TIMELINE_MAX_MONTHS (C15 close)', () => {
    // A near-zero rate against a far target → loop maxes out at 1200 / 12 = 100 years.
    const months = computeScenarioMonths({
      target: 1e15,
      initialAmount: 100,
      monthlyContribution: 0,
      annualRate: 0.001,
    });
    expect(months).toBeNull();
    expect(TIMELINE_MAX_MONTHS).toBe(1200);
  });
});

describe('Time-to-target vs Emergency-fund R1 discipline', () => {
  it('are two distinct named functions, never collapsed behind a flag', () => {
    expect(calculateTimeToTargetTimeline).not.toBe(calculateEmergencyFundTimeline);
    expect(typeof calculateTimeToTargetTimeline).toBe('function');
  });
});

describe('Constants', () => {
  it('TIME_TO_TARGET_MAX_HORIZON_YEARS = 40 (matches emergency-fund per C12 alignment)', () => {
    expect(TIME_TO_TARGET_MAX_HORIZON_YEARS).toBe(40);
  });

  it('TIME_TO_TARGET_FALLBACK_HORIZON_YEARS = 10 (audit-bundle F3)', () => {
    expect(TIME_TO_TARGET_FALLBACK_HORIZON_YEARS).toBe(10);
  });
});
