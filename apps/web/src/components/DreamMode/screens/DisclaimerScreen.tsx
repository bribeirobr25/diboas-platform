'use client';

/**
 * Disclaimer Screen (Screen 0)
 *
 * CLO-required disclaimer gate before entering Dream Mode
 * User must check checkbox to proceed
 */

import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { useDreamMode } from '../DreamModeProvider';
import { useRegionalDisclaimer } from '../hooks/useRegionalDisclaimer';
import styles from './screens.module.css';

export function DisclaimerScreen() {
  const intl = useIntl();
  const { acceptDisclaimer } = useDreamMode();
  const { disclaimerText, enhancedDisclaimer, hasEnhancedDisclaimer } = useRegionalDisclaimer();
  const [isChecked, setIsChecked] = useState(false);

  const t = (key: string) => intl.formatMessage({ id: `dreamMode.disclaimer.${key}` });

  const handleAccept = () => {
    if (isChecked) {
      acceptDisclaimer();
    }
  };

  return (
    <div className={styles.disclaimerOverlay}>
      <div className={styles.disclaimerCard}>
        {/* Warning icon and headline */}
        <div className={styles.disclaimerHeader}>
          <span className={styles.disclaimerIcon}>⚠️</span>
          <h2 className={styles.disclaimerHeadline}>{t('headline')}</h2>
        </div>

        {/* Disclaimer text box */}
        <div className={styles.disclaimerBody}>
          <p className={styles.disclaimerText}>{disclaimerText}</p>

          {/* Bullet points */}
          <ul className={styles.disclaimerBullets}>
            <li>{t('bullets.no_money')}</li>
            <li>{t('bullets.not_advice')}</li>
            <li>{t('bullets.past_performance')}</li>
          </ul>

          {/* Enhanced disclaimer for US/Brazil */}
          {hasEnhancedDisclaimer && enhancedDisclaimer && (
            <div className={styles.enhancedDisclaimer}>
              <p>{enhancedDisclaimer}</p>
            </div>
          )}
        </div>

        {/* Checkbox */}
        <label className={styles.disclaimerCheckbox}>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className={styles.checkbox}
            data-testid="disclaimer-checkbox"
          />
          <span className={styles.checkboxLabel}>{t('checkbox')}</span>
        </label>

        {/* CTA Button */}
        <button
          onClick={handleAccept}
          disabled={!isChecked}
          className={`${styles.disclaimerCta} ${isChecked ? styles.disclaimerCtaEnabled : ''}`}
          data-testid="disclaimer-cta"
        >
          {t('cta')}
        </button>
      </div>
    </div>
  );
}
