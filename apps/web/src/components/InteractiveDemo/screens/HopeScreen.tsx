'use client';

/**
 * Hope Screen (Screen 2)
 *
 * Shows potential growth to inspire hope
 */

import { Button } from '@diboas/ui';
import { INITIAL_BALANCE, INITIAL_INTEREST, APY_RATE } from '../constants';
import styles from '../InteractiveDemo.module.css';

interface HopeScreenProps {
  formatCurrency: (value: number, decimals?: number) => string;
  onContinue: () => void;
  t: (id: string, values?: Record<string, string>) => string;
}

export function HopeScreen({
  formatCurrency,
  onContinue,
  t,
}: HopeScreenProps) {
  const projectedBalance = INITIAL_BALANCE * (1 + APY_RATE);
  const projectedInterest = INITIAL_BALANCE * APY_RATE;

  return (
    <div className={styles.screen}>
      <h2 className={styles.header}>
        {t('landing-b2c.demo.hope.header')}
      </h2>
      <div className={styles.comparisonContainer}>
        <div className={styles.startBalance}>
          {formatCurrency(INITIAL_BALANCE)}
        </div>
        <div className={styles.arrow}>↓</div>
        <p className={styles.projectionLabel}>
          {t('landing-b2c.demo.hope.projectionLabel')}
        </p>
        <div className={styles.projectedBalance}>
          {formatCurrency(projectedBalance)}
        </div>
      </div>
      <p className={styles.comparison}>
        {t('landing-b2c.demo.hope.comparison', {
          projected: formatCurrency(projectedInterest),
          current: formatCurrency(INITIAL_INTEREST)
        })}
      </p>
      <p className={styles.impact}>
        {t('landing-b2c.demo.hope.impact')}
      </p>
      <Button
        variant="primary"
        size="lg"
        className={styles.ctaButton}
        onClick={onContinue}
      >
        {t('landing-b2c.demo.hope.cta')}
      </Button>
    </div>
  );
}
