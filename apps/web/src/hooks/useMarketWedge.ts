'use client';

/**
 * useMarketWedge — the per-market wedge engine (Phase 4 redesign).
 *
 * Resolves the locale's `WEDGE_CONFIG` expression plus its LIVE headline figure
 * from the market-data snapshot (never a hardcoded number — Principle 3). The
 * figure is normalized to a 0..1 fraction internally so the locale-aware percent
 * formatter is uniform across the percent-shape (bank rates) and decimal-shape
 * (inflation) metrics — the documented unit-convention bug-source.
 */

import { useMemo } from 'react';
import type { SupportedLocale } from '@diboas/i18n/config';
import { useMarketData } from '@/hooks/useMarketData';
import { calculateCurrencyDepreciationRetrospective } from '@/lib/currency-depreciation';
import type { MarketDataSnapshot } from '@/lib/market-data';
import { WEDGE_CONFIG, type WedgeExpression, type WedgeMetric } from '@/config/wedge';

const LOCALE_TO_INTL: Record<SupportedLocale, string> = {
  en: 'en-US',
  'pt-BR': 'pt-BR',
  es: 'es-ES',
  de: 'de-DE',
};

/**
 * Resolve a metric to a 0..1 fraction. Returns null when the underlying datum is
 * absent so the caller can omit the wedge rather than print a broken figure.
 */
function resolveFraction(
  metric: WedgeMetric,
  locale: SupportedLocale,
  snapshot: MarketDataSnapshot
): number | null {
  switch (metric) {
    case 'bankSavings': {
      // bankRates.savings is PERCENT-shape (0.38 = 0.38%).
      const pct = snapshot.rates.bankRates[locale]?.savings;
      return typeof pct === 'number' ? pct / 100 : null;
    }
    case 'inflationCumulative': {
      // inflation is DECIMAL-shape already (0.41 = 41%).
      const dec = snapshot.inflationRates.rates[locale]?.cumulativeSince2010;
      return typeof dec === 'number' ? dec : null;
    }
    case 'brlDollarLoss': {
      // Reuse the Currency-Depreciation retrospective so the wedge figure equals
      // the tool's `percentLossInUsdTerms` (DRY + consistent). PERCENT-shape.
      const result = calculateCurrencyDepreciationRetrospective(
        { amount: 1000, currency: 'BRL' },
        snapshot
      );
      return result ? result.percentLossInUsdTerms / 100 : null;
    }
    default:
      return null;
  }
}

function formatPercent(fraction: number, locale: SupportedLocale): string {
  // Small rates (bank savings) keep up to 2 decimals; large cumulative figures
  // round to whole percent.
  const maximumFractionDigits = Math.abs(fraction) < 0.05 ? 2 : 0;
  return new Intl.NumberFormat(LOCALE_TO_INTL[locale], {
    style: 'percent',
    maximumFractionDigits,
  }).format(fraction);
}

interface MarketWedge {
  readonly expression: WedgeExpression;
  /** Locale-formatted live figure for the claim (e.g. "0.38%" / "63%"), or null. */
  readonly figure: string | null;
}

export function useMarketWedge(locale: SupportedLocale): MarketWedge {
  const { data: snapshot } = useMarketData();
  return useMemo(() => {
    const expression = WEDGE_CONFIG[locale];
    const fraction = resolveFraction(expression.metric, locale, snapshot);
    return { expression, figure: fraction != null ? formatPercent(fraction, locale) : null };
  }, [locale, snapshot]);
}
