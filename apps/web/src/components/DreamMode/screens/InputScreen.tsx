'use client';

/**
 * Input Screen
 *
 * Second screen - collects initial amount and monthly contribution
 *
 * Service Agnostic Abstraction: Uses centralized translation hook
 * Code Reusability & DRY: Uses shared CurrencyInput and Button components
 */

import React from 'react';
import { useDreamMode } from '../DreamModeProvider';
import { useDreamModeTranslation } from '../hooks';
import { Button } from '@diboas/ui';
import { CurrencyInput, ChevronLeftIcon } from '@/components/UI';
import { CALCULATOR_CONFIG } from '@/lib/calculator';
import styles from './screens.module.css';

export function InputScreen() {
  const { getTranslator } = useDreamModeTranslation();
  const { state, setInput, nextScreen, previousScreen } = useDreamMode();

  const t = getTranslator('input');

  const handleInitialAmountChange = (value: number) => {
    setInput({ initialAmount: value });
  };

  const handleMonthlyChange = (value: number) => {
    setInput({ monthlyContribution: value });
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

        {/* Input fields - Using shared CurrencyInput component */}
        <CurrencyInput
          value={state.input.initialAmount}
          onChange={handleInitialAmountChange}
          label={t('initialAmount')}
          currency={state.input.currency}
          min={CALCULATOR_CONFIG.minInitialAmount}
          max={CALCULATOR_CONFIG.maxInitialAmount}
          sliderMax={50000}
          step={100}
        />

        <CurrencyInput
          value={state.input.monthlyContribution}
          onChange={handleMonthlyChange}
          label={t('monthlyContribution')}
          currency={state.input.currency}
          min={CALCULATOR_CONFIG.minMonthlyContribution}
          max={CALCULATOR_CONFIG.maxMonthlyContribution}
          sliderMax={2000}
          sliderStep={25}
        />

        {/* Navigation - Using shared Button component */}
        <div className={styles.navigation}>
          <Button variant="ghost" size="default" onClick={previousScreen}>
            <ChevronLeftIcon />
            {t('back')}
          </Button>
          <Button variant="primary" size="lg" onClick={nextScreen}>
            {t('continue')}
          </Button>
        </div>
      </div>
    </div>
  );
}
