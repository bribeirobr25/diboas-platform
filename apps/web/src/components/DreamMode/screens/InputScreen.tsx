'use client';

/**
 * Input Screen
 *
 * Second screen - collects initial amount and monthly contribution
 */

import React from 'react';
import { useIntl } from 'react-intl';
import { useDreamMode } from '../DreamModeProvider';
import { CALCULATOR_CONFIG } from '@/lib/calculator';
import styles from './screens.module.css';

export function InputScreen() {
  const intl = useIntl();
  const { state, setInput, nextScreen, previousScreen } = useDreamMode();

  const t = (key: string) => intl.formatMessage({ id: `dreamMode.input.${key}` });

  const handleInitialAmountChange = (value: number) => {
    const clamped = Math.min(
      Math.max(value, CALCULATOR_CONFIG.minInitialAmount),
      CALCULATOR_CONFIG.maxInitialAmount
    );
    setInput({ initialAmount: clamped });
  };

  const handleMonthlyChange = (value: number) => {
    const clamped = Math.min(
      Math.max(value, CALCULATOR_CONFIG.minMonthlyContribution),
      CALCULATOR_CONFIG.maxMonthlyContribution
    );
    setInput({ monthlyContribution: clamped });
  };

  const getCurrencySymbol = () => {
    switch (state.input.currency) {
      case 'EUR': return '€';
      case 'BRL': return 'R$';
      default: return '$';
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        {/* Progress indicator */}
        <div className={styles.progress}>
          <div className={styles.progressDot} data-active="true" />
          <div className={styles.progressDot} />
          <div className={styles.progressDot} />
        </div>

        <h2 className={styles.headline}>{t('headline')}</h2>
        <p className={styles.subhead}>{t('subhead')}</p>

        {/* Initial amount input */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>{t('initialAmount')}</label>
          <div className={styles.inputWrapper}>
            <span className={styles.currencySymbol}>{getCurrencySymbol()}</span>
            <input
              type="number"
              value={state.input.initialAmount}
              onChange={(e) => handleInitialAmountChange(Number(e.target.value))}
              className={styles.input}
              min={CALCULATOR_CONFIG.minInitialAmount}
              max={CALCULATOR_CONFIG.maxInitialAmount}
            />
          </div>
          <input
            type="range"
            value={state.input.initialAmount}
            onChange={(e) => handleInitialAmountChange(Number(e.target.value))}
            className={styles.slider}
            min={CALCULATOR_CONFIG.minInitialAmount}
            max={50000}
            step={100}
          />
        </div>

        {/* Monthly contribution input */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>{t('monthlyContribution')}</label>
          <div className={styles.inputWrapper}>
            <span className={styles.currencySymbol}>{getCurrencySymbol()}</span>
            <input
              type="number"
              value={state.input.monthlyContribution}
              onChange={(e) => handleMonthlyChange(Number(e.target.value))}
              className={styles.input}
              min={CALCULATOR_CONFIG.minMonthlyContribution}
              max={CALCULATOR_CONFIG.maxMonthlyContribution}
            />
          </div>
          <input
            type="range"
            value={state.input.monthlyContribution}
            onChange={(e) => handleMonthlyChange(Number(e.target.value))}
            className={styles.slider}
            min={0}
            max={2000}
            step={25}
          />
        </div>

        {/* Navigation */}
        <div className={styles.navigation}>
          <button onClick={previousScreen} className={styles.backButton}>
            <ChevronLeftIcon />
            {t('back')}
          </button>
          <button onClick={nextScreen} className={styles.primaryButton}>
            {t('continue')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
