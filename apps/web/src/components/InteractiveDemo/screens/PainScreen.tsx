'use client';

/**
 * Pain Screen (Screen 1)
 *
 * Shows current low interest to highlight the pain point
 */

import { Button } from '@diboas/ui';
import { INITIAL_BALANCE, INITIAL_INTEREST } from '../constants';
import styles from '../InteractiveDemo.module.css';

interface PainScreenProps {
  isBrazil: boolean;
  formatCurrency: (value: number, decimals?: number) => string;
  onContinue: () => void;
  t: (id: string, values?: Record<string, string>) => string;
}

export function PainScreen({
  isBrazil,
  formatCurrency,
  onContinue,
  t,
}: PainScreenProps) {
  return (
    <div className={styles.screen}>
      <h2 className={styles.header}>
        {isBrazil
          ? t('landing-b2c.demo.pain.pixHeader')
          : t('landing-b2c.demo.pain.header')
        }
      </h2>
      <div className={styles.balanceDisplay}>
        {formatCurrency(INITIAL_BALANCE)}
      </div>
      <p className={styles.subtext}>
        {t('landing-b2c.demo.pain.subtext', { interest: formatCurrency(INITIAL_INTEREST) })}
      </p>
      <p className={styles.hook}>
        {t('landing-b2c.demo.pain.hook')}
      </p>
      <Button
        variant="primary"
        size="lg"
        className={styles.ctaButton}
        onClick={onContinue}
        aria-label={t('landing-b2c.demo.pain.cta')}
      >
        {t('landing-b2c.demo.pain.cta')}
      </Button>
    </div>
  );
}
