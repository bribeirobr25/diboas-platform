/**
 * Tests for `deriveHorizonMatchedCAGR` — Phase D (TOOLS_IMPROVEMENT.md).
 *
 * Covers the v1.1 continuous-window methodology (no step-function), the P7
 * graceful-fallback sentinel for insufficient data, and the canonical
 * sign convention (positive CAGR = local currency depreciating).
 */

import { describe, it, expect } from 'vitest';
import { deriveHorizonMatchedCAGR } from '../formulas/horizonMatchedCagr';
import type { MonthlyFxSeries, MonthlyFxBar } from '../types';

function makeSeries(monthsCount: number, startLocalPerUsd: number, endLocalPerUsd: number): MonthlyFxSeries {
  const months: MonthlyFxBar[] = [];
  // Geometrically interpolate so the CAGR matches end/start across the window
  const totalGrowth = endLocalPerUsd / startLocalPerUsd;
  for (let i = 0; i < monthsCount; i++) {
    const t = monthsCount === 1 ? 0 : i / (monthsCount - 1);
    const v = startLocalPerUsd * Math.pow(totalGrowth, t);
    months.push({
      ym: `2010-${String((i % 12) + 1).padStart(2, '0')}-01`,
      closeUsdPerLocal: 1 / v,
      closeLocalPerUsd: v,
    });
  }
  return { source: 'test-fixture', basis: 'test', note: 'test fixture', months };
}

describe('deriveHorizonMatchedCAGR', () => {
  it('should return positive CAGR when local currency depreciated', () => {
    const series = makeSeries(192, 1.0, 2.0); // local doubled vs USD over 191 intervals (= 15.917 years)
    const cagr = deriveHorizonMatchedCAGR(series, 16);
    // CAGR over 191 intervals (192 months) = 2.0^(12/191) − 1 ≈ 0.04451
    expect(cagr).toBeCloseTo(0.04451, 4);
  });

  it('should return negative CAGR when local currency appreciated', () => {
    const series = makeSeries(192, 1.5, 1.0); // local strengthened (1.5 → 1.0)
    const cagr = deriveHorizonMatchedCAGR(series, 16);
    // CAGR over 191 intervals = (1/1.5)^(12/191) − 1 ≈ -0.02516
    expect(cagr).toBeLessThan(0);
    expect(cagr).toBeCloseTo(-0.02516, 3);
  });

  it('should use continuous trailing window (not step function)', () => {
    const series = makeSeries(192, 1.0, 2.0);
    // 10y horizon → trailing 120 months. CAGR over those 120 months:
    // closeLocalPerUsd at month 72 (192-120=72) is 1.0 × 2.0^(72/191) ≈ 1.299
    // closeLocalPerUsd at month 191 is 2.0
    // CAGR = (2.0/1.299)^(1/10) - 1 ≈ 0.04416
    // (same as 16y CAGR by construction — geometric series, but the slicing logic is exercised)
    const cagr10 = deriveHorizonMatchedCAGR(series, 10);
    const cagr16 = deriveHorizonMatchedCAGR(series, 16);
    expect(cagr10).toBeCloseTo(cagr16, 3);
  });

  it('should saturate at full series when horizon exceeds available months', () => {
    const series = makeSeries(192, 1.0, 2.0);
    const cagr25 = deriveHorizonMatchedCAGR(series, 25); // requests 300 months
    const cagrFull = deriveHorizonMatchedCAGR(series, 16); // window = 192
    expect(cagr25).toBeCloseTo(cagrFull, 4);
  });

  it('should be smooth at boundaries (no step function discontinuity)', () => {
    // Different growth in first 60 vs last 60 months to expose any step bug
    const months: MonthlyFxBar[] = [];
    for (let i = 0; i < 192; i++) {
      const v = i < 120 ? 1.0 + (i / 120) * 0.5 : 1.5 + ((i - 120) / 72) * 0.3;
      months.push({ ym: `2010-01-01`, closeUsdPerLocal: 1 / v, closeLocalPerUsd: v });
    }
    const series: MonthlyFxSeries = { source: 'test', basis: 'test', note: 'test', months };
    const cagr10 = deriveHorizonMatchedCAGR(series, 10);
    const cagr11 = deriveHorizonMatchedCAGR(series, 11);
    // 1-year horizon delta should produce a SMALL change in CAGR (proportional
    // to one extra month of data), not a discontinuous jump. v1.0 step function
    // would change rate basis entirely; v1.1 continuous should stay close.
    expect(Math.abs(cagr10 - cagr11)).toBeLessThan(0.005); // < 50bp difference
  });

  it('should return 0 when fxSeries is undefined (P7 graceful fallback)', () => {
    expect(deriveHorizonMatchedCAGR(undefined, 5)).toBe(0);
  });

  it('should return 0 when fxSeries.months is empty', () => {
    const empty: MonthlyFxSeries = { source: 'empty', basis: 'test', note: '', months: [] };
    expect(deriveHorizonMatchedCAGR(empty, 5)).toBe(0);
  });

  it('should return 0 when fxSeries has fewer than 12 months', () => {
    const tooShort = makeSeries(6, 1.0, 1.5);
    expect(deriveHorizonMatchedCAGR(tooShort, 5)).toBe(0);
  });

  it('should return 0 when start or end close is non-positive (data corruption guard)', () => {
    const corrupt = makeSeries(60, 1.0, 1.0);
    // Overwrite first close to 0
    (corrupt.months as MonthlyFxBar[])[0] = { ...corrupt.months[0], closeLocalPerUsd: 0 };
    expect(deriveHorizonMatchedCAGR(corrupt, 5)).toBe(0);
  });

  it('should clamp horizon to MIN_REQUIRED_MONTHS (12) even for sub-1-year horizon', () => {
    const series = makeSeries(120, 1.0, 1.5);
    const cagrAt0 = deriveHorizonMatchedCAGR(series, 0);
    const cagrAt0_5 = deriveHorizonMatchedCAGR(series, 0.5);
    // Both should use the minimum 12-month window — produce identical output.
    expect(cagrAt0).toBeCloseTo(cagrAt0_5, 6);
  });
});
