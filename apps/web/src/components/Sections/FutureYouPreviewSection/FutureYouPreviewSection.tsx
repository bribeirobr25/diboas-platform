/**
 * Future You Preview Section
 *
 * A simplified preview of the Future You Calculator for the B2C landing page.
 * Shows a static comparison of diBoaS vs Bank for $20/month over 5 years.
 * Links to the full calculator page for interactive exploration.
 *
 * Domain-Driven Design: Preview component for calculator feature
 * Code Reusability: Uses existing calculator lib and translations
 */

'use client';

import { useMemo } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import { CTAButtonLink } from '@/components/UI';
import { SectionContainer } from '../SectionContainer/SectionContainer';
import {
  calculateFullResult,
  formatCurrency,
  getCurrencyLocale,
  CALCULATOR_CONFIG,
  DEFI_SCENARIO,
  getLocaleConfig,
  type RateScenario,
} from '@/lib/calculator';
import styles from './FutureYouPreviewSection.module.css';

interface FutureYouPreviewSectionProps {
  /** Enable analytics tracking */
  enableAnalytics?: boolean;
  /** Additional CSS class */
  className?: string;
}

export function FutureYouPreviewSection({
  enableAnalytics = true,
  className = '',
}: FutureYouPreviewSectionProps) {
  const intl = useTranslation();
  const { locale } = useLocale();

  // Get locale-specific configuration
  const localeConfig = useMemo(() => getLocaleConfig(locale), [locale]);

  // Create locale-specific bank scenario
  const bankScenario: RateScenario = useMemo(() => ({
    id: 'bank',
    name: 'Traditional Bank',
    apy: localeConfig.bankApy,
    description: 'Average savings account rate',
    isBank: true,
  }), [localeConfig.bankApy]);

  // Calculate results for default values: $20/month, 5 years
  const result = useMemo(() => {
    const input = {
      initialAmount: CALCULATOR_CONFIG.defaultInitialAmount,
      monthlyContribution: CALCULATOR_CONFIG.defaultMonthlyContribution,
      currency: localeConfig.currency,
    };
    return calculateFullResult(input, '5years', DEFI_SCENARIO, bankScenario);
  }, [localeConfig.currency, bankScenario]);

  // Get the 5-year comparison
  const comparison = result.longTermProjections?.['5years'] ?? result.projections['5years'];
  const currencyLocale = getCurrencyLocale(localeConfig.currency);
  const monthlyAmount = formatCurrency(
    CALCULATOR_CONFIG.defaultMonthlyContribution,
    localeConfig.currency,
    currencyLocale
  );

  // Translation helper
  const t = (key: string, values?: Record<string, string | number>) => {
    return intl.formatMessage({ id: `calculator.${key}` }, values);
  };

  return (
    <SectionContainer
      id="future-you"
      variant="standard"
      padding="standard"
      className={className}
      ariaLabel={t('headline')}
      data-testid="future-you-preview-section"
    >
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.headline}>{t('headline')}</h2>
        </div>

        {/* Result Preview */}
        <div className={styles.resultPreview}>
          <p className={styles.resultHeadline}>
            {t('resultHeadline', { years: '5', amount: monthlyAmount })}
          </p>

          {/* Comparison Cards */}
          <div className={styles.comparisonGrid}>
            {/* diBoaS Result */}
            <div className={styles.resultCard}>
              <span className={styles.resultLabel}>{t('defiYield')}</span>
              <span className={styles.resultValue}>
                {formatCurrency(comparison.defi.finalBalance, localeConfig.currency, currencyLocale)}
              </span>
            </div>

            {/* Bank Result */}
            <div className={`${styles.resultCard} ${styles.bankCard}`}>
              <span className={styles.resultLabel}>{t('bankRate')}</span>
              <span className={styles.resultValue}>
                {formatCurrency(comparison.bank.finalBalance, localeConfig.currency, currencyLocale)}
              </span>
            </div>
          </div>

          {/* Difference Highlight */}
          <div className={styles.differenceCard}>
            <span className={styles.differenceLabel}>
              {t('difference', {
                difference: formatCurrency(comparison.difference, localeConfig.currency, currencyLocale),
              })}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className={styles.ctaWrapper}>
          <CTAButtonLink
            href="/future-you"
            variant="primary"
            size="lg"
            trackable={enableAnalytics}
            className={styles.ctaButton}
          >
            {t('previewCta')}
          </CTAButtonLink>
        </div>
      </div>
    </SectionContainer>
  );
}

export default FutureYouPreviewSection;
