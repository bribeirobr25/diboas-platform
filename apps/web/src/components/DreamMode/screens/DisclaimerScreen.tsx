'use client';

/**
 * Disclaimer Screen (Screen 0)
 *
 * CLO-required disclaimer gate before entering Dream Mode
 * User must check checkbox to proceed
 *
 * Service Agnostic Abstraction: Uses centralized translation hook
 * Code Reusability & DRY: No inline translation helpers
 */

import React, { useState } from 'react';
import { useDreamMode } from '../DreamModeProvider';
import { useDreamModeTranslation, useRegionalDisclaimer } from '../hooks';
import { AlertTriangleIcon } from '@/components/Icons';
import styles from './screens.module.css';

export function DisclaimerScreen() {
  const { getTranslator, tCommon } = useDreamModeTranslation();
  const { acceptDisclaimer } = useDreamMode();
  const { disclaimerText, enhancedDisclaimer, hasEnhancedDisclaimer } = useRegionalDisclaimer();
  const [isChecked, setIsChecked] = useState(false);

  const t = getTranslator('disclaimer');

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
          <AlertTriangleIcon size={32} className={styles.disclaimerIcon} aria-label={tCommon('accessibility.warning')} />
          <h2 className={styles.disclaimerHeadline}>{t('headline')}</h2>
        </div>

        {/* Disclaimer text box */}
        <div id="disclaimer-content" className={styles.disclaimerBody}>
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
        <label htmlFor="disclaimer-checkbox" className={styles.disclaimerCheckbox}>
          <input
            id="disclaimer-checkbox"
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className={styles.checkbox}
            data-testid="disclaimer-checkbox"
            aria-describedby="disclaimer-content"
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
