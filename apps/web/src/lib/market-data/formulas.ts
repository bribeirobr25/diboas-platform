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
  applyEffectiveRateClamp,
  createHedgedRateTransformer,
  calculateWithCurrencyHedge,
  calculateMonthlyWithCurrencyHedge,
  calculateMonthlyPathDependentHedge,
  EFFECTIVE_RATE_FLOOR,
  type CurrencyHedgeResult,
  type MonthlyHedgeResult,
  type PathDependentHedgeArgs,
  type PathDependentHedgeResult,
} from './formulas/currencyHedge';

// Phase D (TOOLS_IMPROVEMENT.md, 2026-05-23): horizon-matched continuous-window
// CAGR derivation for forward FX projection + policy helper for calculators.
export {
  deriveHorizonMatchedCAGR,
  resolveHorizonMatchedDepreciation,
} from './formulas/horizonMatchedCagr';

// Phase G (TOOLS_IMPROVEMENT.md, 2026-05-23): Brazil poupança Selic-threshold
// regime-switch formula. Used by pt-BR-locale calculators to derive the live
// poupança rate from Selic + TR.
export { derivePoupancaRate, BRAZIL_POUPANCA_SELIC_THRESHOLD } from './formulas/brazilPoupanca';
