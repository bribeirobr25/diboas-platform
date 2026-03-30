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

/**
 * Project exchange rate with depreciation cap.
 *
 * projectedRate = currentRate × (1 + annualDepreciation)^min(years, maxDepreciationYears)
 *
 * The cap prevents unrealistic long-term projections (e.g., 30yr at 12% → 157× multiplier).
 */
export function projectedExchangeRate(
  currentRate: number,
  annualDepreciation: number,
  years: number,
  maxDepreciationYears: number
): number {
  if (annualDepreciation === 0 || years <= 0) return currentRate;
  const effectiveYears = Math.min(years, maxDepreciationYears);
  return currentRate * Math.pow(1 + annualDepreciation, effectiveYears);
}

/**
 * Future value through currency hedge: local → yield currency → earn → reconvert.
 *
 * 1. Convert initial + monthly amounts from local currency to yield currency at current rate
 * 2. Apply futureValue() in yield currency at strategy APY
 * 3. Convert back to local currency at projected (depreciation-capped) exchange rate
 *
 * Monthly contributions all convert at the current rate (conservative simplification).
 */
export function futureValueWithCurrencyHedge(
  initialLocal: number,
  monthlyLocal: number,
  yieldApyPercent: number,
  months: number,
  exchangeRate: {
    currentRate: number;
    annualDepreciation: number;
    maxDepreciationYears: number;
  }
): { yieldBalance: number; localBalance: number; projectedRate: number } {
  const { currentRate, annualDepreciation, maxDepreciationYears } = exchangeRate;

  // Convert local → yield currency
  const initialYield = initialLocal / currentRate;
  const monthlyYield = monthlyLocal / currentRate;

  // Compound in yield currency
  const monthlyRate = apyToMonthlyRate(yieldApyPercent);
  const yieldBalance = futureValue(initialYield, monthlyYield, monthlyRate, months);

  // Project exchange rate with depreciation cap
  const years = months / 12;
  const projected = projectedExchangeRate(currentRate, annualDepreciation, years, maxDepreciationYears);

  // Convert back to local currency
  const localBalance = yieldBalance * projected;

  return { yieldBalance, localBalance, projectedRate: projected };
}
