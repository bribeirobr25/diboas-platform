/**
 * PreDream Calculation Functions
 *
 * Pure functions for calculating dream simulation results.
 * Uses standard compound interest + annuity formula via shared futureValue().
 *
 * For locales with exchange rate config (e.g., pt-BR), the diBoaS side uses
 * futureValueWithCurrencyHedge() to model: local → USD → earn yield → reconvert.
 * Bank side always uses standard futureValue() in local currency.
 */

import type { PreDreamPath, PreDreamTimeframe, PreDreamResult } from './types';
import { PRE_DREAM_PATHS, PRE_DREAM_TIMEFRAMES } from './constants';
import { futureValue, apyToMonthlyRate, futureValueWithCurrencyHedge } from '@/lib/utils/financialMath';
import { BANK_RATE_SOURCES, DEFAULT_BANK_RATE_SOURCE, type ExchangeRateConfig } from '@/lib/dream-mode/constants';

/**
 * Resolve bank rate config for a locale.
 * Fallback chain: override → locale-specific rate → US FDIC default.
 */
export function resolveBankRate(locale: string, apyOverride?: number) {
  const source = BANK_RATE_SOURCES[locale] ?? DEFAULT_BANK_RATE_SOURCE;
  return {
    apy: typeof apyOverride === 'number' && apyOverride >= 0 ? apyOverride : source.rate,
    exchangeRate: source.exchangeRate,
    source: source.source,
    translationKey: source.translationKey,
  };
}

/** Override map for strategy APYs (from diBoaS analytics API when available) */
export type StrategyApyOverrides = Partial<Record<PreDreamPath, number>>;

/**
 * Resolve the APY for a strategy path.
 * Fallback chain: override → hardcoded constant.
 *
 * Future: diBoaS analytics API provides live APY rates.
 * Current: PRE_DREAM_PATHS constants are the fallback.
 */
export function resolveStrategyApy(path: PreDreamPath, overrides?: StrategyApyOverrides): number {
  const override = overrides?.[path];
  if (typeof override === 'number' && override > 0) return override;
  return PRE_DREAM_PATHS[path].apy;
}

/**
 * Calculate PreDream simulation result.
 *
 * - Bank side: always futureValue() in local currency (unchanged across locales)
 * - diBoaS side: if locale has exchangeRate config → futureValueWithCurrencyHedge()
 *                otherwise → standard futureValue() (USD/EUR locales)
 */
export function calculatePreDreamResult(
  path: PreDreamPath,
  timeframe: PreDreamTimeframe,
  initialAmount: number,
  monthlyContribution: number,
  bankApy: number,
  exchangeRate?: ExchangeRateConfig,
  defiApy?: number
): PreDreamResult {
  const timeframeConfig = PRE_DREAM_TIMEFRAMES[timeframe];
  const months = timeframeConfig.months;
  const resolvedDefiApy = defiApy ?? PRE_DREAM_PATHS[path].apy;

  const totalInvestment = initialAmount + (monthlyContribution * months);

  // Bank balance — always standard compound interest in local currency
  const bankRate = apyToMonthlyRate(bankApy);
  const bankBalance = futureValue(initialAmount, monthlyContribution, bankRate, months);
  const bankInterest = bankBalance - totalInvestment;

  // DeFi balance — currency hedge for locales with exchange rate config
  let defiBalance: number;
  let defiInterest: number;
  let diboasYieldBalance: number | undefined;
  let projectedRate: number | undefined;

  if (exchangeRate) {
    const hedge = futureValueWithCurrencyHedge(
      initialAmount,
      monthlyContribution,
      resolvedDefiApy,
      months,
      exchangeRate
    );
    defiBalance = hedge.localBalance;
    defiInterest = defiBalance - totalInvestment;
    diboasYieldBalance = hedge.yieldBalance;
    projectedRate = hedge.projectedRate;
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
    projectedExchangeRate: projectedRate,
  };
}
