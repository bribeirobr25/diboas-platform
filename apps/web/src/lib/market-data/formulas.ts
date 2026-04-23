/**
 * Market Data Formulas
 *
 * Canonical financial calculation functions for the diBoaS platform.
 * All formulas documented in docs/audit/PREPARING_FOR_ANALYTICS_DATA.md Section 15.
 *
 * Key modeling assumptions (Section 15.0):
 * - End-of-month deposits (ordinary annuity) by default
 * - Compound rate conversion via annualToMonthlyRate(), never r/12
 * - Inflation selected via selectInflationRate(), never ad hoc
 * - Currency hedge uses effective rate model (not explicit conversion)
 * - All depreciation is uncapped (both BRL and EUR)
 */

import type { SupportedLocale, DepositTiming, InflationRates } from './types';

const MONTHS_PER_YEAR = 12;

// ---------------------------------------------------------------------------
// Core conversions
// ---------------------------------------------------------------------------

/**
 * Convert annual rate to effective monthly rate.
 * Uses geometric conversion: r_monthly = (1 + r_annual)^(1/12) - 1
 */
export function annualToMonthlyRate(annualRate: number): number {
  if (annualRate <= -1) {
    throw new Error('annualRate must be greater than -100%');
  }
  return Math.pow(1 + annualRate, 1 / MONTHS_PER_YEAR) - 1;
}

// ---------------------------------------------------------------------------
// Inflation selection
// ---------------------------------------------------------------------------

/**
 * Canonical inflation selector.
 * Goals <= 24 months: use current inflation.
 * Goals > 24 months: use 5-year average inflation.
 */
export function selectInflationRate(
  locale: SupportedLocale,
  horizonMonths: number,
  inflationRates: InflationRates
): number {
  const source = inflationRates.rates[locale];
  return horizonMonths <= 24 ? source.current : source.average5y;
}

// ---------------------------------------------------------------------------
// Lump sum
// ---------------------------------------------------------------------------

export interface LumpSumResult {
  nominalFV: number;
  realFV: number;
  nominalGain: number;
  realGain: number;
}

export function calculateLumpSum(
  principal: number,
  annualRate: number,
  annualInflation: number,
  years: number
): LumpSumResult {
  const nominalFV = principal * Math.pow(1 + annualRate, years);
  const realFV = nominalFV / Math.pow(1 + annualInflation, years);

  return {
    nominalFV,
    realFV,
    nominalGain: nominalFV - principal,
    realGain: realFV - principal,
  };
}

// ---------------------------------------------------------------------------
// Monthly contributions
// ---------------------------------------------------------------------------

export interface MonthlyContributionResult {
  totalDeposited: number;
  nominalFV: number;
  realFV: number;
  nominalGain: number;
  realGain: number;
}

/**
 * Canonical monthly contribution model.
 * Uses ordinary annuity timing by default (end-of-month contributions).
 * Guards against zero rate (returns simple sum).
 */
export function calculateMonthlyContributions(
  monthlyPayment: number,
  annualRate: number,
  annualInflation: number,
  months: number,
  timing: DepositTiming = 'end'
): MonthlyContributionResult {
  const totalDeposited = monthlyPayment * months;
  const i = annualToMonthlyRate(annualRate);
  const years = months / MONTHS_PER_YEAR;

  let nominalFV: number;
  if (Math.abs(i) < 1e-12) {
    nominalFV = totalDeposited;
  } else {
    nominalFV = monthlyPayment * ((Math.pow(1 + i, months) - 1) / i);
    if (timing === 'beginning') {
      nominalFV *= (1 + i);
    }
  }

  const realFV = nominalFV / Math.pow(1 + annualInflation, years);

  return {
    totalDeposited,
    nominalFV,
    realFV,
    nominalGain: nominalFV - totalDeposited,
    realGain: realFV - totalDeposited,
  };
}

// ---------------------------------------------------------------------------
// Currency hedge — lump sum (non-US locales)
// ---------------------------------------------------------------------------

export interface CurrencyHedgeResult {
  effectiveLocalAPY: number;
  nominalFV: number;
  realFV: number;
  nominalGain: number;
  realGain: number;
  /** Modeled USD equivalent — NOT a true FX-converted value. Computed by removing
   *  the depreciation component from the local-currency result. */
  estimatedUsdEquivalent: number;
}

/**
 * Lump sum with USD yield + local currency depreciation.
 * All depreciation is uncapped (both BRL and EUR).
 */
export function calculateWithCurrencyHedge(
  principal: number,
  usdYield: number,
  localDepreciation: number,
  localInflation: number,
  years: number
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
// Currency hedge — monthly contributions (non-US locales)
// ---------------------------------------------------------------------------

export interface MonthlyHedgeResult {
  totalDeposited: number;
  nominalFV: number;
  realFV: number;
  nominalGain: number;
  realGain: number;
  effectiveLocalAPY: number;
  /** Modeled USD equivalent — see CurrencyHedgeResult.estimatedUsdEquivalent */
  estimatedUsdEquivalent: number;
}

/**
 * Monthly contribution model for non-US diBoaS cases.
 * Effective rate = (1 + usdYield) * (1 + localDepreciation) - 1
 * All depreciation is uncapped — standard annuity formula applies.
 *
 * This uses the effective rate model, NOT the explicit conversion model.
 * See Section 15.0 assumption 10 for rationale.
 */
export function calculateMonthlyWithCurrencyHedge(
  monthlyPayment: number,
  usdYield: number,
  localDepreciation: number,
  localInflation: number,
  months: number,
  timing: DepositTiming = 'end'
): MonthlyHedgeResult {
  const effectiveLocalAPY = (1 + usdYield) * (1 + localDepreciation) - 1;

  const result = calculateMonthlyContributions(
    monthlyPayment,
    effectiveLocalAPY,
    localInflation,
    months,
    timing
  );

  const years = months / MONTHS_PER_YEAR;
  const estimatedUsdEquivalent = result.nominalFV / Math.pow(1 + localDepreciation, years);

  return {
    ...result,
    effectiveLocalAPY,
    estimatedUsdEquivalent,
  };
}

// ---------------------------------------------------------------------------
// Time to target (emergency fund)
// ---------------------------------------------------------------------------

/**
 * Canonical emergency-fund timing function.
 * The target grows with inflation each month.
 */
export function monthsToInflationAdjustedTarget(
  targetToday: number,
  monthlyPayment: number,
  annualRate: number,
  annualInflation: number,
  timing: DepositTiming = 'end'
): number {
  if (monthlyPayment <= 0) {
    throw new Error('monthlyPayment must be greater than 0');
  }

  const i = annualToMonthlyRate(annualRate);
  const j = annualToMonthlyRate(annualInflation);

  let balance = 0;
  let month = 0;

  while (month < 1200) {
    month += 1;

    if (timing === 'beginning') {
      balance += monthlyPayment;
      balance *= (1 + i);
    } else {
      balance *= (1 + i);
      balance += monthlyPayment;
    }

    const targetForMonth = targetToday * Math.pow(1 + j, month);

    if (balance >= targetForMonth) {
      return month;
    }
  }

  throw new Error('Target not reached within 1200 months');
}

/**
 * Legacy helper for cases that intentionally use a static target.
 * Do not use for emergency-fund cards.
 */
export function monthsToStaticTarget(
  target: number,
  monthlyPayment: number,
  annualRate: number,
  timing: DepositTiming = 'end'
): number {
  if (monthlyPayment <= 0) {
    throw new Error('monthlyPayment must be greater than 0');
  }

  const i = annualToMonthlyRate(annualRate);

  if (Math.abs(i) < 1e-12) {
    return Math.ceil(target / monthlyPayment);
  }

  const adjustedTarget = timing === 'beginning' ? target / (1 + i) : target;
  const n = Math.log(1 + (adjustedTarget * i) / monthlyPayment) / Math.log(1 + i);

  return Math.ceil(n);
}

// ---------------------------------------------------------------------------
// Fee calculations
// ---------------------------------------------------------------------------

export interface FeeResult {
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
}

export function calculateFee(
  amount: number,
  feeRate: number,
  minFee: number = 0.25,
  maxFee: number = 25.00
): FeeResult {
  if (feeRate === 0) {
    return { grossAmount: amount, feeAmount: 0, netAmount: amount };
  }

  let feeAmount = amount * feeRate;
  feeAmount = Math.max(minFee, Math.min(maxFee, feeAmount));

  return {
    grossAmount: amount,
    feeAmount,
    netAmount: amount - feeAmount,
  };
}

/**
 * Apply entry and exit fees around a projected future value.
 * Use when customer-facing outputs must be net of platform fees.
 */
export function applyPlatformFees(
  principal: number,
  projectedFutureValue: number,
  entryFeeRate: number,
  exitFeeRate: number,
  minFee: number = 0.25,
  maxFee: number = 25.00
): { principalAfterEntry: number; endAfterExit: number } {
  if (principal === 0) {
    const exit = calculateFee(projectedFutureValue, exitFeeRate, minFee, maxFee);
    return { principalAfterEntry: 0, endAfterExit: exit.netAmount };
  }

  const entry = calculateFee(principal, entryFeeRate, minFee, maxFee);
  const adjustedGrowthFactor = projectedFutureValue / principal;
  const grossEnd = entry.netAmount * adjustedGrowthFactor;
  const exit = calculateFee(grossEnd, exitFeeRate, minFee, maxFee);

  return {
    principalAfterEntry: entry.netAmount,
    endAfterExit: exit.netAmount,
  };
}
