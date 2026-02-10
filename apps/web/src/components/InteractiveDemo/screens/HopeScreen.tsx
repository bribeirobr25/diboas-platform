'use client';

/**
 * Hope Screen (Screen 2)
 *
 * Shows potential growth to inspire hope
 * All monetary values are calculated from constants for consistency
 */

import { useMemo } from 'react';
import { Button } from '@diboas/ui';
import { INITIAL_BALANCE, BANK_RATES, APY_RATE } from '../constants';
import styles from '../InteractiveDemo.module.css';

interface HopeScreenProps {
  isBrazil: boolean;
  formatCurrency: (value: number, decimals?: number) => string;
  onContinue: () => void;
  t: (id: string, values?: Record<string, string | number>) => string;
}

export function HopeScreen({
  isBrazil,
  formatCurrency,
  onContinue,
  t,
}: HopeScreenProps) {
  // Calculate all values dynamically based on region
  const calculatedValues = useMemo(() => {
    const rates = isBrazil ? BANK_RATES.BRAZIL : BANK_RATES.DEFAULT;

    // After 1 year with bank
    const bankInterest = INITIAL_BALANCE * rates.bankPaysRate;
    // For Brazil: adjust bank total for currency depreciation (only interest is affected)
    // This reflects real purchasing power loss when BRL depreciates against USD
    const adjustedBankInterest = isBrazil
      ? bankInterest * (1 - BANK_RATES.BRAZIL.currencyDepreciation)
      : bankInterest;
    const bankTotal = INITIAL_BALANCE + adjustedBankInterest;

    // After 1 year with diBoaS (returns are in USD, no currency loss)
    const diboasInterest = INITIAL_BALANCE * APY_RATE;
    const diboasTotal = INITIAL_BALANCE + diboasInterest;

    // The difference
    const difference = diboasTotal - bankTotal;

    // Growth multiplier (how many times better)
    const growthMultiplier = Math.round(diboasInterest / (isBrazil ? adjustedBankInterest : bankInterest));

    return {
      balance: formatCurrency(INITIAL_BALANCE),
      bankTotal: formatCurrency(bankTotal),
      diboasTotal: formatCurrency(diboasTotal),
      difference: formatCurrency(difference),
      growthMultiplier,
      apyRate: Math.round(APY_RATE * 100),
    };
  }, [isBrazil, formatCurrency]);

  const diboasTotal = INITIAL_BALANCE * (1 + APY_RATE);

  return (
    <div className={styles.screen}>
      <h2 className={styles.header}>
        {t('landing-b2c.demo.hope.header', { balance: calculatedValues.balance })}
      </h2>
      <div className={styles.comparisonContainer}>
        <div className={styles.startBalance}>
          {calculatedValues.balance}
        </div>
        <div className={styles.arrow}>↓</div>
        <p className={styles.projectionLabel}>
          {t('landing-b2c.demo.hope.projectionLabel', { apyRate: calculatedValues.apyRate })}
        </p>
        <div className={styles.projectedBalance}>
          {formatCurrency(diboasTotal)}
        </div>
        <p className={styles.comparison}>
          {t('landing-b2c.demo.hope.comparison', {
            bankTotal: calculatedValues.bankTotal,
            diboasTotal: calculatedValues.diboasTotal,
            difference: calculatedValues.difference
          })}
        </p>
      </div>
      <p className={styles.impact}>
        {t('landing-b2c.demo.hope.impact', { multiplier: calculatedValues.growthMultiplier })}
      </p>
      <Button
        variant="primary"
        size="sm"
        onClick={onContinue}
      >
        {t('landing-b2c.demo.hope.cta')}
      </Button>
    </div>
  );
}
