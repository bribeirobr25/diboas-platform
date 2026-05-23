'use client';

/**
 * UsdEquivalentBadge — Phase I extension (2026-05-23).
 *
 * Renders "≈ $X USD today" next to a local-currency amount input on
 * forward-projecting tools (Compound Interest, Retirement, Goal Savings,
 * Emergency Fund, Time-to-Target, Idle Cash). Makes the dollar dimension
 * visible to non-USD-locale users without changing any math: the math
 * underneath continues to use the currency-hedged effective-rate model per
 * Phase 7 architectural decision (`(1+usdYield)(1+depreciation)−1`).
 *
 * Renders nothing for USD locale or when the spot FX rate is unavailable.
 */

import { useTranslation } from '@diboas/i18n/client';
import { marketDataService, LOCALE_CURRENCY } from '@/lib/market-data';
import { formatCurrency } from '@/lib/compound-interest';
import type { SupportedLocale } from '@diboas/i18n/config';

interface UsdEquivalentBadgeProps {
  amount: number;
  locale: SupportedLocale;
  className?: string;
}

export function UsdEquivalentBadge({ amount, locale, className }: UsdEquivalentBadgeProps) {
  const intl = useTranslation();
  const currency = LOCALE_CURRENCY[locale];
  if (!currency || currency === 'USD') return null;
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const snapshot = marketDataService.getSync();
  const rate = snapshot.exchangeRates.rates[currency]?.rateToUsd;
  if (!rate || rate <= 0) return null;

  const usd = amount / rate;
  return (
    <span className={className}>
      {intl.formatMessage(
        { id: 'tools-shared.labels.usdEquivalent' },
        { usd: formatCurrency(usd, 'en', { maximumFractionDigits: 0 }) },
      )}
    </span>
  );
}
