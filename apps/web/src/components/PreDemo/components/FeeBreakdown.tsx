'use client';

/**
 * FeeBreakdown Component
 *
 * Expandable fee rows with info icon tooltips
 * Shows "Total Fees" toggle header with chevron (collapsible)
 * In confirmation mode (alwaysExpanded): shows fees as negative, "Free" capitalized
 */

import { useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { formatCurrency, type FeeItem } from '@/lib/pre-demo';
import styles from '../PreDemo.module.css';

interface FeeBreakdownProps {
  feeItems: Record<string, FeeItem>;
  totalFees: number;
  alwaysExpanded?: boolean;
}

export function FeeBreakdown({ feeItems, totalFees, alwaysExpanded }: FeeBreakdownProps) {
  const intl = useTranslation();
  const [isExpanded, setIsExpanded] = useState(alwaysExpanded || false);
  const [tooltipKey, setTooltipKey] = useState<string | null>(null);

  const t = (key: string) => intl.formatMessage({ id: key });

  return (
    <div className={styles.feeBreakdown}>
      {/* Toggle header — "Total Fees" with amount and chevron */}
      <button
        onClick={() => !alwaysExpanded && setIsExpanded(!isExpanded)}
        className={styles.feeToggle}
        style={alwaysExpanded ? { cursor: 'default' } : undefined}
      >
        <span className={styles.feeToggleLabel}>
          {t('preDemo.fees.total')}
        </span>
        <span className={styles.feeToggleAmount}>
          {alwaysExpanded ? `-${formatCurrency(totalFees)}` : formatCurrency(totalFees)}
          {!alwaysExpanded && (
            <span className={styles.feeToggleChevron}>
              {isExpanded ? '\u25B2' : '\u25BC'}
            </span>
          )}
        </span>
      </button>

      {/* Fee rows */}
      {(isExpanded || alwaysExpanded) && (
        <div className={styles.feeRows}>
          {Object.entries(feeItems).map(([key, fee]) => (
            <div key={key} className={styles.feeRow}>
              <div className={styles.feeRowLeft}>
                <span className={styles.feeLabel}>{t(fee.label)}</span>
                {fee.tooltip && (
                  <button
                    className={styles.feeInfoButton}
                    onClick={() =>
                      setTooltipKey(tooltipKey === key ? null : key)
                    }
                    aria-label={t('preDemo.fees.tooltipAriaLabel')}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4m0-4h.01" />
                    </svg>
                  </button>
                )}
              </div>
              <span
                className={`${styles.feeAmount} ${
                  fee.amount === 0 ? styles.feeAmountFree : ''
                }`}
              >
                {fee.amount === 0
                  ? formatCurrency(0)
                  : alwaysExpanded
                    ? `-${formatCurrency(fee.amount)}`
                    : formatCurrency(fee.amount)}
              </span>
              {/* Tooltip */}
              {tooltipKey === key && fee.tooltip && (
                <div className={styles.feeTooltip}>{t(fee.tooltip)}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
