/**
 * Dream Mode - Calculations
 *
 * Growth calculation functions for Dream Mode simulations
 * Uses path-based multipliers from historical DeFiLlama data
 */

import type { DreamPath, DreamTimeframe, GrowthResult, BankComparisonResult } from './types';
import { PATH_CONFIGS, BANK_APY_RATE, TIMEFRAME_DAYS, ECB_SOURCE_CITATION } from './constants';

/**
 * Calculate growth for a given amount, path, and timeframe
 *
 * @param amount - Starting amount
 * @param path - Investment path (safety/balance/growth)
 * @param timeframe - Time horizon
 * @returns Growth calculation result
 */
export function calculatePathGrowth(
  amount: number,
  path: DreamPath,
  timeframe: DreamTimeframe
): GrowthResult {
  const pathConfig = PATH_CONFIGS[path];
  const multiplier = pathConfig.projections[timeframe].multiplier;

  const finalBalance = amount * multiplier;
  const growthAmount = finalBalance - amount;
  const growthPercentage = ((finalBalance - amount) / amount) * 100;

  return {
    finalBalance: Math.round(finalBalance * 100) / 100,
    startAmount: amount,
    growthAmount: Math.round(growthAmount * 100) / 100,
    growthPercentage: Math.round(growthPercentage * 100) / 100,
    path,
    timeframe,
  };
}

/**
 * Calculate bank comparison for a given amount and timeframe
 *
 * Uses compound interest formula with bank APY rate (0.5%)
 *
 * @param amount - Starting amount
 * @param timeframe - Time horizon
 * @returns Bank balance after the timeframe
 */
export function calculateBankBalance(amount: number, timeframe: DreamTimeframe): number {
  const days = TIMEFRAME_DAYS[timeframe];
  const years = days / 365;
  const bankRate = BANK_APY_RATE / 100;

  // Simple compound interest: A = P(1 + r)^t
  const bankBalance = amount * Math.pow(1 + bankRate, years);

  return Math.round(bankBalance * 100) / 100;
}

/**
 * Calculate full bank comparison including DeFi result
 *
 * @param amount - Starting amount
 * @param path - Investment path
 * @param timeframe - Time horizon
 * @returns Comparison result with both balances and difference
 */
export function calculateBankComparison(
  amount: number,
  path: DreamPath,
  timeframe: DreamTimeframe
): BankComparisonResult {
  const defiResult = calculatePathGrowth(amount, path, timeframe);
  const bankBalance = calculateBankBalance(amount, timeframe);

  const difference = defiResult.finalBalance - bankBalance;

  return {
    bankBalance,
    defiBalance: defiResult.finalBalance,
    difference: Math.round(difference * 100) / 100,
    bankRate: BANK_APY_RATE,
    source: `${ECB_SOURCE_CITATION.source}, ${ECB_SOURCE_CITATION.date}`,
  };
}

/**
 * Get path APY for display
 *
 * @param path - Investment path
 * @returns Average APY for the path
 */
export function getPathApy(path: DreamPath): number {
  return PATH_CONFIGS[path].avgApy;
}

/**
 * Get path risk metrics for display
 *
 * @param path - Investment path
 * @returns Risk metrics (max drawdown, probability of loss)
 */
export function getPathRiskMetrics(path: DreamPath): {
  maxDrawdown: number;
  probabilityOfLoss: number;
  warning?: string;
} {
  const config = PATH_CONFIGS[path];
  return {
    maxDrawdown: config.maxDrawdown,
    probabilityOfLoss: config.probabilityOfLoss,
    warning: config.warning,
  };
}

/**
 * Format currency value for display
 *
 * @param value - Numeric value
 * @param currency - Currency code (default EUR)
 * @param locale - Locale for formatting (default de-DE)
 * @returns Formatted currency string
 */
export function formatDreamCurrency(
  value: number,
  currency: string = 'EUR',
  locale: string = 'de-DE'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage value for display
 *
 * @param value - Percentage value
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatDreamPercentage(value: number, decimals: number = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}
