'use client';

/**
 * Timeframe Screen
 *
 * Third screen - select projection timeframe
 */

import React from 'react';
import { useIntl } from 'react-intl';
import { useDreamMode } from '../DreamModeProvider';
import type { DreamInput } from '../types';
import styles from './screens.module.css';

type TimeframeOption = DreamInput['timeframe'];

interface TimeframeData {
  id: TimeframeOption;
  icon: string;
  multiplier: string;
}

const TIMEFRAMES: TimeframeData[] = [
  { id: '1week', icon: '⚡', multiplier: '7 days' },
  { id: '1month', icon: '📅', multiplier: '30 days' },
  { id: '1year', icon: '🎯', multiplier: '365 days' },
  { id: '5years', icon: '🚀', multiplier: '1,825 days' },
];

export function TimeframeScreen() {
  const intl = useIntl();
  const { state, setInput, nextScreen, previousScreen, startSimulation } = useDreamMode();

  const t = (key: string) => intl.formatMessage({ id: `dreamMode.timeframe.${key}` });

  const handleSelect = (timeframe: TimeframeOption) => {
    setInput({ timeframe });
  };

  const handleContinue = () => {
    startSimulation();
    nextScreen();
  };

  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        {/* Progress indicator */}
        <div className={styles.progress}>
          <div className={styles.progressDot} data-active="true" />
          <div className={styles.progressDot} data-active="true" />
          <div className={styles.progressDot} />
        </div>

        <h2 className={styles.headline}>{t('headline')}</h2>
        <p className={styles.subhead}>{t('subhead')}</p>

        {/* Timeframe options */}
        <div className={styles.optionGrid}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              onClick={() => handleSelect(tf.id)}
              className={`${styles.optionCard} ${state.input.timeframe === tf.id ? styles.selected : ''}`}
            >
              <span className={styles.optionIcon}>{tf.icon}</span>
              <span className={styles.optionLabel}>{t(`option.${tf.id}`)}</span>
              <span className={styles.optionMeta}>{tf.multiplier}</span>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className={styles.navigation}>
          <button onClick={previousScreen} className={styles.backButton}>
            <ChevronLeftIcon />
            {t('back')}
          </button>
          <button onClick={handleContinue} className={styles.primaryButton}>
            {t('startSimulation')}
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
