'use client';

import { useTranslation } from '@diboas/i18n/client';
import { usePreDream } from '../PreDreamProvider';
import { PRE_DREAM_PATHS, type PreDreamPath } from '@/lib/pre-dream';
import styles from '../PreDream.module.css';

const PATH_STYLES: Record<
  PreDreamPath,
  { bg: string; text: string; border: string; iconBg: string }
> = {
  safety: {
    bg: styles.pathSafetyBg,
    text: styles.pathSafetyText,
    border: styles.pathSafetyBorder,
    iconBg: styles.pathSafetyIconBg,
  },
  balance: {
    bg: styles.pathBalanceBg,
    text: styles.pathBalanceText,
    border: styles.pathBalanceBorder,
    iconBg: styles.pathBalanceIconBg,
  },
  growth: {
    bg: styles.pathGrowthBg,
    text: styles.pathGrowthText,
    border: styles.pathGrowthBorder,
    iconBg: styles.pathGrowthIconBg,
  },
};

const PATH_ORDER: PreDreamPath[] = ['safety', 'balance', 'growth'];

export function PathSelectorScreen() {
  const intl = useTranslation();
  const { selectPath, goToScreen } = usePreDream();

  const t = (key: string) => intl.formatMessage({ id: `preDream.pathSelect.${key}` });

  return (
    <div className={styles.screenContent}>
      <div className={styles.screenHeader}>
        <h1 className={styles.screenTitle}>{t('title')}</h1>
        <p className={styles.screenSubtitle}>{t('subtitle')}</p>
      </div>

      <div className={styles.pathList}>
        {PATH_ORDER.map((pathId) => {
          const path = PRE_DREAM_PATHS[pathId];
          const pathStyle = PATH_STYLES[pathId];

          return (
            <button
              key={pathId}
              onClick={() => selectPath(pathId)}
              className={`${styles.pathCard} ${pathStyle.bg} ${pathStyle.border}`}
            >
              <div className={styles.pathCardContent}>
                <div className={`${styles.pathIcon} ${pathStyle.iconBg}`}>
                  {pathId === 'safety' && (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  )}
                  {pathId === 'balance' && (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="12" y1="20" x2="12" y2="10" />
                      <line x1="18" y1="20" x2="18" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="16" />
                    </svg>
                  )}
                  {pathId === 'growth' && (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  )}
                </div>
                <div className={styles.pathInfo}>
                  <h3 className={styles.pathName}>{t(`paths.${pathId}.name`)}</h3>
                  <p className={styles.pathDescription}>{t(`paths.${pathId}.description`)}</p>
                  <div className={styles.pathMeta}>
                    <span className={`${styles.pathRiskBadge} ${pathStyle.text}`}>
                      {t(`paths.${pathId}.riskLabel`)}
                    </span>
                    <span className={styles.pathApy}>{path.apy}% APY</span>
                    {pathId === 'growth' && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={styles.warningIcon}
                      >
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button onClick={() => goToScreen('welcome')} className={styles.backButton}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {t('back')}
      </button>
    </div>
  );
}
