'use client';

/**
 * BalanceCard Component
 *
 * Displays total balance with Cash + Investments breakdown
 * Includes wallet icon and "Tap to view your wallets" link
 * Investments row expands to show individual asset breakdown
 */

import { useMemo, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { usePreDemo } from '../PreDemoProvider';
import { ASSET_PRICES } from '@/lib/pre-demo';
import styles from '../PreDemo.module.css';

function formatCurrency(amount: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

interface BalanceCardProps {
  compact?: boolean;
  showTapToView?: boolean;
}

export function BalanceCard({ compact, showTapToView = true }: BalanceCardProps) {
  const intl = useTranslation();
  const { state } = usePreDemo();
  const [investmentsExpanded, setInvestmentsExpanded] = useState(false);

  const t = (key: string) => intl.formatMessage({ id: key });

  const totalInvestments = useMemo(() => {
    return Object.values(state.investments.assets).reduce(
      (sum, asset) => sum + asset.amount,
      0,
    );
  }, [state.investments.assets]);

  const solReserveValue = state.solBalance * ASSET_PRICES.SOL;
  const totalBalance = state.cashBalance + totalInvestments + solReserveValue;

  return (
    <div className={styles.balanceCard}>
      <div className={styles.balanceCardHeader}>
        <div className={styles.balanceLabel}>
          {t('preDemo.home.totalBalance')}
        </div>
        {/* Wallet icon top-right */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
          <path d="M16 15h2" />
        </svg>
      </div>
      <div className={styles.balanceAmount}>
        {formatCurrency(totalBalance)}
      </div>
      <div className={styles.balanceBreakdown}>
        <div className={styles.balanceBreakdownItem}>
          <span className={styles.balanceBreakdownLabel}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8, marginRight: 4, flexShrink: 0 }}>
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            {t('preDemo.home.cash')}
          </span>
          <span>{formatCurrency(state.cashBalance + solReserveValue)}</span>
        </div>
        <div className={styles.balanceBreakdownItem}>
          <span className={styles.balanceBreakdownLabel}>
            {totalInvestments > 0 ? (
              <span
                className={styles.investmentsRow}
                onClick={(e) => {
                  e.stopPropagation();
                  setInvestmentsExpanded(!investmentsExpanded);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    setInvestmentsExpanded(!investmentsExpanded);
                  }
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8, marginRight: 4, flexShrink: 0 }}>
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                {t('preDemo.home.investments')}
                <span className={`${styles.investmentsChevron} ${investmentsExpanded ? styles.investmentsChevronExpanded : ''}`}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </span>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8, marginRight: 4, flexShrink: 0 }}>
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                {t('preDemo.home.investments')}
              </>
            )}
          </span>
          <span>{formatCurrency(totalInvestments)}</span>
          {/* Expanded investments breakdown */}
          {investmentsExpanded && totalInvestments > 0 && (
            <div className={styles.investmentsBreakdown}>
              {Object.entries(state.investments.assets).map(([symbol, asset]) => (
                asset.amount > 0 && (
                  <div key={symbol} className={styles.investmentAssetRow}>
                    <span>{asset.name}</span>
                    <span>{formatCurrency(asset.amount)}</span>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Tap to view wallets link */}
      {showTapToView && !compact && (
        <div className={styles.balanceTapToView}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
          </svg>
          <span>{t('preDemo.home.tapToViewWallets')}</span>
        </div>
      )}
    </div>
  );
}
