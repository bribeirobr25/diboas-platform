'use client';

/**
 * Pain Screen (Screen 1)
 *
 * Shows current low interest to highlight the pain point
 * All monetary values are calculated from constants for consistency
 */

import { useMemo } from 'react';
import { Button } from '@diboas/ui';
import { INITIAL_BALANCE, BANK_RATES } from '../constants';
import styles from '../InteractiveDemo.module.css';

interface PainScreenProps {
  isBrazil: boolean;
  formatCurrency: (value: number, decimals?: number) => string;
  onContinue: () => void;
  t: (id: string, values?: Record<string, string | number>) => string;
}

export function PainScreen({
  isBrazil,
  formatCurrency,
  onContinue,
  t,
}: PainScreenProps) {
  // Calculate values based on region
  const calculatedValues = useMemo(() => {
    const rates = isBrazil ? BANK_RATES.BRAZIL : BANK_RATES.DEFAULT;

    const bankPays = INITIAL_BALANCE * rates.bankPaysRate;
    const bankEarns = INITIAL_BALANCE * rates.bankEarnsRate;
    const currencyLoss = isBrazil ? BANK_RATES.BRAZIL.currencyDepreciation * 100 : 0;

    return {
      bankPays: formatCurrency(bankPays, 2),
      bankEarns: formatCurrency(bankEarns, 2),
      currencyLoss: Math.round(currencyLoss),
    };
  }, [isBrazil, formatCurrency]);

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
        {t('landing-b2c.demo.pain.subtext', { bankPays: calculatedValues.bankPays })}
      </p>
      <p className={styles.hook}>
        {isBrazil
          ? t('landing-b2c.demo.pain.hookBrazil', {
              bankEarns: calculatedValues.bankEarns,
              currencyLoss: calculatedValues.currencyLoss
            })
          : t('landing-b2c.demo.pain.hook', { bankEarns: calculatedValues.bankEarns })
        }
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
