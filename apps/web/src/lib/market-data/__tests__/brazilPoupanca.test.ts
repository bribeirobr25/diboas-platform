/**
 * Tests for derivePoupancaRate — Phase G (TOOLS_IMPROVEMENT.md, 2026-05-23).
 *
 * Validates the regime-switch rule per Lei nº 12.703/2012:
 * - Selic > 8.5% → 0.5%/month + TR
 * - Selic ≤ 8.5% → 70% × Selic + TR
 */

import { describe, it, expect } from 'vitest';
import { derivePoupancaRate, BRAZIL_POUPANCA_SELIC_THRESHOLD } from '../formulas/brazilPoupanca';

describe('derivePoupancaRate', () => {
  it('threshold constant matches BCB rule (8.5%)', () => {
    expect(BRAZIL_POUPANCA_SELIC_THRESHOLD).toBe(8.5);
  });

  it('high-Selic regime: Selic 14.50%, TR 0 → ~6.17% annualized', () => {
    // (1 + 0.005)^12 - 1 = 0.06168
    expect(derivePoupancaRate(14.5, 0)).toBeCloseTo(0.0617, 3);
  });

  it('high-Selic regime: at threshold + epsilon, uses high-regime formula', () => {
    // Selic just above 8.5% → high regime
    expect(derivePoupancaRate(8.51, 0)).toBeCloseTo(0.0617, 3);
  });

  it('low-Selic regime: at threshold (8.5%), uses low-regime formula', () => {
    // 8.5 is NOT > 8.5, so low regime: 70% × 8.5 = 5.95%
    expect(derivePoupancaRate(8.5, 0)).toBeCloseTo(0.0595, 3);
  });

  it('low-Selic regime: Selic 6%, TR 0 → 4.2%/yr', () => {
    // 70% × 6% = 4.2%
    expect(derivePoupancaRate(6, 0)).toBeCloseTo(0.042, 3);
  });

  it('low-Selic regime: Selic 2%, TR 0 → 1.4%/yr', () => {
    expect(derivePoupancaRate(2, 0)).toBeCloseTo(0.014, 3);
  });

  it('high-Selic regime: TR > 0 increases output linearly', () => {
    // Selic 14.5, TR 0.05%/month → (1 + 0.005 + 0.0005)^12 - 1 = 0.0681
    const withTR = derivePoupancaRate(14.5, 0.05);
    const withoutTR = derivePoupancaRate(14.5, 0);
    expect(withTR).toBeGreaterThan(withoutTR);
    expect(withTR).toBeCloseTo(0.0681, 3);
  });

  it('returns 0 for negative Selic (data corruption guard)', () => {
    expect(derivePoupancaRate(-1, 0)).toBe(0);
  });

  it('returns 0 for NaN Selic', () => {
    expect(derivePoupancaRate(NaN, 0)).toBe(0);
  });

  it('Selic 0% with TR 0 returns 0', () => {
    expect(derivePoupancaRate(0, 0)).toBe(0);
  });
});
