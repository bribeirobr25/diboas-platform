/**
 * GoalCalculator pure math functions — no React, fully testable.
 * All geometric compounding — NOT arithmetic (y/12).
 */

import type { ScenarioResult, RiskTierIndex } from './goalCalculatorTypes';
import { RISK_TIERS } from './goalCalculatorConstants';

/**
 * Convert annual APY to monthly rate using geometric compounding.
 * For negative APY: r = -(1 - (1 + y)^(1/12))
 */
export function annualToMonthlyRate(apy: number): number {
  if (apy === 0) return 0;
  if (apy < 0) {
    return -(1 - Math.pow(1 + apy, 1 / 12));
  }
  return Math.pow(1 + apy, 1 / 12) - 1;
}

/**
 * Future value with initial deposit and monthly contributions (ordinary annuity).
 * FV = I × (1+r)^n + M × ((1+r)^n - 1) / r
 */
export function futureValue(initialDeposit: number, monthlyDeposit: number, monthlyRate: number, months: number): number {
  if (months <= 0) return initialDeposit;
  if (monthlyRate === 0) {
    return initialDeposit + monthlyDeposit * months;
  }
  const compoundFactor = Math.pow(1 + monthlyRate, months);
  return initialDeposit * compoundFactor + monthlyDeposit * ((compoundFactor - 1) / monthlyRate);
}

/**
 * Suggested monthly deposit to reach a target.
 * M = (Target - I × (1+r)^n) / (((1+r)^n - 1) / r)
 * Returns 0 if negative (initial deposit already covers target).
 */
export function suggestedMonthly(target: number, initialDeposit: number, monthlyRate: number, months: number): number {
  if (months <= 0) return 0;
  if (monthlyRate === 0) {
    const result = (target - initialDeposit) / months;
    return Math.max(0, result);
  }
  const compoundFactor = Math.pow(1 + monthlyRate, months);
  const annuityFactor = (compoundFactor - 1) / monthlyRate;
  const result = (target - initialDeposit * compoundFactor) / annuityFactor;
  return Math.max(0, result);
}

/**
 * Compute scenario results (good, expected, bad) for a given risk tier.
 */
export function computeScenarios(
  initialDeposit: number,
  monthlyDeposit: number,
  months: number,
  tierIndex: RiskTierIndex,
): ScenarioResult {
  const tier = RISK_TIERS[tierIndex];
  const rGood = annualToMonthlyRate(tier.goodAPY);
  const rExpected = annualToMonthlyRate(tier.expectedAPY);
  const rBad = annualToMonthlyRate(tier.badAPY);

  return {
    good: Math.round(futureValue(initialDeposit, monthlyDeposit, rGood, months)),
    expected: Math.round(futureValue(initialDeposit, monthlyDeposit, rExpected, months)),
    bad: Math.round(futureValue(initialDeposit, monthlyDeposit, rBad, months)),
  };
}

/**
 * Calculate months remaining until a target date from today.
 * Returns number of full monthly contribution periods.
 */
export function monthsUntil(targetDate: Date): number {
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  const months = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
  return Math.max(0, months);
}

/**
 * Get the next Christmas target date (December 1).
 * If today is past Dec 1, returns Dec 1 next year.
 * Returns { date, rolledOver }.
 */
export function getChristmasTarget(): { date: Date; rolledOver: boolean } {
  const now = new Date();
  const year = now.getFullYear();
  const dec1 = new Date(year, 11, 1);
  if (now >= dec1) {
    return { date: new Date(year + 1, 11, 1), rolledOver: true };
  }
  const months = monthsUntil(dec1);
  if (months === 0) {
    return { date: new Date(year + 1, 11, 1), rolledOver: true };
  }
  return { date: dec1, rolledOver: false };
}

/**
 * Check if the bad-case scenario results in a loss relative to total deposits.
 */
export function isBadCaseLoss(badCaseValue: number, initialDeposit: number, monthlyDeposit: number, months: number): boolean {
  const totalDeposits = initialDeposit + monthlyDeposit * months;
  return badCaseValue < totalDeposits;
}
