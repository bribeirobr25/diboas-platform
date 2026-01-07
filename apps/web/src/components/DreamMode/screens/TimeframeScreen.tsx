'use client';

/**
 * Timeframe Screen
 *
 * Third screen - select projection timeframe
 *
 * Service Agnostic Abstraction: Uses centralized translation hook
 * Code Reusability & DRY: No inline translation helpers
 */

import React from 'react';
import { useDreamMode } from '../DreamModeProvider';
import { useDreamModeTranslation } from '../hooks';
import { TimeframeIcon, type TimeframeIconType } from '@/components/Icons';
import type { DreamInput } from '../types';
import styles from './screens.module.css';

type TimeframeOption = DreamInput['timeframe'];

interface TimeframeData {
  id: TimeframeOption;
  iconType: TimeframeIconType;
  multiplier: string;
}

const TIMEFRAMES: TimeframeData[] = [
  { id: '1week', iconType: 'lightning', multiplier: '7 days' },
  { id: '1month', iconType: 'calendar', multiplier: '30 days' },
  { id: '1year', iconType: 'target', multiplier: '365 days' },
  { id: '5years', iconType: 'rocket', multiplier: '1,825 days' },
];

export function TimeframeScreen() {
  const { getTranslator } = useDreamModeTranslation();
  const { state, setInput, nextScreen, previousScreen, startSimulation } = useDreamMode();

  const t = getTranslator('timeframe');

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
              <span className={styles.optionIcon}><TimeframeIcon type={tf.iconType} size={24} /></span>
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
