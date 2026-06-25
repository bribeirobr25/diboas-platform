/**
 * useMarketWedge — per-market wedge engine (Phase 4).
 *
 * Exercises the REAL plumbing: the real `FALLBACK_MARKET_DATA` snapshot and the
 * real `calculateCurrencyDepreciationRetrospective` (no stubs), so a regression
 * in the `exchangeRates` read or the percent/decimal unit split is caught. The
 * unit-convention split is the documented bug-source: bank rates are
 * percent-shape, inflation is decimal-shape, the BRL loss reuses the
 * currency-depreciation retrospective (and must equal the tool's figure).
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { FALLBACK_MARKET_DATA } from '@/lib/market-data';
import { calculateCurrencyDepreciationRetrospective } from '@/lib/currency-depreciation';
import { useMarketWedge } from '../useMarketWedge';

vi.mock('@/hooks/useMarketData', () => ({
  useMarketData: () => ({ data: FALLBACK_MARKET_DATA }),
}));

describe('useMarketWedge', () => {
  it('en → bank savings (percent-shape) formatted in en-US', () => {
    const { result } = renderHook(() => useMarketWedge('en'));
    expect(result.current.expression.metric).toBe('bankSavings');
    expect(result.current.expression.ctaHref).toBe('/demo');
    expect(result.current.figure).toBe('0.38%');
  });

  it('de → bank savings formatted in de-DE (comma + space), 2 decimals kept', () => {
    const { result } = renderHook(() => useMarketWedge('de'));
    expect(result.current.expression.metric).toBe('bankSavings');
    expect(result.current.figure).toMatch(/^2,3\s?%$/);
  });

  it('es → bank savings (percent-shape) formatted in es-ES, into the inflation tool', () => {
    // ES wedge reframed (Draper redesign): the 2% bank gap, not cumulative
    // inflation — drives the inflation-impact tool. savings 2.0 → "2 %".
    const { result } = renderHook(() => useMarketWedge('es'));
    expect(result.current.expression.metric).toBe('bankSavings');
    expect(result.current.expression.ctaHref).toBe('/tools/inflation-impact');
    expect(result.current.figure).toMatch(/^2\s?%$/);
  });

  it('pt-BR → BRL dollar-loss via the REAL currency-depreciation retrospective', () => {
    const { result } = renderHook(() => useMarketWedge('pt-BR'));
    expect(result.current.expression.metric).toBe('brlDollarLoss');
    expect(result.current.expression.ctaHref).toBe('/tools/currency-depreciation');

    // The wedge figure must equal the Currency-Depreciation tool's own loss %
    // (DRY / Principle 4): same function, same snapshot.
    const tool = calculateCurrencyDepreciationRetrospective(
      { amount: 1000, currency: 'BRL' },
      FALLBACK_MARKET_DATA
    );
    expect(tool).not.toBeNull();
    const expected = new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      maximumFractionDigits: 0,
    }).format(tool!.percentLossInUsdTerms / 100);
    expect(result.current.figure).toBe(expected);
    expect(result.current.figure).toBe('63%');
  });
});
