/**
 * useGoalCardData — Computes goal card values from market data at render time.
 *
 * Replaces hardcoded values in translation JSON with runtime computation.
 * Uses canonical formulas from lib/market-data/formulas.ts.
 */

'use client';

import { useMemo } from 'react';
import { useMarketData } from '@/hooks/useMarketData';
import {
  calculateMonthlyContributions,
  calculateMonthlyWithCurrencyHedge,
  monthsToInflationAdjustedTarget,
  resolveHorizonMatchedDepreciation,
  selectInflationRate,
  formatCurrency,
  formatCompactCurrency,
  formatTimeDifference,
  type SupportedLocale,
} from '@/lib/market-data';
import { LOCALE_CURRENCY } from '@/lib/market-data/constants';
import { GOAL_CARD_INPUTS, type GoalCardKey } from '@/config/goalCards';

export interface GoalCardComputedValues {
  titleSummary: string;
  diboasResult: string;
  diboasTime: string;
  bankResult: string;
  bankTime: string;
  difference: string;
  isTimeBased: boolean;
}

export function useGoalCardData(cardKey: GoalCardKey, locale: SupportedLocale): GoalCardComputedValues {
  const { data: marketData } = useMarketData();

  return useMemo(() => {
    const inputs = GOAL_CARD_INPUTS[cardKey];
    const bankRates = marketData.rates.bankRates[locale];
    const bankApy = bankRates.savings / 100;
    const diboasApy = marketData.rates.strategyApys.safety / 100;
    const currency = LOCALE_CURRENCY[locale];
    const pmt = inputs.monthlyContribution[locale];
    const months = inputs.months;
    // A4 fix (2026-05-23): horizon-matched depreciation matches the goal
    // window (Phase D policy helper). Replaces the prior static
    // `annualDepreciation` constant — same source-of-truth as Emergency Fund /
    // Idle Cash / Time-to-Target / hedged Compound. ComparisonTable stays on
    // the static constant (its 1y fixed projection benefits from full-series
    // stability over a noisy 12-month trailing window).
    const depreciation = resolveHorizonMatchedDepreciation(marketData, currency, months / 12);

    // Emergency fund: time-based comparison
    if (cardKey === 'emergency' && inputs.spendReference && inputs.targetMultiplier) {
      const spend = inputs.spendReference[locale];
      const target = spend * inputs.targetMultiplier;
      const inflation = selectInflationRate(locale, 60, marketData.inflationRates); // >24mo → 5yr avg

      // diBoaS effective rate for non-US
      const diboasEffective = depreciation > 0
        ? (1 + diboasApy) * (1 + depreciation) - 1
        : diboasApy;

      const diboasMonths = monthsToInflationAdjustedTarget(target, pmt, diboasEffective, inflation);
      const bankMonths = monthsToInflationAdjustedTarget(target, pmt, bankApy, inflation);
      const diff = bankMonths - diboasMonths;

      // monthsLabel removed 2026-05-08 (lint cleanup) — was assigned but never
      // referenced; the card now expresses "X years to target" via yearsLabel.
      const inLabel: Record<SupportedLocale, string> = {
        en: 'in',
        'pt-BR': 'em',
        es: 'en',
        de: 'in',
      };

      const yearsLabel: Record<SupportedLocale, string> = {
        en: 'years',
        'pt-BR': 'anos',
        es: 'años',
        de: 'Jahren',
      };

      const diboasYears = Math.round(diboasMonths / 12 * 10) / 10;
      const bankYears = Math.round(bankMonths / 12 * 10) / 10;

      return {
        titleSummary: formatTimeDifference(diff, locale),
        diboasResult: formatCurrency(target, locale),
        diboasTime: `${inLabel[locale]} ~${diboasYears} ${yearsLabel[locale]}`,
        bankResult: formatCurrency(target, locale),
        bankTime: `${inLabel[locale]} ~${bankYears} ${yearsLabel[locale]}`,
        difference: formatTimeDifference(diff, locale),
        isTimeBased: true,
      };
    }

    // Standard cards: amount-based comparison
    const inflation = selectInflationRate(locale, months, marketData.inflationRates);

    let diboasNominal: number;
    if (depreciation > 0) {
      diboasNominal = calculateMonthlyWithCurrencyHedge(
        pmt, diboasApy, depreciation, inflation, months
      ).nominalFV;
    } else {
      diboasNominal = calculateMonthlyContributions(
        pmt, diboasApy, inflation, months
      ).nominalFV;
    }

    const bankNominal = calculateMonthlyContributions(
      pmt, bankApy, inflation, months
    ).nominalFV;

    const diff = diboasNominal - bankNominal;

    return {
      titleSummary: formatCompactCurrency(diff, locale),
      diboasResult: formatCurrency(diboasNominal, locale),
      diboasTime: '',
      bankResult: formatCurrency(bankNominal, locale),
      bankTime: '',
      difference: formatCurrency(diff, locale),
      isTimeBased: false,
    };
  }, [cardKey, locale, marketData]);
}
