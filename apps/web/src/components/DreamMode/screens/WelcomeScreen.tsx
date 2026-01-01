'use client';

/**
 * Welcome Screen
 *
 * First screen of Dream Mode - introduces the simulation
 */

import React from 'react';
import { useIntl } from 'react-intl';
import { useDreamMode } from '../DreamModeProvider';
import styles from './screens.module.css';

export function WelcomeScreen() {
  const intl = useIntl();
  const { nextScreen } = useDreamMode();

  const t = (key: string) => intl.formatMessage({ id: `dreamMode.welcome.${key}` });

  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        {/* Animated icon */}
        <div className={styles.iconWrapper}>
          <div className={styles.dreamIcon}>
            <MoonIcon />
          </div>
        </div>

        {/* Headlines */}
        <h1 className={styles.headline}>{t('headline')}</h1>
        <p className={styles.subhead}>{t('subhead')}</p>

        {/* Feature list */}
        <ul className={styles.featureList}>
          <li>{t('feature1')}</li>
          <li>{t('feature2')}</li>
          <li>{t('feature3')}</li>
        </ul>

        {/* CTA */}
        <button onClick={nextScreen} className={styles.primaryButton}>
          {t('cta')}
        </button>

        {/* Disclaimer */}
        <p className={styles.disclaimer}>{t('disclaimer')}</p>
      </div>
    </div>
  );
}

function MoonIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
