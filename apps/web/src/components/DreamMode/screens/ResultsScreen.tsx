'use client';

/**
 * Results Screen
 *
 * Fifth screen - comparison between DeFi and bank results
 */

import React from 'react';
import { useIntl } from 'react-intl';
import { useDreamMode } from '../DreamModeProvider';
import { formatCurrency, formatPercentage, getCurrencyLocale, DEFI_SCENARIO, BANK_SCENARIO } from '@/lib/calculator';
import styles from './screens.module.css';

export function ResultsScreen() {
  const intl = useIntl();
  const { state, nextScreen, previousScreen } = useDreamMode();

  const t = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `dreamMode.results.${key}` }, values);

  const currencyLocale = getCurrencyLocale(state.input.currency);
  const result = state.result;

  if (!result) {
    return null;
  }

  // Calculate bar widths for visualization
  const maxValue = Math.max(result.defiBalance, result.bankBalance);
  const defiWidth = (result.defiBalance / maxValue) * 100;
  const bankWidth = (result.bankBalance / maxValue) * 100;

  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        {/* Watermark */}
        <div className={styles.watermark}>{t('watermark')}</div>

        <h2 className={styles.headline}>{t('headline')}</h2>
        <p className={styles.subhead}>
          {t('subhead', { timeframe: t(`timeframe.${state.input.timeframe}`) })}
        </p>

        {/* Results comparison */}
        <div className={styles.resultsComparison}>
          {/* DeFi result */}
          <div className={`${styles.resultRow} ${styles.defiRow}`}>
            <div className={styles.resultHeader}>
              <span className={styles.resultLabel}>{t('withDiboas')}</span>
              <span className={styles.resultApy}>
                {formatPercentage(DEFI_SCENARIO.apy)} APY
              </span>
            </div>
            <div className={styles.resultBarContainer}>
              <div
                className={`${styles.resultBar} ${styles.defiBar}`}
                style={{ width: `${defiWidth}%` }}
              />
            </div>
            <div className={styles.resultValues}>
              <span className={styles.resultAmount}>
                {formatCurrency(result.defiBalance, state.input.currency, currencyLocale)}
              </span>
              <span className={styles.resultGain}>
                +{formatCurrency(result.defiInterest, state.input.currency, currencyLocale)}
              </span>
            </div>
          </div>

          {/* Bank result */}
          <div className={`${styles.resultRow} ${styles.bankRow}`}>
            <div className={styles.resultHeader}>
              <span className={styles.resultLabel}>{t('traditionalBank')}</span>
              <span className={styles.resultApyDim}>
                {formatPercentage(BANK_SCENARIO.apy)} APY
              </span>
            </div>
            <div className={styles.resultBarContainer}>
              <div
                className={`${styles.resultBar} ${styles.bankBar}`}
                style={{ width: `${bankWidth}%` }}
              />
            </div>
            <div className={styles.resultValues}>
              <span className={styles.resultAmountDim}>
                {formatCurrency(result.bankBalance, state.input.currency, currencyLocale)}
              </span>
              <span className={styles.resultGainDim}>
                +{formatCurrency(result.bankInterest, state.input.currency, currencyLocale)}
              </span>
            </div>
          </div>
        </div>

        {/* Difference highlight */}
        <div className={styles.differenceHighlight}>
          <div className={styles.differenceIcon}>
            <TrendUpIcon />
          </div>
          <div className={styles.differenceContent}>
            <span className={styles.differenceLabel}>{t('differenceLabel')}</span>
            <span className={styles.differenceValue}>
              +{formatCurrency(result.difference, state.input.currency, currencyLocale)}
            </span>
            <span className={styles.differenceNote}>{t('differenceNote')}</span>
          </div>
        </div>

        {/* ECB source citation (CLO required) */}
        <p className={styles.bankSource}>{t('bank_source')}</p>

        {/* Navigation */}
        <div className={styles.navigation}>
          <button onClick={previousScreen} className={styles.backButton}>
            <ChevronLeftIcon />
            {t('back')}
          </button>
          <button onClick={nextScreen} className={styles.primaryButton}>
            {t('shareResults')}
          </button>
        </div>
      </div>
    </div>
  );
}

function TrendUpIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
