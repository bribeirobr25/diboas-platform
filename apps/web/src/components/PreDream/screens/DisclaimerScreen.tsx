'use client';

import { useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { usePreDream } from '../PreDreamProvider';
import styles from '../PreDream.module.css';

export function DisclaimerScreen() {
  const intl = useTranslation();
  const { acceptDisclaimer } = usePreDream();
  const [accepted, setAccepted] = useState(false);

  const t = (key: string) => intl.formatMessage({ id: `preDream.disclaimer.${key}` });

  return (
    <div className={styles.screenCenter}>
      <div className={styles.screenCard}>
        <div className={styles.iconCircleAmber}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h1 className={styles.screenTitle}>{t('title')}</h1>

        <div className={styles.disclaimerCard}>
          <p className={styles.textSecondary}>{t('description')}</p>
          <ul className={styles.bulletList}>
            <li>• {t('bullets.noMoney')}</li>
            <li>• {t('bullets.notAdvice')}</li>
            <li>• {t('bullets.pastPerformance')}</li>
          </ul>
          <p className={styles.legalNotice}>{t('legalNotice')}</p>
        </div>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className={styles.checkbox}
          />
          <span className={styles.checkboxText}>{t('acceptLabel')}</span>
        </label>

        <button
          onClick={acceptDisclaimer}
          disabled={!accepted}
          className={styles.primaryButton}
        >
          {t('enterButton')}
        </button>
      </div>
    </div>
  );
}
