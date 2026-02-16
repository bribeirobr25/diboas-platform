'use client';

/**
 * ActivityFeed Component
 *
 * Transaction list with type-colored SVG icons
 */

import { useTranslation } from '@diboas/i18n/client';
import { usePreDemo } from '../PreDemoProvider';
import { formatCurrency } from '@/lib/pre-demo';
import styles from '../PreDemo.module.css';

/** SVG icons for activity types */
function ActivityTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'deposit':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    case 'send':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      );
    case 'buy':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      );
    default:
      return null;
  }
}

export function ActivityFeed() {
  const intl = useTranslation();
  const { state } = usePreDemo();

  const t = (key: string) => intl.formatMessage({ id: key });

  if (state.transactions.length === 0) {
    return (
      <div className={styles.activityFeed}>
        <h3 className={styles.activityTitle}>
          {t('preDemo.home.activity')}
        </h3>
        <div className={styles.activityEmpty}>
          {/* Clipboard icon */}
          <div className={styles.activityEmptyIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
          </div>
          <p className={styles.activityEmptyText}>
            {t('preDemo.home.noActivity')}
          </p>
          <p className={styles.activityEmptySubtext}>
            {t('preDemo.home.noActivitySubtitle')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.activityFeed}>
      <h3 className={styles.activityTitle}>
        {t('preDemo.home.activity')}
      </h3>
      <div className={styles.activityList}>
        {state.transactions.map((tx) => (
          <div key={tx.id} className={styles.activityItem}>
            <div
              className={`${styles.activityIcon} ${
                tx.type === 'deposit'
                  ? styles.activityIconDeposit
                  : tx.type === 'send'
                    ? styles.activityIconSend
                    : styles.activityIconBuy
              }`}
            >
              <ActivityTypeIcon type={tx.type} />
            </div>
            <div className={styles.activityDetails}>
              <span className={styles.activityDescription}>
                {tx.description}
              </span>
              <span className={styles.activityDate}>{tx.date}</span>
            </div>
            <div className={styles.activityAmounts}>
              <span
                className={`${styles.activityAmount} ${
                  tx.type === 'deposit'
                    ? styles.activityAmountPositive
                    : styles.activityAmountNegative
                }`}
              >
                {tx.type === 'deposit' ? '+' : '-'}
                {formatCurrency(tx.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
