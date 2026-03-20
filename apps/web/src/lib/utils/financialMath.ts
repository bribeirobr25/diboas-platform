/**
 * Shared Financial Math Utilities
 *
 * Pure functions for compound interest calculations.
 * Used by GoalCalculator and PreDream domains.
 */

/**
 * Future value of an investment with optional monthly contributions.
 *
 * FV = S * (1+r)^n + PMT * ((1+r)^n - 1) / r
 *
 * @param initialAmount  Initial lump sum (S)
 * @param monthlyPayment Monthly contribution (PMT)
 * @param monthlyRate    Monthly interest rate (r). Use apyToMonthlyRate() to convert from APY.
 * @param months         Total number of months (n)
 */
export function futureValue(
  initialAmount: number,
  monthlyPayment: number,
  monthlyRate: number,
  months: number
): number {
  if (months <= 0) return initialAmount;
  if (monthlyRate === 0) return initialAmount + monthlyPayment * months;

  const compoundFactor = Math.pow(1 + monthlyRate, months);
  return initialAmount * compoundFactor + monthlyPayment * ((compoundFactor - 1) / monthlyRate);
}

/**
 * Convert APY (annual percentage yield) to monthly rate.
 * Uses geometric conversion: r = (1 + APY/100)^(1/12) - 1
 */
export function apyToMonthlyRate(apyPercent: number): number {
  return Math.pow(1 + apyPercent / 100, 1 / 12) - 1;
}
