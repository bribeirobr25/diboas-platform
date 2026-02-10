'use client';

/**
 * TreasuryCalculator Section Component
 *
 * Domain-Driven Design: Interactive treasury yield calculator for B2B
 * Service Agnostic Abstraction: Pure presentation component
 * Accessibility: Full keyboard and screen reader support
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import { Button } from '@diboas/ui';
import { DEFAULT_CTA_PROPS } from '@/config/cta';
import { usePerformanceMonitoring } from '@/lib/monitoring/performance-monitor';
import { useConfigTranslation } from '@/lib/i18n/config-translator';
import { getLocaleConfig } from '@/lib/calculator';
import type { TreasuryCalculatorProps } from './types';
import styles from './TreasuryCalculator.module.css';

/**
 * Currency configuration by locale
 */
const CURRENCY_CONFIG: Record<string, { currency: string; locale: string; symbol: string }> = {
  en: { currency: 'USD', locale: 'en-US', symbol: '$' },
  de: { currency: 'EUR', locale: 'de-DE', symbol: '€' },
  es: { currency: 'EUR', locale: 'es-ES', symbol: '€' },
  'pt-BR': { currency: 'BRL', locale: 'pt-BR', symbol: 'R$' },
};

/**
 * TreasuryCalculator Component
 *
 * Interactive calculator that shows potential treasury yield based on user inputs.
 */
export function TreasuryCalculator({
  config,
  className = '',
  enableAnalytics = true
}: TreasuryCalculatorProps) {
  const intl = useTranslation();
  const { locale } = useLocale();
  const { recordSectionRenderTime } = usePerformanceMonitoring();

  // Translate config values (header, cta text)
  const translatedConfig = useConfigTranslation(config);

  // Get locale-specific currency and depreciation config
  const currencyConfig = CURRENCY_CONFIG[locale] || CURRENCY_CONFIG['de'];
  const localeConfig = useMemo(() => getLocaleConfig(locale), [locale]);

  // Format number as currency (locale-aware)
  const formatCurrency = useCallback((value: number): string => {
    return new Intl.NumberFormat(currencyConfig.locale, {
      style: 'currency',
      currency: currencyConfig.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }, [currencyConfig]);

  // State for calculator inputs
  const [cashOnHand, setCashOnHand] = useState(config.defaults.cashOnHand);
  const [currentRate, setCurrentRate] = useState(config.defaults.currentRate);

  // Performance monitoring
  useEffect(() => {
    if (!enableAnalytics) return;

    const renderStart = performance.now();

    const recordRenderTime = () => {
      const renderEnd = performance.now();
      recordSectionRenderTime('treasury-calculator', renderEnd - renderStart);
    };

    const timeoutId = setTimeout(recordRenderTime, 0);
    return () => clearTimeout(timeoutId);
  }, [recordSectionRenderTime, enableAnalytics]);

  // Calculate yields (1 year projection)
  const diboasRate = config.defaults.diboasRate;
  const projectedYield = Math.round(cashOnHand * (diboasRate / 100));

  // Calculate current interest with currency depreciation adjustment
  // For Brazil (BRL), the nominal interest is reduced by 6% annual depreciation against USD
  // diBoaS returns are in USD, so they're protected from this depreciation
  const nominalCurrentInterest = cashOnHand * (currentRate / 100);
  const depreciationFactor = 1 - localeConfig.currencyDepreciation; // e.g., 0.94 for Brazil
  const currentInterest = Math.round(nominalCurrentInterest * depreciationFactor);
  const additionalRunway = projectedYield - currentInterest;

  // Handle cash input change
  const handleCashChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
    setCashOnHand(value);
  }, []);

  // Handle rate input change
  const handleRateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
    setCurrentRate(Math.min(value, 100));
  }, []);

  // Handle CTA click
  const handleCtaClick = useCallback(() => {
    window.location.href = translatedConfig.content.ctaHref;
  }, [translatedConfig.content.ctaHref]);

  return (
    <section
      id="calculator"
      className={`${styles.section} ${className}`}
      aria-labelledby="calculator-title"
      data-section-id={translatedConfig.analytics?.sectionId}
      data-analytics-category={translatedConfig.analytics?.category}
    >
      <div className={styles.container}>
        {/* Header - pre-translated */}
        <header className={styles.header}>
          <h2 id="calculator-title" className={styles.title}>
            {translatedConfig.content.header}
          </h2>
        </header>

        {/* Calculator Card */}
        <div className={styles.calculatorCard}>
          {/* Input Fields */}
          <div className={styles.inputGroup}>
            {/* Cash on Hand */}
            <div className={styles.inputField}>
              <label htmlFor="cash-input" className={styles.inputLabel}>
                {intl.formatMessage({ id: 'landing-b2b.calculator.fields.cashOnHand' })}
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.currencySymbol} aria-hidden="true">{currencyConfig.symbol}</span>
                <input
                  id="cash-input"
                  type="text"
                  inputMode="numeric"
                  className={styles.input}
                  value={cashOnHand.toLocaleString(currencyConfig.locale)}
                  onChange={handleCashChange}
                  aria-label={intl.formatMessage({ id: 'landing-b2b.calculator.fields.cashOnHand' })}
                  placeholder="500,000"
                />
              </div>
            </div>

            {/* Current Rate */}
            <div className={styles.inputField}>
              <label htmlFor="rate-input" className={styles.inputLabel}>
                {intl.formatMessage({ id: 'landing-b2b.calculator.fields.currentRate' })}
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="rate-input"
                  type="text"
                  inputMode="decimal"
                  className={styles.input}
                  value={currentRate}
                  onChange={handleRateChange}
                  aria-label={intl.formatMessage({ id: 'landing-b2b.calculator.fields.currentRate' })}
                  placeholder="0.5"
                />
                <span className={styles.percentSymbol} aria-hidden="true">%</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className={styles.results} role="region" aria-live="polite" aria-label="Calculator results">
            {/* Projected Yield at 7% */}
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>
                {intl.formatMessage({ id: 'landing-b2b.calculator.fields.projectedYield' })}
              </span>
              <span className={`${styles.resultValue} ${styles.resultHighlight}`}>
                {formatCurrency(projectedYield)}
              </span>
            </div>

            {/* Current Interest */}
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>
                {intl.formatMessage({ id: 'landing-b2b.calculator.fields.currentInterest' })}
              </span>
              <span className={styles.resultValue}>
                {formatCurrency(currentInterest)}
              </span>
            </div>

            {/* Additional Runway - Highlighted */}
            <div className={`${styles.resultRow} ${styles.resultRowHighlight}`}>
              <span className={styles.resultLabel}>
                {intl.formatMessage({ id: 'landing-b2b.calculator.fields.additionalRunway' })}
              </span>
              <span className={styles.resultValue}>
                {formatCurrency(additionalRunway)}{intl.formatMessage({ id: 'landing-b2b.calculator.perYear' })}
              </span>
            </div>
          </div>

          {/* CTA Button - pre-translated */}
          <div className={styles.ctaWrapper}>
            <Button
              variant={DEFAULT_CTA_PROPS.variant}
              size={DEFAULT_CTA_PROPS.size}
              trackable={DEFAULT_CTA_PROPS.trackable}
              className={styles.ctaButton}
              onClick={handleCtaClick}
              aria-label={translatedConfig.content.cta}
            >
              {translatedConfig.content.cta}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TreasuryCalculator;
