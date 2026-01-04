'use client';

/**
 * Results Screen
 *
 * Fifth screen - comparison between DeFi and bank results
 *
 * Service Agnostic Abstraction: Uses centralized translation hook
 * Code Reusability & DRY: No inline translation helpers
 */

import React from 'react';
import { useDreamMode } from '../DreamModeProvider';
import { useDreamModeTranslation } from '../hooks';
import { formatCurrency, formatPercentage, getCurrencyLocale } from '@/lib/calculator';
import { BANK_RATE_SOURCES } from '@/lib/dream-mode';
import styles from './screens.module.css';

/**
 * Get currency symbol for locale
 */
function getCurrencySymbol(locale: string): string {
  switch (locale) {
    case 'en':
      return '$';
    case 'pt-BR':
      return 'R$';
    case 'de':
    case 'es':
    default:
      return '€';
  }
}

export function ResultsScreen() {
  const { intl, t: translate, getTranslator } = useDreamModeTranslation();
  const { state, nextScreen, goToScreen } = useDreamMode();

  const t = getTranslator('results');

  const currencyLocale = getCurrencyLocale(state.input.currency);
  const result = state.result;

  if (!result) {
    return null;
  }

  // Get locale-specific values
  const locale = intl.locale;
  const currencySymbol = getCurrencySymbol(locale);
  const bankSource = BANK_RATE_SOURCES[locale] || BANK_RATE_SOURCES['en'];

  // Use total investment (initial + monthly contributions) for display
  const totalInvestment = result.totalInvestment || state.input.initialAmount;

  // Use path-based APY for DeFi display
  const pathApy = result.pathApy || 12; // Default to 12% if not set

  // Recalculate bank values with locale-specific rate
  const yearsMap: Record<string, number> = {
    '1week': 7/365,
    '1month': 1/12,
    '1year': 1,
    '5years': 5,
  };
  const years = yearsMap[state.input.timeframe] || 1;
  const bankApy = bankSource.rate / 100; // Convert percentage to decimal
  const bankMultiplier = Math.pow(1 + bankApy, years);
  const localeBankBalance = totalInvestment * bankMultiplier;
  const localeBankInterest = localeBankBalance - totalInvestment;
  const localeDifference = result.defiBalance - localeBankBalance;

  // Calculate bar widths for visualization
  const maxValue = Math.max(result.defiBalance, localeBankBalance);
  const defiWidth = (result.defiBalance / maxValue) * 100;
  const bankWidth = (localeBankBalance / maxValue) * 100;

  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        <h2 className={styles.headline}>
          {t('headline', { currency: currencySymbol, amount: Math.round(totalInvestment).toLocaleString(locale) })}
        </h2>
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
                {formatPercentage(pathApy)} APY
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
                {formatPercentage(bankSource.rate)} APY
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
                {formatCurrency(localeBankBalance, state.input.currency, currencyLocale)}
              </span>
              <span className={styles.resultGainDim}>
                +{formatCurrency(localeBankInterest, state.input.currency, currencyLocale)}
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
            <span className={styles.differenceLabel}>
              {t('differenceLabel', { difference: formatCurrency(localeDifference, state.input.currency, currencyLocale) })}
            </span>
            <span className={styles.differenceNote}>{t('differenceNote')}</span>
          </div>
        </div>

        {/* Bank source citation (CLO required - locale-specific) */}
        <p className={styles.bankSource}>
          {intl.formatMessage({ id: bankSource.translationKey })}
        </p>

        {/* Navigation */}
        <div className={styles.navigation}>
          <button onClick={() => goToScreen('pathSelect')} className={styles.backButton}>
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
