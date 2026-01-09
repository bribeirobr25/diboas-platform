'use client';

/**
 * Result Card Component
 *
 * Displays individual result (DeFi or Bank) with animated values
 */

import { formatCurrency, formatPercentage } from '@/lib/calculator';
import styles from './FutureYouCalculator.module.css';

interface ResultCardProps {
  label: string;
  apy: number;
  apyLabel: string;
  finalBalance: number;
  interestEarned: number;
  growthPercentage: number;
  barWidth: number;
  currency: string;
  currencyLocale: string;
  variant: 'defi' | 'bank';
}

export function ResultCard({
  label,
  apy,
  apyLabel,
  finalBalance,
  interestEarned,
  growthPercentage,
  barWidth,
  currency,
  currencyLocale,
  variant,
}: ResultCardProps) {
  const isBank = variant === 'bank';

  return (
    <div className={`${styles.resultCard} ${isBank ? styles.bankCard : ''}`}>
      <div className={styles.resultHeader}>
        <span className={styles.resultLabel}>{label}</span>
        <span className={styles.resultApy}>
          {formatPercentage(apy)} {apyLabel}
        </span>
      </div>
      <div className={styles.resultBar}>
        <div
          className={`${styles.bar} ${isBank ? styles.bankBar : styles.defiBar}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <div className={styles.resultValue}>
        {formatCurrency(finalBalance, currency, currencyLocale)}
      </div>
      <div className={styles.resultGrowth}>
        +{formatCurrency(interestEarned, currency, currencyLocale)}
        <span className={styles.growthPercent}>
          ({formatPercentage(growthPercentage)})
        </span>
      </div>
    </div>
  );
}
