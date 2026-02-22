'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { usePreDream } from '../PreDreamProvider';
import { ShareDreamSection } from '../components/ShareDreamSection';
import { PRE_DREAM_TIMEFRAMES, formatCurrency } from '@/lib/pre-dream';
import { BANK_RATE_SOURCES } from '@/lib/dream-mode/constants';
import { useLocale } from '@/components/Providers';
import { analyticsService } from '@/lib/analytics';
import styles from '../PreDream.module.css';

interface ResultsScreenProps {
  onBackToHome?: () => void;
}

export function ResultsScreen({ onBackToHome }: ResultsScreenProps) {
  const intl = useTranslation();
  const { state, reset } = usePreDream();
  const { locale } = useLocale();
  const trackedRef = useRef(false);

  const t = (key: string, values?: Record<string, string>) => {
    return intl.formatMessage({ id: `preDream.results.${key}` }, values);
  };

  const result = state.result;

  // Locale-specific bank rate (matching DreamMode pattern)
  const bankSource = BANK_RATE_SOURCES[locale] || BANK_RATE_SOURCES['en'];
  const bankApy = bankSource.rate / 100;
  const years = result ? PRE_DREAM_TIMEFRAMES[state.selectedTimeframe].years : 1;
  const bankMultiplier = Math.pow(1 + bankApy, years);
  const localeBankBalance = result ? result.totalInvestment * bankMultiplier : 0;
  const localeBankInterest = result ? localeBankBalance - result.totalInvestment : 0;

  // Brazil currency depreciation (6% annual, matching DreamMode)
  const currencyDepreciation = locale === 'pt-BR' ? 0.06 : 0;
  const depreciationFactor = currencyDepreciation > 0 ? Math.pow(1 - currencyDepreciation, years) : 1;
  const adjustedBankInterest = localeBankInterest * depreciationFactor;
  const adjustedBankBalance = result ? result.totalInvestment + adjustedBankInterest : 0;
  const localeDifference = result ? result.defiBalance - adjustedBankBalance : 0;

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
          bank_balance: adjustedBankBalance,
          difference: localeDifference,
        },
      });
    }
  }, [result, state.selectedPath, state.selectedTimeframe, adjustedBankBalance, localeDifference]);

  if (!result) return null;

  const bankBarWidth = result.defiBalance > 0
    ? (adjustedBankBalance / result.defiBalance) * 100
    : 0;

  return (
    <div className={styles.screenContent}>
      <div className={styles.screenHeader}>
        <h1 className={styles.screenTitle}>
          {t('titlePrefix', { amount: formatCurrency(result.totalInvestment, 0, locale) })}
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
              <p className={styles.comparisonAmount}>{formatCurrency(result.defiBalance, 2, locale)}</p>
              <p className={styles.comparisonGain}>+{formatCurrency(result.defiInterest, 2, locale)}</p>
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
              <p className={styles.comparisonApyMuted}>{bankSource.rate}% APY</p>
            </div>
            <div className={styles.comparisonValues}>
              <p className={styles.comparisonAmountMuted}>{formatCurrency(adjustedBankBalance, 2, locale)}</p>
              <p className={styles.comparisonGainMuted}>+{formatCurrency(adjustedBankInterest, 2, locale)}</p>
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
            {t('differenceMore', { amount: formatCurrency(localeDifference, 2, locale) })}
          </p>
          <p className={styles.differenceSubtext}>{t('differenceSubtext')}</p>
        </div>
      </div>

      {/* Share Section */}
      <ShareDreamSection result={result} localeDifference={localeDifference} />

      {/* Bank Source */}
      <p className={styles.bankSource}>
        {intl.formatMessage({ id: bankSource.translationKey })}
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
