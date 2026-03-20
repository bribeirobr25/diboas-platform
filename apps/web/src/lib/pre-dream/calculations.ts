/**
 * PreDream Calculation Functions
 *
 * Pure functions for calculating dream simulation results.
 * Uses standard compound interest + annuity formula via shared futureValue().
 */

import type { PreDreamPath, PreDreamTimeframe, PreDreamResult } from './types';
import { PRE_DREAM_PATHS, PRE_DREAM_TIMEFRAMES } from './constants';
import { futureValue, apyToMonthlyRate } from '@/lib/utils/financialMath';
import { BANK_RATE_SOURCES, DEFAULT_BANK_RATE_SOURCE } from '@/lib/dream-mode/constants';

/**
 * Resolve bank rate config for a locale.
 * Fallback chain: override → locale-specific rate → US FDIC default.
 */
export function resolveBankRate(locale: string, apyOverride?: number) {
  const source = BANK_RATE_SOURCES[locale] ?? DEFAULT_BANK_RATE_SOURCE;
  return {
    apy: typeof apyOverride === 'number' && apyOverride >= 0 ? apyOverride : source.rate,
    currencyDepreciation: source.currencyDepreciation,
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
 * Uses FV = S * (1+r)^n + PMT * ((1+r)^n - 1) / r for both DeFi and bank.
 * Optionally applies currency depreciation to bank interest (e.g., BRL vs USD).
 */
export function calculatePreDreamResult(
  path: PreDreamPath,
  timeframe: PreDreamTimeframe,
  initialAmount: number,
  monthlyContribution: number,
  bankApy: number,
  currencyDepreciation: number = 0,
  defiApy?: number
): PreDreamResult {
  const timeframeConfig = PRE_DREAM_TIMEFRAMES[timeframe];
  const months = timeframeConfig.months;
  const resolvedDefiApy = defiApy ?? PRE_DREAM_PATHS[path].apy;

  const totalInvestment = initialAmount + (monthlyContribution * months);

  // DeFi balance — correct compound interest + annuity formula
  const defiRate = apyToMonthlyRate(resolvedDefiApy);
  const defiBalance = futureValue(initialAmount, monthlyContribution, defiRate, months);
  const defiInterest = defiBalance - totalInvestment;

  // Bank balance — same formula with bank APY
  const bankRate = apyToMonthlyRate(bankApy);
  let bankBalance = futureValue(initialAmount, monthlyContribution, bankRate, months);
  let bankInterest = bankBalance - totalInvestment;

  // Apply currency depreciation (Brazil: 6% annual BRL depreciation vs USD)
  if (currencyDepreciation > 0) {
    const depreciationFactor = Math.pow(1 - currencyDepreciation, timeframeConfig.years);
    bankInterest = bankInterest * depreciationFactor;
    bankBalance = totalInvestment + bankInterest;
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
  };
}
