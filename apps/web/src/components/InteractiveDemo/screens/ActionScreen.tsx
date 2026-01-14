'use client';

/**
 * Action Screen (Screen 3)
 *
 * Amount selection screen
 * Amount options are displayed without currency conversion (fixed values per locale)
 */

import { useMemo } from 'react';
import { Button } from '@diboas/ui';
import { AMOUNT_OPTIONS } from '../constants';
import styles from '../InteractiveDemo.module.css';

interface ActionScreenProps {
  isBrazil: boolean;
  selectedAmount: number;
  formatCurrencyRaw: (value: number, decimals?: number) => string;
  onSelectAmount: (amount: number) => void;
  onDeposit: () => void;
  t: (id: string, values?: Record<string, string>) => string;
}

export function ActionScreen({
  isBrazil,
  selectedAmount,
  formatCurrencyRaw,
  onSelectAmount,
  onDeposit,
  t,
}: ActionScreenProps) {
  // Get amount options based on locale
  const amountOptions = useMemo(() =>
    isBrazil ? AMOUNT_OPTIONS.BRAZIL : AMOUNT_OPTIONS.DEFAULT
  , [isBrazil]);

  // Get minimum amount from options, formatted with currency (no conversion)
  const minAmount = formatCurrencyRaw(amountOptions[0], 0);

  return (
    <div className={styles.screen}>
      <h2 className={styles.header}>
        {t('landing-b2c.demo.action.header')}
      </h2>
      <p className={styles.prompt}>
        {t('landing-b2c.demo.action.prompt')}
      </p>
      <div className={styles.amountInput}>
        {formatCurrencyRaw(selectedAmount, 0)}
      </div>
      <div className={styles.amountButtons} role="group" aria-label={t('common.accessibility.selectAmount')}>
        {amountOptions.map(amount => (
          <button
            key={amount}
            type="button"
            className={`${styles.amountButton} ${selectedAmount === amount ? styles.amountButtonSelected : ''}`}
            onClick={() => onSelectAmount(amount)}
            aria-pressed={selectedAmount === amount}
          >
            {formatCurrencyRaw(amount, 0)}
          </button>
        ))}
      </div>
      <p className={styles.reassurance}>
        {t('landing-b2c.demo.action.reassurance1', { minAmount })}
      </p>
      <p className={styles.reassurance}>
        {t('landing-b2c.demo.action.reassurance2')}
      </p>
      <Button
        variant="primary"
        size="lg"
        className={styles.ctaButton}
        onClick={onDeposit}
      >
        {t('landing-b2c.demo.action.cta')}
      </Button>
    </div>
  );
}
