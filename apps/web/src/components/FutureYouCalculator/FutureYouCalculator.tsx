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
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import {
  calculateFullResult,
  formatCurrency,
  formatPercentage,
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
import styles from './FutureYouCalculator.module.css';

/**
 * Custom hook for animating a number from 0 to target value
 */
function useAnimatedCounter(targetValue: number, duration: number = 1000) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousTarget = useRef(targetValue);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Only animate if target changed significantly
    if (Math.abs(targetValue - previousTarget.current) < 1) {
      setDisplayValue(targetValue);
      return;
    }

    const startValue = displayValue;
    const startTime = performance.now();
    const difference = targetValue - startValue;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + difference * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousTarget.current = targetValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration]);

  return Math.round(displayValue);
}

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
  // Use locale-based currency instead of hardcoded EUR
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

  // Current comparison for selected timeframe (use long-term projections for Future You Calculator)
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
        parameters: {
          field: 'initialAmount',
          value: clamped,
          locale,
        },
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
        parameters: {
          field: 'monthlyContribution',
          value: clamped,
          locale,
        },
      });
    },
    [locale]
  );

  const handleTimeframeChange = useCallback(
    (timeframe: LongTermTimeframe) => {
      setSelectedTimeframe(timeframe);

      analyticsService.track({
        name: CALCULATOR_EVENTS.TIMEFRAME_CHANGED,
        parameters: {
          timeframe,
          locale,
        },
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
      parameters: {
        timeframe: selectedTimeframe,
        locale,
      },
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
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>{t('initialAmount')}</label>
          <div className={styles.inputWrapper}>
            <span className={styles.currencySymbol}>
              {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$'}
            </span>
            <input
              type="number"
              value={initialAmount}
              onChange={(e) => handleInitialAmountChange(Number(e.target.value))}
              className={styles.input}
              min={CALCULATOR_CONFIG.minInitialAmount}
              max={CALCULATOR_CONFIG.maxInitialAmount}
            />
          </div>
          <input
            type="range"
            value={initialAmount}
            onChange={(e) => handleInitialAmountChange(Number(e.target.value))}
            className={styles.slider}
            min={CALCULATOR_CONFIG.minInitialAmount}
            max={100000}
            step={100}
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>{t('monthlyContribution')}</label>
          <div className={styles.inputWrapper}>
            <span className={styles.currencySymbol}>
              {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$'}
            </span>
            <input
              type="number"
              value={monthlyContribution}
              onChange={(e) => handleMonthlyContributionChange(Number(e.target.value))}
              className={styles.input}
              min={CALCULATOR_CONFIG.minMonthlyContribution}
              max={CALCULATOR_CONFIG.maxMonthlyContribution}
            />
          </div>
          <input
            type="range"
            value={monthlyContribution}
            onChange={(e) => handleMonthlyContributionChange(Number(e.target.value))}
            className={styles.slider}
            min={0}
            max={5000}
            step={50}
          />
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className={styles.timeframeSelector}>
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => handleTimeframeChange(tf)}
            className={`${styles.timeframeButton} ${selectedTimeframe === tf ? styles.active : ''}`}
          >
            {t(`timeframe.${tf}`)}
          </button>
        ))}
      </div>

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
        <div className={styles.resultCard}>
          <div className={styles.resultHeader}>
            <span className={styles.resultLabel}>{t('defiYield')}</span>
            <span className={styles.resultApy}>
              {formatPercentage(result.defiScenario.apy)} APY
            </span>
          </div>
          <div className={styles.resultBar}>
            <div
              className={`${styles.bar} ${styles.defiBar}`}
              style={{ width: `${defiBarWidth}%` }}
            />
          </div>
          <div className={styles.resultValue}>
            {formatCurrency(animatedDefiBalance, currency, currencyLocale)}
          </div>
          <div className={styles.resultGrowth}>
            +{formatCurrency(currentComparison.defi.interestEarned, currency, currencyLocale)}
            <span className={styles.growthPercent}>
              ({formatPercentage(currentComparison.defi.growthPercentage)})
            </span>
          </div>
        </div>

        {/* Bank Result */}
        <div className={`${styles.resultCard} ${styles.bankCard}`}>
          <div className={styles.resultHeader}>
            <span className={styles.resultLabel}>{t('bankRate')}</span>
            <span className={styles.resultApy}>
              {formatPercentage(result.bankScenario.apy)} APY
            </span>
          </div>
          <div className={styles.resultBar}>
            <div
              className={`${styles.bar} ${styles.bankBar}`}
              style={{ width: `${bankBarWidth}%` }}
            />
          </div>
          <div className={styles.resultValue}>
            {formatCurrency(animatedBankBalance, currency, currencyLocale)}
          </div>
          <div className={styles.resultGrowth}>
            +{formatCurrency(currentComparison.bank.interestEarned, currency, currencyLocale)}
            <span className={styles.growthPercent}>
              ({formatPercentage(currentComparison.bank.growthPercentage)})
            </span>
          </div>
        </div>

        {/* ECB Source Citation */}
        <p className={styles.ecbCitation}>
          {t('ecbSource')}
        </p>

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
          <button onClick={handleShare} className={styles.shareButton}>
            <ShareIcon />
            {t('share')}
          </button>
        )}
        {onCtaClick && (
          <button onClick={handleCtaClick} className={styles.ctaButton}>
            {t('cta')}
          </button>
        )}
        {onSecondaryCta && (
          <button onClick={onSecondaryCta} className={styles.secondaryCtaButton}>
            {t('ctaSecondary')}
          </button>
        )}
      </div>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
