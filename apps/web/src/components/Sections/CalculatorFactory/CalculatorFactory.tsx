'use client';

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { useLocale } from '@/components/Providers';
import { useConfigTranslation } from '@/lib/i18n/config-translator';
import type { CalculatorFactoryConfig } from '@/config/calculatorFactory';
import styles from './CalculatorFactory.module.css';

const CURRENCY_CONFIG: Record<string, { currency: string; locale: string; symbol: string }> = {
  en: { currency: 'USD', locale: 'en-US', symbol: '$' },
  de: { currency: 'EUR', locale: 'de-DE', symbol: '€' },
  es: { currency: 'EUR', locale: 'es-ES', symbol: '€' },
  'pt-BR': { currency: 'BRL', locale: 'pt-BR', symbol: 'R$' },
};

/** diBoaS receive fee — Receive Payments is FREE per Fee Lab v3.4 */
const DIBOAS_RECEIVE_FEE = 0;

const SCENARIO_RATES = { conservative: 4, historical: 7, optimistic: 10 } as const;
const PERIOD_MULTIPLIERS = { month: 1 / 12, sixMonths: 0.5, year: 1 } as const;

type PeriodKey = keyof typeof PERIOD_MULTIPLIERS;
type ScenarioKey = keyof typeof SCENARIO_RATES;

interface CalculatorFactoryProps {
  config: CalculatorFactoryConfig;
  enableAnalytics?: boolean;
  className?: string;
}

/**
 * Parse a locale-aware numeric string (handles both comma and period decimals).
 * Accepts "2,5" (DE/PT-BR) and "2.5" (EN/ES) → returns 2.5
 */
function parseLocaleNumber(value: string): number {
  const cleaned = value.replace(/[^0-9.,]/g, '');
  const hasComma = cleaned.includes(',');
  const hasPeriod = cleaned.includes('.');
  if (hasComma && hasPeriod) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
    }
    return parseFloat(cleaned.replace(/,/g, '')) || 0;
  }
  if (hasComma) {
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      return parseFloat(cleaned.replace(',', '.')) || 0;
    }
    return parseFloat(cleaned.replace(/,/g, '')) || 0;
  }
  return parseFloat(cleaned) || 0;
}

/**
 * Format a decimal number for display in a locale-aware way.
 */
function formatDecimal(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export const CalculatorFactory = memo(function CalculatorFactory({
  config,
  className = '',
}: CalculatorFactoryProps) {
  const { locale } = useLocale();
  const translated = useConfigTranslation(config);
  const currencyInfo = CURRENCY_CONFIG[locale] || CURRENCY_CONFIG['en'];
  const localeDefaults = config.defaults[locale] || config.defaults['en'];

  // State
  const [field1, setField1] = useState(localeDefaults.field1);
  const [field2, setField2] = useState(localeDefaults.field2);
  const [period, setPeriod] = useState<PeriodKey>('year');
  const [rate, setRate] = useState<number>(SCENARIO_RATES.historical);
  const [isExpanded, setIsExpanded] = useState(false);

  // Analytics debounce ref — cleanup on unmount
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const formatCurrency = useCallback((value: number): string => {
    return new Intl.NumberFormat(currencyInfo.locale, {
      style: 'currency',
      currency: currencyInfo.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, [currencyInfo]);

  const trackChange = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // Analytics hook placeholder
    }, 500);
  }, []);

  const handleField1Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
    setField1(value);
    trackChange();
  }, [trackChange]);

  const handleField2Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseLocaleNumber(e.target.value);
    setField2(Math.min(value, 100));
    trackChange();
  }, [trackChange]);

  const handleRateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRate(Number(e.target.value));
    trackChange();
  }, [trackChange]);

  const scrollTo = (href: string) => {
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Calculations — derived during render
  const periodMultiplier = PERIOD_MULTIPLIERS[period];
  const isCashflow = config.variant === 'cashflow';

  // Step 1 values
  const step1Value = isCashflow
    ? Math.round(field1 * (field2 / 100) * 30 * periodMultiplier * 12)
    : Math.round(field1 * (field2 / 100) * periodMultiplier);

  // Step 2 scenario results
  const computeStep2 = (scenarioRate: number): number => {
    if (isCashflow) {
      const savings = field1 * ((field2 - DIBOAS_RECEIVE_FEE) / 100) * 30 * periodMultiplier * 12;
      const growth = savings * (scenarioRate / 100) * periodMultiplier;
      return Math.round(savings + growth);
    }
    return Math.round(field1 * (scenarioRate / 100) * periodMultiplier);
  };

  // Gap for treasury (step2 - step1)
  const computeGap = (scenarioRate: number): number => {
    return computeStep2(scenarioRate) - step1Value;
  };

  const customResult = isCashflow
    ? computeStep2(rate)
    : computeStep2(rate);

  const SCENARIO_KEYS: ScenarioKey[] = ['conservative', 'historical', 'optimistic'];

  return (
    <section
      className={`${styles.section} ${className}`}
      aria-label={translated.seo.ariaLabel}
    >
      <div className={styles.container}>
        <h2 className={styles.title}>{translated.content.header}</h2>

        {translated.content.transitionHook ? (
          <p className={styles.transitionHook}>{translated.content.transitionHook}</p>
        ) : null}

        <div className={styles.card}>
          {/* Today Title */}
          {translated.content.todayTitle ? (
            <h3 className={styles.todayTitle}>{translated.content.todayTitle}</h3>
          ) : null}

          {/* Input Fields */}
          <div className={styles.inputGroup}>
            <div className={styles.inputField}>
              <label htmlFor={`calc-field1-${config.variant}`} className={styles.inputLabel}>
                {translated.content.fields.field1}
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.currencySymbol} aria-hidden="true">
                  {currencyInfo.symbol}
                </span>
                <input
                  id={`calc-field1-${config.variant}`}
                  type="text"
                  inputMode="numeric"
                  className={styles.input}
                  value={field1.toLocaleString(currencyInfo.locale)}
                  onChange={handleField1Change}
                  aria-label={translated.content.fields.field1}
                />
              </div>
            </div>

            <div className={styles.inputField}>
              <label htmlFor={`calc-field2-${config.variant}`} className={styles.inputLabel}>
                {translated.content.fields.field2}
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id={`calc-field2-${config.variant}`}
                  type="text"
                  inputMode="decimal"
                  className={styles.input}
                  value={formatDecimal(field2, currencyInfo.locale)}
                  onChange={handleField2Change}
                  aria-label={translated.content.fields.field2}
                />
                <span className={styles.percentSymbol} aria-hidden="true">%</span>
              </div>
            </div>
          </div>

          {/* Period Toggle */}
          <div className={styles.periodToggle} role="group" aria-label="Time period">
            {(['month', 'sixMonths', 'year'] as const).map((key) => (
              <button
                key={key}
                type="button"
                className={`${styles.periodButton} ${period === key ? styles.periodButtonActive : ''}`}
                onClick={() => setPeriod(key)}
                aria-pressed={period === key}
              >
                {translated.content.periodToggle[key]}
              </button>
            ))}
          </div>

          {/* Step 1: Loss / Current bank rate (always visible) */}
          <div className={styles.twoStepResults} role="region" aria-live="polite" aria-label="Calculator results">
            <div className={styles.step}>
              <div className={styles.stepLabel}>
                <span className={styles.stepNumber}>1</span>
                <span>{translated.content.results.step1Label}</span>
              </div>
              <div className={`${styles.stepBigNumber} ${isCashflow ? styles.stepBigNumberLoss : ''}`}>
                {isCashflow ? `\u2212${formatCurrency(step1Value)}` : formatCurrency(step1Value)}
              </div>
            </div>
          </div>

          {/* Expand Toggle — Tomorrow Title */}
          {translated.content.tomorrowTitle ? (
            <button
              type="button"
              className={styles.expandToggle}
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
            >
              <h3 className={styles.expandToggleTitle}>
                {translated.content.tomorrowTitle}
              </h3>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className={`${styles.expandArrow} ${isExpanded ? styles.expandArrowOpen : ''}`}
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ) : null}

          {/* Expandable Content */}
          <div className={`${styles.expandContent} ${isExpanded ? styles.expandContentOpen : ''}`}>
            {/* Savings step (positive value) */}
            {translated.content.results.savingsLabel ? (
              <div className={styles.step}>
                <div className={styles.stepLabel}>
                  <span>{translated.content.results.savingsLabel}</span>
                </div>
                <div className={styles.stepBigNumber}>
                  {formatCurrency(step1Value)}
                </div>
              </div>
            ) : null}

            {/* Arrow connector */}
            <div className={styles.stepArrow} aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Step 2 */}
            <div className={styles.step}>
              <div className={styles.stepLabel}>
                <span className={styles.stepNumber}>2</span>
                <span>{translated.content.results.step2Label}</span>
              </div>

              {/* Rate Slider */}
              <div className={styles.sliderGroup}>
                <div className={styles.sliderLabel}>
                  <span>{translated.content.sliderLabel}</span>
                  <span className={styles.sliderValue}>{rate}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="0.5"
                  value={rate}
                  onChange={handleRateChange}
                  className={styles.slider}
                  aria-label={translated.content.sliderLabel}
                />
              </div>

              {/* Scenario Cards */}
              <div className={styles.scenarioCards}>
                {SCENARIO_KEYS.map((key) => {
                  const scenarioRate = SCENARIO_RATES[key];
                  const result = computeStep2(scenarioRate);
                  const gap = computeGap(scenarioRate);
                  const isHighlighted = key === 'historical';

                  return (
                    <div
                      key={key}
                      className={`${styles.scenarioCard} ${isHighlighted ? styles.scenarioCardHighlight : ''}`}
                    >
                      <span className={styles.scenarioCardLabel}>
                        {translated.content.results.scenarios[key]}
                      </span>
                      <span className={styles.scenarioCardValue}>
                        {formatCurrency(result)}
                      </span>
                      {!isCashflow ? (
                        <span className={styles.scenarioCardGap}>
                          +{formatCurrency(gap)}
                        </span>
                      ) : null}
                      {isHighlighted ? (
                        <span className={styles.scenarioCardBadge} aria-label="likely scenario">
                          {translated.content.results.likelyBadge || '← likely'}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Below Results — custom rate display */}
            <p className={styles.belowResultsValue}>
              {(translated.content.customRateTemplate || `At ${rate}%: ${formatCurrency(customResult)}`)
                .replace('{rate}', String(rate))
                .replace('{amount}', formatCurrency(customResult))}
            </p>

            {/* CTA */}
            <div className={styles.ctaWrapper}>
              <button
                type="button"
                className={styles.cta}
                onClick={() => scrollTo(config.content.ctaHref)}
              >
                {translated.content.cta}
              </button>
            </div>
          </div>

          {/* Disclaimer (always visible, outside expandable) */}
          <p className={styles.disclaimer}>{translated.content.disclaimer}</p>
        </div>
      </div>
    </section>
  );
});

export default CalculatorFactory;
