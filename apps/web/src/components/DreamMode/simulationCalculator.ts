/**
 * Dream Mode Simulation Calculator
 *
 * Pure utility functions for calculating simulation results
 * Extracted from DreamModeProvider for better separation of concerns
 *
 * Domain-Driven Design: Calculation logic isolated in utility
 * Code Reusability: Can be tested independently and used elsewhere
 */

import type { DreamInput, DreamResult } from './types';
import { PATH_CONFIGS, BANK_APY_RATE, type DreamPath } from '@/lib/dream-mode';

/**
 * Map timeframe string to projection key
 */
const TIMEFRAME_TO_PROJECTION: Record<string, '1_week' | '1_month' | '1_year' | '5_years'> = {
  '1week': '1_week',
  '1month': '1_month',
  '1year': '1_year',
  '5years': '5_years',
};

/**
 * Map timeframe to number of months
 */
const TIMEFRAME_TO_MONTHS: Record<string, number> = {
  '1week': 0.25,
  '1month': 1,
  '1year': 12,
  '5years': 60,
};

/**
 * Map timeframe to number of years
 */
const TIMEFRAME_TO_YEARS: Record<string, number> = {
  '1week': 7 / 365,
  '1month': 1 / 12,
  '1year': 1,
  '5years': 5,
};

/**
 * Calculate total investment from initial amount and monthly contributions
 */
export function calculateTotalInvestment(
  initialAmount: number,
  monthlyContribution: number,
  timeframe: string
): number {
  const months = TIMEFRAME_TO_MONTHS[timeframe] || 12;
  return initialAmount + monthlyContribution * months;
}

/**
 * Calculate DeFi balance based on path and timeframe
 */
export function calculateDefiBalance(
  totalInvestment: number,
  path: DreamPath,
  timeframe: string
): { balance: number; multiplier: number; apy: number } {
  const pathConfig = PATH_CONFIGS[path];
  const projectionKey = TIMEFRAME_TO_PROJECTION[timeframe] || '1_year';
  const multiplier = pathConfig.projections[projectionKey].multiplier;

  return {
    balance: totalInvestment * multiplier,
    multiplier,
    apy: pathConfig.avgApy,
  };
}

/**
 * Calculate bank balance using compound interest
 */
export function calculateBankBalance(
  totalInvestment: number,
  timeframe: string
): number {
  const bankApy = BANK_APY_RATE / 100; // Convert 0.5% to 0.005
  const years = TIMEFRAME_TO_YEARS[timeframe] || 1;
  const bankMultiplier = Math.pow(1 + bankApy, years);
  return totalInvestment * bankMultiplier;
}

/**
 * Calculate complete simulation result
 */
export function calculateSimulationResult(
  input: DreamInput,
  selectedPath: DreamPath
): DreamResult {
  const totalInvestment = calculateTotalInvestment(
    input.initialAmount,
    input.monthlyContribution,
    input.timeframe
  );

  const defiResult = calculateDefiBalance(totalInvestment, selectedPath, input.timeframe);
  const defiBalance = defiResult.balance;
  const defiInterest = defiBalance - totalInvestment;

  const bankBalance = calculateBankBalance(totalInvestment, input.timeframe);
  const bankInterest = bankBalance - totalInvestment;

  const difference = defiBalance - bankBalance;
  const growthPercentage = ((defiBalance - totalInvestment) / totalInvestment) * 100;

  return {
    defiBalance,
    bankBalance,
    defiInterest,
    bankInterest,
    difference,
    growthPercentage,
    totalInvestment,
    pathApy: defiResult.apy,
  };
}
