'use client';

/**
 * Action Screen (Screen 3)
 *
 * Amount selection screen
 */

import { Button } from '@diboas/ui';
import { AMOUNT_OPTIONS } from '../constants';
import styles from '../InteractiveDemo.module.css';

interface ActionScreenProps {
  selectedAmount: number;
  formatCurrency: (value: number, decimals?: number) => string;
  onSelectAmount: (amount: number) => void;
  onDeposit: () => void;
  t: (id: string) => string;
}

export function ActionScreen({
  selectedAmount,
  formatCurrency,
  onSelectAmount,
  onDeposit,
  t,
}: ActionScreenProps) {
  return (
    <div className={styles.screen}>
      <h2 className={styles.header}>
        {t('landing-b2c.demo.action.header')}
      </h2>
      <p className={styles.prompt}>
        {t('landing-b2c.demo.action.prompt')}
      </p>
      <div className={styles.amountInput}>
        {formatCurrency(selectedAmount)}
      </div>
      <div className={styles.amountButtons} role="group" aria-label={t('common.accessibility.selectAmount')}>
        {AMOUNT_OPTIONS.map(amount => (
          <button
            key={amount}
            type="button"
            className={`${styles.amountButton} ${selectedAmount === amount ? styles.amountButtonSelected : ''}`}
            onClick={() => onSelectAmount(amount)}
            aria-pressed={selectedAmount === amount}
          >
            {formatCurrency(amount, 0)}
          </button>
        ))}
      </div>
      <p className={styles.reassurance}>
        {t('landing-b2c.demo.action.reassurance1')}
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
