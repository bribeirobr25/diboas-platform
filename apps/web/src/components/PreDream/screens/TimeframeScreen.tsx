'use client';

import { useTranslation } from '@diboas/i18n/client';
import { usePreDream } from '../PreDreamProvider';
import { type PreDreamTimeframe } from '@/lib/pre-dream';
import styles from '../PreDream.module.css';

const TIMEFRAME_ORDER: PreDreamTimeframe[] = ['1year', '3years', '5years', '10years'];

export function TimeframeScreen() {
  const intl = useTranslation();
  const { state, selectTimeframe, startSimulation, goToScreen } = usePreDream();

  const t = (key: string) => intl.formatMessage({ id: `preDream.timeframe.${key}` });

  return (
    <div className={styles.screenContent}>
      <div className={styles.screenHeader}>
        <h1 className={styles.screenTitle}>{t('title')}</h1>
      </div>

      <div className={styles.timeframeGrid}>
        {TIMEFRAME_ORDER.map((key) => {
          const isSelected = state.selectedTimeframe === key;

          return (
            <button
              key={key}
              onClick={() => selectTimeframe(key)}
              className={`${styles.timeframeCard} ${isSelected ? styles.timeframeCardSelected : ''}`}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={isSelected ? styles.timeframeIconSelected : styles.timeframeIcon}
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <p
                className={`${styles.timeframeLabel} ${isSelected ? styles.timeframeLabelSelected : ''}`}
              >
                {/* i18n label, not the hardcoded English `PRE_DREAM_TIMEFRAMES[key].label`
                    (which leaked "1 Year"/"10 Years" onto pt-BR/es/de). The translated
                    labels already exist under preDream.timeframe.options.*.label. */}
                {intl.formatMessage({ id: `preDream.timeframe.options.${key}.label` })}
              </p>
              <p className={styles.timeframeDays}>
                {/* i18n days string — already locale-formatted per locale (e.g. "1.095
                    dias" on pt-BR), unlike tf.days.toLocaleString() which used the
                    runtime-default (en) thousands separators on every locale. */}
                {intl.formatMessage({ id: `preDream.timeframe.options.${key}.days` })}
              </p>
            </button>
          );
        })}
      </div>

      <div className={styles.buttonRow}>
        <button onClick={() => goToScreen('input')} className={styles.secondaryButton}>
          {t('back')}
        </button>
        <button onClick={startSimulation} className={styles.primaryButton}>
          {t('simulateButton')}
        </button>
      </div>
    </div>
  );
}
