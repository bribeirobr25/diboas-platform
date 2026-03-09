'use client';

import { memo, useState, useCallback } from 'react';
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
  const [active, setActive] = useState<ActiveCalculator>('cashflow');

  const handleToggle = useCallback((tab: ActiveCalculator) => {
    setActive(tab);
  }, []);

  const cashflowLabel = intl.formatMessage({ id: 'landing-b2b.calculator.toggle.paymentFees' });
  const treasuryLabel = intl.formatMessage({ id: 'landing-b2b.calculator.toggle.idleCash' });

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div className={styles.toggleBar} role="tablist" aria-label="Calculator type">
        <button
          type="button"
          role="tab"
          aria-selected={active === 'cashflow'}
          aria-controls="calculator-panel-cashflow"
          id="calculator-tab-cashflow"
          className={`${styles.toggleButton} ${active === 'cashflow' ? styles.toggleButtonActive : ''}`}
          onClick={() => handleToggle('cashflow')}
        >
          {cashflowLabel}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={active === 'treasury'}
          aria-controls="calculator-panel-treasury"
          id="calculator-tab-treasury"
          className={`${styles.toggleButton} ${active === 'treasury' ? styles.toggleButtonActive : ''}`}
          onClick={() => handleToggle('treasury')}
        >
          {treasuryLabel}
        </button>
      </div>

      <div
        id="calculator-panel-cashflow"
        role="tabpanel"
        aria-labelledby="calculator-tab-cashflow"
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
        id="calculator-panel-treasury"
        role="tabpanel"
        aria-labelledby="calculator-tab-treasury"
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
