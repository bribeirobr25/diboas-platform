/**
 * useMarketWedge — per-market wedge engine (Phase 4).
 *
 * Verifies each locale resolves the RIGHT metric into a locale-formatted live
 * figure, and that the percent/decimal unit split is normalized correctly (the
 * documented unit-convention bug-source): bank rates are percent-shape, inflation
 * is decimal-shape, the BRL loss reuses the currency-depreciation retrospective.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMarketWedge } from '../useMarketWedge';

const fixtureSnapshot = {
  rates: {
    bankRates: {
      en: { savings: 0.38 },
      de: { savings: 2.3 },
      es: { savings: 2.0 },
      'pt-BR': { savings: 6.83 },
    },
  },
  inflationRates: {
    rates: {
      en: { cumulativeSince2010: 0.523 },
      de: { cumulativeSince2010: 0.41 },
      es: { cumulativeSince2010: 0.41 },
      'pt-BR': { cumulativeSince2010: 1.45 },
    },
  },
};

vi.mock('@/hooks/useMarketData', () => ({
  useMarketData: () => ({ data: fixtureSnapshot }),
}));

vi.mock('@/lib/currency-depreciation', () => ({
  // BRL anchor 1.874 → 5.0134 ⇒ (1 - 1.874/5.0134)*100 ≈ 62.6%
  calculateCurrencyDepreciationRetrospective: () => ({ percentLossInUsdTerms: 62.6 }),
}));

describe('useMarketWedge', () => {
  it('en → bank savings (percent-shape) formatted in en-US', () => {
    const { result } = renderHook(() => useMarketWedge('en'));
    expect(result.current.expression.metric).toBe('bankSavings');
    expect(result.current.expression.ctaHref).toBe('/demo');
    expect(result.current.figure).toBe('0.38%');
  });

  it('de → bank savings formatted in de-DE (comma + space)', () => {
    const { result } = renderHook(() => useMarketWedge('de'));
    expect(result.current.expression.metric).toBe('bankSavings');
    // de-DE renders "2,3 %" (narrow no-break space before %)
    expect(result.current.figure).toMatch(/^2,3\s?%$/);
  });

  it('es → inflation cumulative (decimal-shape) → whole percent', () => {
    const { result } = renderHook(() => useMarketWedge('es'));
    expect(result.current.expression.metric).toBe('inflationCumulative');
    expect(result.current.figure).toMatch(/^41\s?%$/);
  });

  it('pt-BR → BRL dollar-loss via the currency-depreciation retrospective', () => {
    const { result } = renderHook(() => useMarketWedge('pt-BR'));
    expect(result.current.expression.metric).toBe('brlDollarLoss');
    expect(result.current.expression.ctaHref).toBe('/tools/currency-depreciation');
    expect(result.current.figure).toBe('63%');
  });
});
