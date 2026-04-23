'use client';

import { useTranslation } from '@diboas/i18n/client';
import { Check } from '@/components/UI/LucideIcon';
import { usePreDream } from '../PreDreamProvider';
import styles from '../PreDream.module.css';

export function WelcomeScreen() {
  const intl = useTranslation();
  const { goToScreen } = usePreDream();

  const t = (key: string) => intl.formatMessage({ id: `preDream.welcome.${key}` });

  return (
    <div className={styles.screenCenter}>
      <div className={styles.screenCard}>
        <div className={styles.iconCircleTeal}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>

        <h1 className={styles.screenTitle}>{t('title')}</h1>
        <p className={styles.screenSubtitle}>{t('subtitle')}</p>

        <div className={styles.featureList}>
          <div className={styles.featureItem}>
            <span className={styles.featureCheck}><Check size={16} strokeWidth={2} /></span>
            <span>{t('features.strategies')}</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureCheck}><Check size={16} strokeWidth={2} /></span>
            <span>{t('features.projections')}</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureCheck}><Check size={16} strokeWidth={2} /></span>
            <span>{t('features.comparison')}</span>
          </div>
        </div>

        <button
          onClick={() => goToScreen('pathSelect')}
          className={styles.primaryButton}
        >
          {t('exploreButton')}
        </button>
      </div>
    </div>
  );
}
