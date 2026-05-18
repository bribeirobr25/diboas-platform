/**
 * Market-data financial formulas — public barrel.
 *
 * Phase 3.2.b (audit/2026-05-08): split from a 350-LoC monolith into
 * `formulas/core.ts` (compounding, monthly contributions, time-to-target,
 * fees) and `formulas/currencyHedge.ts` (USD-yield × local-depreciation
 * variants for non-US locales).
 *
 * Call sites continue to import `from '@/lib/market-data/formulas'`;
 * this barrel preserves the original public surface unchanged.
 */

// MONTHS_PER_YEAR is intentionally NOT re-exported here — it was private to
// the original `formulas.ts` and stays cross-module-internal between
// `core.ts` and `currencyHedge.ts`. Keeping the public barrel surface
// identical to the pre-split file.
export {
  annualToMonthlyRate,
  selectInflationRate,
  calculateLumpSum,
  calculateMonthlyContributions,
  monthsToInflationAdjustedTarget,
  monthsToStaticTarget,
  purchasingPower,
  calculateFee,
  applyPlatformFees,
  type LumpSumResult,
  type MonthlyContributionResult,
  type FeeResult,
} from './formulas/core';

export {
  calculateWithCurrencyHedge,
  calculateMonthlyWithCurrencyHedge,
  calculateMonthlyPathDependentHedge,
  type CurrencyHedgeResult,
  type MonthlyHedgeResult,
  type PathDependentHedgeArgs,
  type PathDependentHedgeResult,
} from './formulas/currencyHedge';
