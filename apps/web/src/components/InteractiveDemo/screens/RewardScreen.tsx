'use client';

/**
 * Reward Screen (Screen 4)
 *
 * Animated counter showing growth with progressive reveal
 */

import { Button } from '@diboas/ui';
import { GROWTH_STEPS } from '../constants';
import styles from '../InteractiveDemo.module.css';

interface RewardScreenProps {
  selectedAmount: number;
  animatedBalance: number;
  rewardStep: number;
  formatCurrency: (value: number, decimals?: number) => string;
  onContinue: () => void;
  t: (id: string, values?: Record<string, string>) => string;
}

export function RewardScreen({
  selectedAmount,
  animatedBalance,
  rewardStep,
  formatCurrency,
  onContinue,
  t,
}: RewardScreenProps) {
  return (
    <div className={styles.screen}>
      <h2 className={styles.header}>
        {t('landing-b2c.demo.reward.header')}
      </h2>
      {/* Progressive balance reveal - 2 decimals for clarity */}
      <div className={styles.balanceProgression}>
        {/* Initial balance - always visible */}
        <span className={styles.smallBalance}>{formatCurrency(selectedAmount, 2)}</span>

        {/* Step 1: First growth */}
        {rewardStep >= 1 && (
          <>
            <span className={`${styles.smallArrow} ${styles.fadeIn}`}>↓</span>
            <span className={`${styles.smallBalance} ${styles.fadeIn}`}>
              {formatCurrency(selectedAmount + GROWTH_STEPS[0], 2)}
            </span>
          </>
        )}

        {/* Step 2: Second growth */}
        {rewardStep >= 2 && (
          <>
            <span className={`${styles.smallArrow} ${styles.fadeIn}`}>↓</span>
            <span className={`${styles.smallBalance} ${styles.fadeIn}`}>
              {formatCurrency(selectedAmount + GROWTH_STEPS[1], 2)}
            </span>
          </>
        )}

        {/* Step 3: Final growth indicator */}
        {rewardStep >= 3 && (
          <span className={`${styles.smallArrow} ${styles.fadeIn}`}>↓</span>
        )}
      </div>

      {/* Final value - revealed at step 3 */}
      {rewardStep >= 3 && (
        <div className={`${styles.finalBalance} ${styles.fadeIn}`}>
          {formatCurrency(animatedBalance, 2)}
        </div>
      )}

      {/* Delight message - revealed at step 3 */}
      {rewardStep >= 3 && (
        <p className={`${styles.delight} ${styles.fadeIn}`}>
          {t('landing-b2c.demo.reward.delight', {
            earned: formatCurrency(GROWTH_STEPS[2], 2)
          })}
        </p>
      )}

      <p className={styles.vision}>
        {t('landing-b2c.demo.reward.vision')}
      </p>
      <Button
        variant="primary"
        size="lg"
        className={styles.ctaButton}
        onClick={onContinue}
      >
        {t('landing-b2c.demo.reward.continueCta')}
      </Button>
    </div>
  );
}
