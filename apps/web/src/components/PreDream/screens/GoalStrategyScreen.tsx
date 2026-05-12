'use client';

import { useTranslation } from '@diboas/i18n/client';
import { Palmtree, Gift, ShieldCheck, TrendingUp } from '@/components/UI/LucideIcon';
import { usePreDream } from '../PreDreamProvider';
import type { GoalCardKey } from '@/config/goalCards';
import styles from '../PreDream.module.css';

const GOALS: ReadonlyArray<{ key: GoalCardKey; icon: typeof Palmtree }> = [
  { key: 'retirement', icon: Palmtree },
  { key: 'christmas', icon: Gift },
  { key: 'emergency', icon: ShieldCheck },
  { key: 'wealthy', icon: TrendingUp },
];

export function GoalStrategyScreen() {
  const intl = useTranslation();
  const { selectGoal } = usePreDream();

  const t = (key: string) => intl.formatMessage({ id: `preDream.goalStrategy.${key}` });

  return (
    <div className={styles.screenCenter}>
      <div className={styles.screenCard}>
        <h1 className={styles.screenTitle}>{t('title')}</h1>
        <p className={styles.screenSubtitle}>{t('subtitle')}</p>

        <div className={styles.goalGrid}>
          {GOALS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => selectGoal(key)}
              className={styles.goalCard}
              aria-label={intl.formatMessage({ id: `preDream.goalStrategy.options.${key}.label` })}
            >
              <span className={styles.goalCardIcon}>
                <Icon size={28} strokeWidth={2} />
              </span>
              <span className={styles.goalCardLabel}>
                {intl.formatMessage({ id: `preDream.goalStrategy.options.${key}.label` })}
              </span>
              <span className={styles.goalCardCaption}>
                {intl.formatMessage({ id: `preDream.goalStrategy.options.${key}.caption` })}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
