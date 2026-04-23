/**
 * PreDream Calculation Functions
 *
 * Pure functions for calculating dream simulation results.
 * Uses canonical formulas from lib/market-data/formulas.ts.
 *
 * For non-US locales, the diBoaS side uses calculateMonthlyWithCurrencyHedge()
 * with the effective rate model. Bank side always uses standard compound interest.
 */

import type { PreDreamPath, PreDreamTimeframe, PreDreamResult } from './types';
import { PRE_DREAM_TIMEFRAMES } from './constants';
import { futureValue, apyToMonthlyRate } from '@/lib/utils/financialMath';
import {
  calculateMonthlyWithCurrencyHedge,
  calculateWithCurrencyHedge,
  type MarketDataSnapshot,
  type SupportedLocale,
} from '@/lib/market-data';
import { LOCALE_CURRENCY } from '@/lib/market-data/constants';

/** Override map for strategy APYs (from diBoaS analytics API when available) */
export type StrategyApyOverrides = Partial<Record<PreDreamPath, number>>;

/**
 * Resolve bank rate for a locale from market data.
 */
export function resolveBankRate(locale: string, marketData: MarketDataSnapshot, apyOverride?: number) {
  const localeKey = (locale in marketData.rates.bankRates ? locale : 'en') as SupportedLocale;
  const bankRates = marketData.rates.bankRates[localeKey];
  return {
    apy: typeof apyOverride === 'number' && apyOverride >= 0 ? apyOverride : bankRates.savings,
    source: bankRates.source,
    sourceDate: bankRates.sourceDate,
  };
}

/**
 * Resolve the APY for a strategy path from market data.
 */
export function resolveStrategyApy(
  path: PreDreamPath,
  marketData: MarketDataSnapshot,
  overrides?: StrategyApyOverrides
): number {
  const override = overrides?.[path];
  if (typeof override === 'number' && override > 0) return override;
  return marketData.rates.strategyApys[path];
}

/**
 * Get exchange rate config for a locale (null for US).
 */
function getLocaleExchangeRate(locale: string, marketData: MarketDataSnapshot) {
  const currency = LOCALE_CURRENCY[locale];
  if (!currency || currency === 'USD') return null;
  return marketData.exchangeRates.rates[currency] ?? null;
}

/**
 * Calculate PreDream simulation result.
 *
 * - Bank side: always standard compound interest in local currency
 * - diBoaS side: effective rate model for non-US locales (currency hedge),
 *                standard compound interest for US locale
 */
export function calculatePreDreamResult(
  path: PreDreamPath,
  timeframe: PreDreamTimeframe,
  initialAmount: number,
  monthlyContribution: number,
  bankApy: number,
  locale: string,
  marketData: MarketDataSnapshot,
  defiApy?: number
): PreDreamResult {
  const timeframeConfig = PRE_DREAM_TIMEFRAMES[timeframe];
  const months = timeframeConfig.months;
  const resolvedDefiApy = defiApy ?? marketData.rates.strategyApys[path];

  const totalInvestment = initialAmount + (monthlyContribution * months);

  // Bank balance — always standard compound interest in local currency
  const bankRate = apyToMonthlyRate(bankApy);
  const bankBalance = futureValue(initialAmount, monthlyContribution, bankRate, months);
  const bankInterest = bankBalance - totalInvestment;

  // DeFi balance — currency hedge for non-US locales
  let defiBalance: number;
  let defiInterest: number;
  let diboasYieldBalance: number | undefined;

  const exchangeRate = getLocaleExchangeRate(locale, marketData);

  if (exchangeRate) {
    const hedge = calculateMonthlyWithCurrencyHedge(
      monthlyContribution,
      resolvedDefiApy / 100,
      exchangeRate.annualDepreciation,
      0, // inflation not used for nominal display
      months
    );
    // Add lump sum component if present
    if (initialAmount > 0) {
      const lumpHedge = calculateWithCurrencyHedge(
        initialAmount,
        resolvedDefiApy / 100,
        exchangeRate.annualDepreciation,
        0,
        months / 12
      );
      defiBalance = hedge.nominalFV + lumpHedge.nominalFV;
      diboasYieldBalance = hedge.estimatedUsdEquivalent + lumpHedge.estimatedUsdEquivalent;
    } else {
      defiBalance = hedge.nominalFV;
      diboasYieldBalance = hedge.estimatedUsdEquivalent;
    }
    defiInterest = defiBalance - totalInvestment;
  } else {
    const defiRate = apyToMonthlyRate(resolvedDefiApy);
    defiBalance = futureValue(initialAmount, monthlyContribution, defiRate, months);
    defiInterest = defiBalance - totalInvestment;
  }

  const difference = defiBalance - bankBalance;
  const growthPercentage = totalInvestment > 0
    ? ((defiBalance - totalInvestment) / totalInvestment) * 100
    : 0;

  return {
    totalInvestment,
    defiBalance,
    defiInterest,
    bankBalance,
    bankInterest,
    difference,
    growthPercentage,
    pathApy: resolvedDefiApy,
    bankApy,
    diboasYieldBalance,
  };
}
