'use client';

/**
 * Future You Calculator Component
 *
 * Interactive compound growth calculator showing:
 * - DeFi vs Bank comparison
 * - Multiple timeframe projections
 * - Visual representation of growth
 * - Shareable results
 * - Counter animation for results
 * - ECB source citation
 *
 * Refactored: Hooks and sub-components extracted for maintainability
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import { Button } from '@diboas/ui';
import { CurrencyInput } from '@/components/UI';
import {
  calculateFullResult,
  formatCurrency,
  getCurrencyLocale,
  CALCULATOR_CONFIG,
  CALCULATOR_EVENTS,
  LONG_TERM_TIMEFRAMES,
  DEFI_SCENARIO,
  getLocaleConfig,
  type InvestmentInput,
  type LongTermTimeframe,
  type CalculatorResult,
  type RateScenario,
} from '@/lib/calculator';
import { analyticsService } from '@/lib/analytics';
import { useAnimatedCounter } from './hooks';
import { ResultCard } from './ResultCard';
import { TimeframeSelector } from './TimeframeSelector';
import { ShareIcon } from './CalculatorIcons';
import styles from './FutureYouCalculator.module.css';

interface FutureYouCalculatorProps {
  /** Callback when user wants to share results */
  onShare?: (result: CalculatorResult) => void;
  /** Callback when CTA is clicked */
  onCtaClick?: () => void;
  /** Callback when secondary CTA (Dream Mode) is clicked */
  onSecondaryCta?: () => void;
  /** Custom class name */
  className?: string;
  /** Initial values */
  initialValues?: Partial<InvestmentInput>;
}

// Use long-term timeframes for Future You Calculator (financial planning)
const TIMEFRAMES = LONG_TERM_TIMEFRAMES;

export function FutureYouCalculator({
  onShare,
  onCtaClick,
  onSecondaryCta,
  className = '',
  initialValues,
}: FutureYouCalculatorProps) {
  const intl = useTranslation();
  const { locale } = useLocale();

  // Get locale-specific configuration for currency and bank rates
  const localeConfig = useMemo(() => getLocaleConfig(locale), [locale]);

  // State for inputs
  const [initialAmount, setInitialAmount] = useState(
    initialValues?.initialAmount ?? CALCULATOR_CONFIG.defaultInitialAmount
  );
  const [monthlyContribution, setMonthlyContribution] = useState(
    initialValues?.monthlyContribution ?? CALCULATOR_CONFIG.defaultMonthlyContribution
  );
  const currency = initialValues?.currency ?? localeConfig.currency;
  const [selectedTimeframe, setSelectedTimeframe] = useState<LongTermTimeframe>('5years');

  // Create locale-specific bank scenario with appropriate rate
  const bankScenario: RateScenario = useMemo(() => ({
    id: 'bank',
    name: 'Traditional Bank',
    apy: localeConfig.bankApy,
    description: 'Average savings account rate',
    isBank: true,
  }), [localeConfig.bankApy]);

  // Translation helper
  const t = (key: string, values?: Record<string, string | number>) => {
    return intl.formatMessage({ id: `calculator.${key}` }, values);
  };

  // Calculate results with locale-specific bank rate
  const result = useMemo(() => {
    const input: InvestmentInput = {
      initialAmount,
      monthlyContribution,
      currency,
    };
    return calculateFullResult(input, selectedTimeframe, DEFI_SCENARIO, bankScenario);
  }, [initialAmount, monthlyContribution, currency, selectedTimeframe, bankScenario]);

  // Current comparison for selected timeframe
  const currentComparison = result.longTermProjections?.[selectedTimeframe] ?? result.projections['5years'];
  const currencyLocale = getCurrencyLocale(currency);

  // Handle input changes
  const handleInitialAmountChange = useCallback(
    (value: number) => {
      const clamped = Math.min(
        Math.max(value, CALCULATOR_CONFIG.minInitialAmount),
        CALCULATOR_CONFIG.maxInitialAmount
      );
      setInitialAmount(clamped);

      analyticsService.track({
        name: CALCULATOR_EVENTS.INPUT_CHANGED,
        parameters: { field: 'initialAmount', value: clamped, locale },
      });
    },
    [locale]
  );

  const handleMonthlyContributionChange = useCallback(
    (value: number) => {
      const clamped = Math.min(
        Math.max(value, CALCULATOR_CONFIG.minMonthlyContribution),
        CALCULATOR_CONFIG.maxMonthlyContribution
      );
      setMonthlyContribution(clamped);

      analyticsService.track({
        name: CALCULATOR_EVENTS.INPUT_CHANGED,
        parameters: { field: 'monthlyContribution', value: clamped, locale },
      });
    },
    [locale]
  );

  const handleTimeframeChange = useCallback(
    (timeframe: LongTermTimeframe) => {
      setSelectedTimeframe(timeframe);

      analyticsService.track({
        name: CALCULATOR_EVENTS.TIMEFRAME_CHANGED,
        parameters: { timeframe, locale },
      });
    },
    [locale]
  );

  const handleShare = useCallback(() => {
    analyticsService.track({
      name: CALCULATOR_EVENTS.SHARE_RESULT,
      parameters: {
        timeframe: selectedTimeframe,
        initialAmount,
        monthlyContribution,
        defiResult: currentComparison.defi.finalBalance,
        bankResult: currentComparison.bank.finalBalance,
        locale,
      },
    });

    onShare?.(result);
  }, [result, selectedTimeframe, initialAmount, monthlyContribution, currentComparison, locale, onShare]);

  const handleCtaClick = useCallback(() => {
    analyticsService.track({
      name: CALCULATOR_EVENTS.CTA_CLICKED,
      parameters: { timeframe: selectedTimeframe, locale },
    });

    onCtaClick?.();
  }, [selectedTimeframe, locale, onCtaClick]);

  // Animated counters for result values
  const animatedDefiBalance = useAnimatedCounter(currentComparison.defi.finalBalance);
  const animatedBankBalance = useAnimatedCounter(currentComparison.bank.finalBalance);
  const animatedDifference = useAnimatedCounter(currentComparison.difference);

  // Calculate visual percentages for bars
  const maxValue = Math.max(currentComparison.defi.finalBalance, currentComparison.bank.finalBalance);
  const defiBarWidth = (currentComparison.defi.finalBalance / maxValue) * 100;
  const bankBarWidth = (currentComparison.bank.finalBalance / maxValue) * 100;

  // Get timeframe in years for headline
  const timeframeYears = selectedTimeframe.replace('years', '');

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.headline}>{t('headline')}</h2>
        <p className={styles.subhead}>{t('subhead')}</p>
      </div>

      {/* Input Section */}
      <div className={styles.inputSection}>
        <CurrencyInput
          value={initialAmount}
          onChange={handleInitialAmountChange}
          label={t('initialAmount')}
          currency={currency}
          min={CALCULATOR_CONFIG.minInitialAmount}
          max={CALCULATOR_CONFIG.maxInitialAmount}
          sliderMax={100000}
          step={100}
        />

        <CurrencyInput
          value={monthlyContribution}
          onChange={handleMonthlyContributionChange}
          label={t('monthlyContribution')}
          currency={currency}
          min={CALCULATOR_CONFIG.minMonthlyContribution}
          max={CALCULATOR_CONFIG.maxMonthlyContribution}
          sliderMax={5000}
          sliderStep={50}
        />
      </div>

      {/* Timeframe Selector */}
      <TimeframeSelector
        timeframes={TIMEFRAMES}
        selectedTimeframe={selectedTimeframe}
        onTimeframeChange={handleTimeframeChange}
        getLabel={(tf) => t(`timeframe.${tf}`)}
      />

      {/* Results Section */}
      <div className={styles.resultsSection}>
        {/* Dynamic Result Headline */}
        <h3 className={styles.resultHeadline}>
          {t('resultHeadline', {
            years: timeframeYears,
            amount: formatCurrency(monthlyContribution, currency, currencyLocale),
          })}
        </h3>

        {/* DeFi Result */}
        <ResultCard
          label={t('defiYield')}
          apy={result.defiScenario.apy}
          apyLabel="APY"
          finalBalance={animatedDefiBalance}
          interestEarned={currentComparison.defi.interestEarned}
          growthPercentage={currentComparison.defi.growthPercentage}
          barWidth={defiBarWidth}
          currency={currency}
          currencyLocale={currencyLocale}
          variant="defi"
        />

        {/* Bank Result */}
        <ResultCard
          label={t('bankRate')}
          apy={result.bankScenario.apy}
          apyLabel="APY"
          finalBalance={animatedBankBalance}
          interestEarned={currentComparison.bank.interestEarned}
          growthPercentage={currentComparison.bank.growthPercentage}
          barWidth={bankBarWidth}
          currency={currency}
          currencyLocale={currencyLocale}
          variant="bank"
        />

        {/* ECB Source Citation */}
        <p className={styles.ecbCitation}>{t('ecbSource')}</p>

        {/* Difference Highlight */}
        <div className={styles.differenceCard}>
          <div className={styles.differenceLabel}>
            {t('difference', {
              difference: formatCurrency(animatedDifference, currency, currencyLocale),
            })}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className={styles.disclaimer}>{t('disclaimer')}</p>

      {/* Actions */}
      <div className={styles.actions}>
        {onShare && (
          <Button
            variant="outline"
            size="default"
            onClick={handleShare}
            className={styles.shareButton}
          >
            <ShareIcon />
            {t('share')}
          </Button>
        )}
        {onCtaClick && (
          <Button variant="primary" size="lg" onClick={handleCtaClick} trackable>
            {t('cta')}
          </Button>
        )}
        {onSecondaryCta && (
          <Button variant="ghost" size="default" onClick={onSecondaryCta}>
            {t('ctaSecondary')}
          </Button>
        )}
      </div>
    </div>
  );
}
