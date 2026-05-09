/**
 * Currency-hedged future-value formulas — for non-US locales where the
 * customer holds USD yield while their reporting currency depreciates.
 *
 * Effective rate model (NOT explicit FX conversion):
 *   effectiveLocalAPY = (1 + usdYield) * (1 + localDepreciation) - 1
 *
 * All depreciation is uncapped (both BRL and EUR). See
 * docs/audit/PREPARING_FOR_ANALYTICS_DATA.md §15.0 assumption 10.
 */

import type { DepositTiming } from '../types';
import {
  calculateMonthlyContributions,
  MONTHS_PER_YEAR,
  type MonthlyContributionResult,
} from './core';

// ---------------------------------------------------------------------------
// Currency hedge — lump sum
// ---------------------------------------------------------------------------

export interface CurrencyHedgeResult {
  effectiveLocalAPY: number;
  nominalFV: number;
  realFV: number;
  nominalGain: number;
  realGain: number;
  /**
   * Modeled USD equivalent — NOT a true FX-converted value. Computed by
   * removing the depreciation component from the local-currency result.
   */
  estimatedUsdEquivalent: number;
}

export function calculateWithCurrencyHedge(
  principal: number,
  usdYield: number,
  localDepreciation: number,
  localInflation: number,
  years: number,
): CurrencyHedgeResult {
  const effectiveLocalAPY = (1 + usdYield) * (1 + localDepreciation) - 1;
  const nominalFV = principal * Math.pow(1 + effectiveLocalAPY, years);
  const realFV = nominalFV / Math.pow(1 + localInflation, years);
  const estimatedUsdEquivalent = nominalFV / Math.pow(1 + localDepreciation, years);

  return {
    effectiveLocalAPY,
    nominalFV,
    realFV,
    nominalGain: nominalFV - principal,
    realGain: realFV - principal,
    estimatedUsdEquivalent,
  };
}

// ---------------------------------------------------------------------------
// Currency hedge — monthly contributions
// ---------------------------------------------------------------------------

export interface MonthlyHedgeResult extends MonthlyContributionResult {
  effectiveLocalAPY: number;
  /** Modeled USD equivalent — see CurrencyHedgeResult.estimatedUsdEquivalent */
  estimatedUsdEquivalent: number;
}

export function calculateMonthlyWithCurrencyHedge(
  monthlyPayment: number,
  usdYield: number,
  localDepreciation: number,
  localInflation: number,
  months: number,
  timing: DepositTiming = 'end',
): MonthlyHedgeResult {
  const effectiveLocalAPY = (1 + usdYield) * (1 + localDepreciation) - 1;

  const result = calculateMonthlyContributions(
    monthlyPayment,
    effectiveLocalAPY,
    localInflation,
    months,
    timing,
  );

  const years = months / MONTHS_PER_YEAR;
  const estimatedUsdEquivalent = result.nominalFV / Math.pow(1 + localDepreciation, years);

  return {
    ...result,
    effectiveLocalAPY,
    estimatedUsdEquivalent,
  };
}
