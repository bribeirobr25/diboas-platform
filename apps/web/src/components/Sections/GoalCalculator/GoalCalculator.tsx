'use client';

import { memo, useCallback } from 'react';
import { useLocale } from '@/components/Providers';
import { useConfigTranslation } from '@/lib/i18n/config-translator';
import { CURRENCY_CONFIG } from '@/lib/currency';
import type { GoalCalculatorConfig } from './goalCalculatorTypes';
import { GoalCalculatorProvider } from './GoalCalculatorProvider';
import { GoalCalculatorWizard } from './GoalCalculatorWizard';
import styles from './GoalCalculator.module.css';

interface GoalCalculatorProps {
  readonly config: GoalCalculatorConfig;
  readonly enableAnalytics?: boolean;
}

export const GoalCalculator = memo(function GoalCalculator({
  config,
  enableAnalytics = false,
}: GoalCalculatorProps) {
  const { locale } = useLocale();
  const translated = useConfigTranslation(config);
  const currencyInfo = CURRENCY_CONFIG[locale] || CURRENCY_CONFIG['en'];

  const formatCurrency = useCallback(
    (value: number): string => {
      return new Intl.NumberFormat(currencyInfo.locale, {
        style: 'currency',
        currency: currencyInfo.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    },
    [currencyInfo],
  );

  return (
    <section className={styles.section} aria-label={translated.seo.ariaLabel}>
      <GoalCalculatorProvider enableAnalytics={enableAnalytics} locale={locale}>
        <GoalCalculatorWizard
          translated={translated}
          formatCurrency={formatCurrency}
          locale={locale}
          enableAnalytics={enableAnalytics}
        />
      </GoalCalculatorProvider>
    </section>
  );
});
