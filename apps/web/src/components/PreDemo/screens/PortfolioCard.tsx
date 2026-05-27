/**
 * Portfolio Card — total balance summary with cash/investments breakdown
 * Extracted from WalletDetailsScreen for file decoupling (≤150 lines).
 */

import { formatCurrency } from '@/lib/pre-demo';
import type { SupportedLocale } from '@diboas/i18n/server';
import styles from '../PreDemo.module.css';

interface PortfolioCardProps {
  totalBalance: number;
  cashBalance: number;
  totalInvestments: number;
  locale: SupportedLocale;
  t: (key: string) => string;
}

export function PortfolioCard({
  totalBalance,
  cashBalance,
  totalInvestments,
  locale,
  t,
}: PortfolioCardProps) {
  return (
    <div className={styles.portfolioCard}>
      <div className={styles.portfolioLabel}>{t('preDemo.wallet.totalBalance')}</div>
      <div className={styles.portfolioAmount}>{formatCurrency(totalBalance, 2, locale)}</div>
      <div className={styles.portfolioBreakdown}>
        <div className={styles.portfolioBreakdownItem}>
          <span className={styles.portfolioBreakdownLabel}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.iconMuted}
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            {t('preDemo.wallet.cash')}
          </span>
          <span>{formatCurrency(cashBalance, 2, locale)}</span>
        </div>
        <div className={styles.portfolioBreakdownItem}>
          <span className={styles.portfolioBreakdownLabel}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.iconMuted}
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            {t('preDemo.wallet.investments')}
          </span>
          <span>{formatCurrency(totalInvestments, 2, locale)}</span>
        </div>
      </div>
    </div>
  );
}
