/**
 * PreDream Calculation Functions
 *
 * Pure functions for calculating dream simulation results
 * totalInvestment = initial + (monthly * months)
 * defiBalance = totalInvestment * multiplier
 * bankBalance = totalInvestment * (1 + bankApy/100)^years
 */

import type { PreDreamPath, PreDreamTimeframe, PreDreamResult } from './types';
import { PRE_DREAM_PATHS, PRE_DREAM_TIMEFRAMES, PRE_DREAM_BANK_APY } from './constants';

/**
 * Calculate PreDream simulation result
 */
export function calculatePreDreamResult(
  path: PreDreamPath,
  timeframe: PreDreamTimeframe,
  initialAmount: number,
  monthlyContribution: number
): PreDreamResult {
  const pathConfig = PRE_DREAM_PATHS[path];
  const timeframeConfig = PRE_DREAM_TIMEFRAMES[timeframe];

  // Total investment = initial + (monthly × months)
  const totalInvestment = initialAmount + (monthlyContribution * timeframeConfig.months);

  // DeFi balance using path multiplier
  const defiMultiplier = pathConfig.multipliers[timeframe];
  const defiBalance = totalInvestment * defiMultiplier;
  const defiInterest = defiBalance - totalInvestment;

  // Bank balance using compound interest
  const bankApy = PRE_DREAM_BANK_APY / 100;
  const bankMultiplier = Math.pow(1 + bankApy, timeframeConfig.years);
  const bankBalance = totalInvestment * bankMultiplier;
  const bankInterest = bankBalance - totalInvestment;

  // Difference
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
    pathApy: pathConfig.apy,
  };
}
