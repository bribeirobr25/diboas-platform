/**
 * Calculator Section
 *
 * Landing page section wrapper for the FutureYouCalculator
 * Shows compound growth comparison for anonymous visitors
 */

'use client';

import { memo, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { SectionContainer } from '../SectionContainer/SectionContainer';
import { FutureYouCalculator } from '@/components/FutureYouCalculator';
import styles from './CalculatorSection.module.css';

interface CalculatorSectionConfig {
  sectionId?: string;
  backgroundColor?: string;
}

interface CalculatorSectionProps {
  config?: CalculatorSectionConfig;
  enableAnalytics?: boolean;
  onCtaClick?: () => void;
}

export const CalculatorSection = memo(function CalculatorSection({
  config,
  enableAnalytics = true,
  onCtaClick,
}: CalculatorSectionProps) {
  const intl = useIntl();

  const handleCtaClick = useCallback(() => {
    // Scroll to waitlist section
    const waitlistSection = document.getElementById('waitlist');
    if (waitlistSection) {
      waitlistSection.scrollIntoView({ behavior: 'smooth' });
    }
    onCtaClick?.();
  }, [onCtaClick]);

  return (
    <SectionContainer
      id="future-you"
      variant="standard"
      padding="standard"
      backgroundColor={config?.backgroundColor}
      ariaLabel={intl.formatMessage({ id: 'calculator.headline' })}
      data-testid={config?.sectionId || 'calculator-section'}
    >
      <div className={styles.wrapper}>
        <FutureYouCalculator
          onCtaClick={handleCtaClick}
          className={styles.calculator}
        />
      </div>
    </SectionContainer>
  );
});

CalculatorSection.displayName = 'CalculatorSection';
