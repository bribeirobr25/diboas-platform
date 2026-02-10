/**
 * Future You Calculator - Calculations
 *
 * Compound growth calculation functions
 */

import type {
  InvestmentInput,
  ProjectionTimeframe,
  ShortTermTimeframe,
  LongTermTimeframe,
  ProjectionResult,
  ScenarioComparison,
  CalculatorResult,
  ShortTermProjections,
  LongTermProjections,
  RateScenario,
} from './types';

import {
  TIMEFRAME_DAYS,
  DEFI_SCENARIO,
  BANK_SCENARIO,
  LONG_TERM_TIMEFRAMES,
} from './constants';

/**
 * Calculate compound interest with monthly contributions
 *
 * Uses the formula:
 * FV = P(1 + r/n)^(nt) + PMT × [((1 + r/n)^(nt) - 1) / (r/n)]
 *
 * Where:
 * - P = Principal (initial investment)
 * - r = Annual interest rate (decimal)
 * - n = Number of times interest compounds per year (365 for daily)
 * - t = Time in years
 * - PMT = Monthly payment
 */
export function calculateCompoundGrowth(
  principal: number,
  monthlyContribution: number,
  annualRate: number,
  days: number
): { finalBalance: number; interestEarned: number; totalContributed: number } {
  // Convert annual rate to daily rate
  const dailyRate = annualRate / 100 / 365;
  const years = days / 365;
  const months = days / 30;

  // Calculate compound growth on principal
  // Using daily compounding
  const principalGrowth = principal * Math.pow(1 + dailyRate, days);

  // Calculate future value of monthly contributions
  // Using simplified formula for monthly contributions with daily compounding
  let contributionGrowth = 0;

  if (monthlyContribution > 0 && months >= 1) {
    // For each month's contribution, calculate its growth
    const fullMonths = Math.floor(months);
    const monthlyRate = annualRate / 100 / 12;

    for (let i = 0; i < fullMonths; i++) {
      const daysRemaining = days - i * 30;
      if (daysRemaining > 0) {
        contributionGrowth += monthlyContribution * Math.pow(1 + dailyRate, daysRemaining);
      }
    }
  }

  const totalContributed = principal + (Math.floor(months) * monthlyContribution);
  const finalBalance = principalGrowth + contributionGrowth;
  const interestEarned = finalBalance - totalContributed;

  return {
    finalBalance: Math.round(finalBalance * 100) / 100,
    interestEarned: Math.round(interestEarned * 100) / 100,
    totalContributed: Math.round(totalContributed * 100) / 100,
  };
}

/**
 * Calculate projection for a specific timeframe and rate
 */
export function calculateProjection(
  input: InvestmentInput,
  apy: number,
  timeframe: ProjectionTimeframe
): ProjectionResult {
  const days = TIMEFRAME_DAYS[timeframe];

  const { finalBalance, interestEarned, totalContributed } = calculateCompoundGrowth(
    input.initialAmount,
    input.monthlyContribution,
    apy,
    days
  );

  const growthPercentage =
    totalContributed > 0
      ? ((finalBalance - totalContributed) / totalContributed) * 100
      : 0;

  return {
    timeframe,
    days,
    finalBalance,
    totalContributed,
    interestEarned,
    growthPercentage: Math.round(growthPercentage * 100) / 100,
  };
}

/**
 * Compare two scenarios for a specific timeframe
 *
 * @param input - Investment parameters
 * @param defiApy - DeFi APY rate
 * @param bankApy - Bank APY rate
 * @param timeframe - Projection timeframe
 * @param currencyDepreciation - Annual currency depreciation rate (e.g., 0.06 for 6% BRL vs USD)
 */
export function compareScenarios(
  input: InvestmentInput,
  defiApy: number,
  bankApy: number,
  timeframe: ProjectionTimeframe,
  currencyDepreciation: number = 0
): ScenarioComparison {
  const defi = calculateProjection(input, defiApy, timeframe);
  const bank = calculateProjection(input, bankApy, timeframe);

  // Apply currency depreciation to bank results if applicable
  // This reflects the real purchasing power loss when local currency depreciates vs USD
  // diBoaS returns are in USD, so they're protected from this depreciation
  let adjustedBank = bank;
  if (currencyDepreciation > 0) {
    const days = TIMEFRAME_DAYS[timeframe];
    const years = days / 365;
    // Compound depreciation factor: (1 - rate)^years
    const depreciationFactor = Math.pow(1 - currencyDepreciation, years);

    // Adjust only the interest earned, not the principal (consistent with InteractiveDemo approach)
    const adjustedInterestEarned = bank.interestEarned * depreciationFactor;
    const adjustedFinalBalance = bank.totalContributed + adjustedInterestEarned;
    const adjustedGrowthPercentage =
      bank.totalContributed > 0
        ? ((adjustedFinalBalance - bank.totalContributed) / bank.totalContributed) * 100
        : 0;

    adjustedBank = {
      ...bank,
      finalBalance: Math.round(adjustedFinalBalance * 100) / 100,
      interestEarned: Math.round(adjustedInterestEarned * 100) / 100,
      growthPercentage: Math.round(adjustedGrowthPercentage * 100) / 100,
    };
  }

  const difference = defi.finalBalance - adjustedBank.finalBalance;
  const differencePercentage =
    adjustedBank.finalBalance > 0
      ? ((defi.finalBalance - adjustedBank.finalBalance) / adjustedBank.finalBalance) * 100
      : 0;

  return {
    timeframe,
    defi,
    bank: adjustedBank,
    difference: Math.round(difference * 100) / 100,
    differencePercentage: Math.round(differencePercentage * 100) / 100,
    opportunityCost: Math.round(difference * 100) / 100,
  };
}

/**
 * Calculate full result for all timeframes (short-term + long-term)
 */
export function calculateFullResult(
  input: InvestmentInput,
  selectedTimeframe: ProjectionTimeframe = '1year',
  defiScenario: RateScenario = DEFI_SCENARIO,
  bankScenario: RateScenario = BANK_SCENARIO
): CalculatorResult {
  // Get currency depreciation from bank scenario (e.g., 6% for BRL)
  const currencyDepreciation = bankScenario.currencyDepreciation || 0;

  // Short-term timeframes (for Dream Mode)
  const shortTermTimeframes: ShortTermTimeframe[] = ['1week', '1month', '1year', '5years'];

  const projectionsBuilder: Record<string, ScenarioComparison> = {};
  for (const tf of shortTermTimeframes) {
    projectionsBuilder[tf] = compareScenarios(input, defiScenario.apy, bankScenario.apy, tf, currencyDepreciation);
  }
  const projections = projectionsBuilder as unknown as ShortTermProjections;

  // Long-term timeframes (for Future You Calculator)
  const longTermBuilder: Record<string, ScenarioComparison> = {};
  for (const tf of LONG_TERM_TIMEFRAMES) {
    longTermBuilder[tf] = compareScenarios(input, defiScenario.apy, bankScenario.apy, tf, currencyDepreciation);
  }
  const longTermProjections = longTermBuilder as unknown as LongTermProjections;

  return {
    input,
    defiScenario,
    bankScenario,
    projections,
    longTermProjections,
    selectedTimeframe,
  };
}

/**
 * Format currency value
 */
export function formatCurrency(
  value: number,
  currency: string,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get currency locale mapping
 */
export function getCurrencyLocale(currency: string): string {
  const mapping: Record<string, string> = {
    USD: 'en-US',
    EUR: 'de-DE',
    BRL: 'pt-BR',
    GBP: 'en-GB',
  };
  return mapping[currency] || 'en-US';
}
