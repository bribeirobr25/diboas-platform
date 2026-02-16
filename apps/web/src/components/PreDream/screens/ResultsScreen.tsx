'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { usePreDream } from '../PreDreamProvider';
import { ShareDreamSection } from '../components/ShareDreamSection';
import { PRE_DREAM_BANK_APY, formatCurrency } from '@/lib/pre-dream';
import { analyticsService } from '@/lib/analytics';
import styles from '../PreDream.module.css';

interface ResultsScreenProps {
  onBackToHome?: () => void;
}

export function ResultsScreen({ onBackToHome }: ResultsScreenProps) {
  const intl = useTranslation();
  const { state, reset } = usePreDream();
  const trackedRef = useRef(false);

  const t = (key: string, values?: Record<string, string>) => {
    return intl.formatMessage({ id: `preDream.results.${key}` }, values);
  };

  const result = state.result;

  // Track pre_dream_completed when results are shown
  useEffect(() => {
    if (result && !trackedRef.current) {
      trackedRef.current = true;
      analyticsService.track({
        name: 'pre_dream_completed',
        parameters: {
          path: state.selectedPath,
          timeframe: state.selectedTimeframe,
          initial_amount: result.totalInvestment,
          defi_balance: result.defiBalance,
          bank_balance: result.bankBalance,
          difference: result.difference,
        },
      });
    }
  }, [result, state.selectedPath, state.selectedTimeframe]);

  if (!result) return null;

  const bankBarWidth = result.defiBalance > 0
    ? (result.bankBalance / result.defiBalance) * 100
    : 0;

  return (
    <div className={styles.screenContent}>
      <div className={styles.screenHeader}>
        <h1 className={styles.screenTitle}>
          {t('titlePrefix', { amount: formatCurrency(result.totalInvestment, 0) })}
        </h1>
      </div>

      {/* Comparison Cards */}
      <div className={styles.comparisonCards}>
        {/* diBoaS Card */}
        <div className={styles.comparisonCardDiboas}>
          <div className={styles.comparisonHeader}>
            <div>
              <p className={styles.comparisonLabel}>{t('withDiboas')}</p>
              <p className={styles.comparisonApy}>{result.pathApy}% APY</p>
            </div>
            <div className={styles.comparisonValues}>
              <p className={styles.comparisonAmount}>{formatCurrency(result.defiBalance)}</p>
              <p className={styles.comparisonGain}>+{formatCurrency(result.defiInterest)}</p>
            </div>
          </div>
          <div className={styles.progressBarBg}>
            <div className={styles.progressBarDiboas} style={{ width: '100%' }} />
          </div>
        </div>

        {/* Bank Card */}
        <div className={styles.comparisonCardBank}>
          <div className={styles.comparisonHeader}>
            <div>
              <p className={styles.comparisonLabelMuted}>{t('bankWouldGive')}</p>
              <p className={styles.comparisonApyMuted}>{PRE_DREAM_BANK_APY}% APY</p>
            </div>
            <div className={styles.comparisonValues}>
              <p className={styles.comparisonAmountMuted}>{formatCurrency(result.bankBalance)}</p>
              <p className={styles.comparisonGainMuted}>+{formatCurrency(result.bankInterest)}</p>
            </div>
          </div>
          <div className={styles.progressBarBgMuted}>
            <div className={styles.progressBarBank} style={{ width: `${bankBarWidth}%` }} />
          </div>
        </div>
      </div>

      {/* Difference Highlight */}
      <div className={styles.differenceHighlight}>
        <div className={styles.differenceIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>
        <div>
          <p className={styles.differenceText}>
            {t('differenceMore', { amount: formatCurrency(result.difference) })}
          </p>
          <p className={styles.differenceSubtext}>{t('differenceSubtext')}</p>
        </div>
      </div>

      {/* Share Section */}
      <ShareDreamSection result={result} />

      {/* Bank Source */}
      <p className={styles.bankSource}>
        {t('bankSource', { rate: String(PRE_DREAM_BANK_APY) })}
      </p>

      {/* Actions */}
      <div className={styles.resultActions}>
        <button onClick={reset} className={styles.primaryButton}>
          {t('tryDifferent')}
        </button>
        {onBackToHome && (
          <button onClick={onBackToHome} className={styles.secondaryButton}>
            {t('backToHome')}
          </button>
        )}
      </div>
    </div>
  );
}
