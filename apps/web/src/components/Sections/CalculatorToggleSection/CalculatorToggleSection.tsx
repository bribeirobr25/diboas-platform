'use client';

import { memo, useId, useState, useCallback } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { CalculatorFactory } from '@/components/Sections/CalculatorFactory';
import type { CalculatorFactoryConfig } from '@/config/calculatorFactory';
import styles from './CalculatorToggleSection.module.css';

type ActiveCalculator = 'cashflow' | 'treasury';

interface CalculatorToggleSectionProps {
  cashflowConfig: CalculatorFactoryConfig;
  treasuryConfig: CalculatorFactoryConfig;
  enableAnalytics?: boolean;
  className?: string;
}

export const CalculatorToggleSection = memo(function CalculatorToggleSection({
  cashflowConfig,
  treasuryConfig,
  enableAnalytics = true,
  className = '',
}: CalculatorToggleSectionProps) {
  const intl = useTranslation();
  const uid = useId();
  const [active, setActive] = useState<ActiveCalculator>('cashflow');
  const tabId = (type: string) => `${uid}-tab-${type}`;
  const panelId = (type: string) => `${uid}-panel-${type}`;

  const handleToggle = useCallback((tab: ActiveCalculator) => {
    setActive(tab);
  }, []);

  const cashflowLabel = intl.formatMessage({ id: 'landing-b2b.calculator.toggle.paymentFees' });
  const treasuryLabel = intl.formatMessage({ id: 'landing-b2b.calculator.toggle.idleCash' });

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div className={styles.toggleBar} role="tablist" aria-label={intl.formatMessage({ id: 'common.aria.calculatorType' })}>
        <button
          type="button"
          role="tab"
          aria-selected={active === 'cashflow'}
          aria-controls={panelId('cashflow')}
          id={tabId('cashflow')}
          className={`${styles.toggleButton} ${active === 'cashflow' ? styles.toggleButtonActive : ''}`}
          onClick={() => handleToggle('cashflow')}
        >
          {cashflowLabel}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={active === 'treasury'}
          aria-controls={panelId('treasury')}
          id={tabId('treasury')}
          className={`${styles.toggleButton} ${active === 'treasury' ? styles.toggleButtonActive : ''}`}
          onClick={() => handleToggle('treasury')}
        >
          {treasuryLabel}
        </button>
      </div>

      <div
        id={panelId('cashflow')}
        role="tabpanel"
        aria-labelledby={tabId('cashflow')}
        hidden={active !== 'cashflow'}
      >
        {active === 'cashflow' ? (
          <CalculatorFactory
            config={cashflowConfig}
            enableAnalytics={enableAnalytics}
          />
        ) : null}
      </div>

      <div
        id={panelId('treasury')}
        role="tabpanel"
        aria-labelledby={tabId('treasury')}
        hidden={active !== 'treasury'}
      >
        {active === 'treasury' ? (
          <CalculatorFactory
            config={treasuryConfig}
            enableAnalytics={enableAnalytics}
          />
        ) : null}
      </div>
    </div>
  );
});

export default CalculatorToggleSection;
