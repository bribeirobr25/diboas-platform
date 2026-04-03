'use client';

/**
 * StrategiesCardsSection
 *
 * Renders all 10 strategy cards using the shared ExpandableCard pattern.
 * Cards show name + badge + key stat in collapsed state.
 * Multi-expand: users can expand multiple cards to compare side by side.
 */

import { useTranslation } from '@diboas/i18n/client';
import { ExpandableCard, ExpandableCardGrid } from '@/components/UI/ExpandableCard';
import styles from './StrategiesPageContent.module.css';

const I18N_PREFIX = 'marketing.pages.strategies';

const STRATEGY_ORDER = [
  'safeHarbor',
  'stableGrowth',
  'goalKeeper',
  'steadyProgress',
  'patientBuilder',
  'balancedBuilder',
  'steadyCompounder',
  'wealthAccelerator',
  'yieldMaximizer',
  'fullThrottle',
] as const;

const GROWTH_EXPOSURE: Record<string, number> = {
  safeHarbor: 0,
  stableGrowth: 30,
  goalKeeper: 0,
  steadyProgress: 35,
  patientBuilder: 0,
  balancedBuilder: 40,
  steadyCompounder: 0,
  wealthAccelerator: 70,
  yieldMaximizer: 0,
  fullThrottle: 85,
};

const STRATEGY_OPTIONAL_FIELDS: Record<string, {
  hasNote?: boolean;
  hasWarning?: boolean;
  hasAccessRequirements?: boolean;
  hasDescription2?: boolean;
}> = {
  safeHarbor: { hasDescription2: true },
  stableGrowth: { hasDescription2: true, hasNote: true },
  goalKeeper: { hasDescription2: true },
  steadyProgress: {},
  patientBuilder: {},
  balancedBuilder: {},
  steadyCompounder: {},
  wealthAccelerator: { hasDescription2: true, hasWarning: true },
  yieldMaximizer: {},
  fullThrottle: { hasDescription2: true, hasWarning: true, hasAccessRequirements: true },
};

export function StrategiesCardsSection() {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });
  const expandLabel = intl.formatMessage({ id: 'common.expandable.showMore' });
  const collapseLabel = intl.formatMessage({ id: 'common.expandable.showLess' });

  return (
    <>
      <h2 className={styles.sectionTitle}>
        {t('allStrategiesHeader')}
      </h2>

      <ExpandableCardGrid multiExpand={true} className={styles.cardsGrid}>
        {({ isExpanded, onToggle }) => (
          <>
            {STRATEGY_ORDER.map((strategyId) => {
              const optionals = STRATEGY_OPTIONAL_FIELDS[strategyId] || {};
              const growth = GROWTH_EXPOSURE[strategyId];
              const typicalReturn = t(`strategies.${strategyId}.stats.typicalReturn`);
              const badge = t(`strategies.${strategyId}.badge`);

              return (
                <ExpandableCard
                  key={strategyId}
                  id={strategyId}
                  title={t(`strategies.${strategyId}.name`)}
                  titleSummary={typicalReturn}
                  expandLabel={expandLabel}
                  collapseLabel={collapseLabel}
                  isExpanded={isExpanded(strategyId)}
                  onToggle={onToggle}
                >
                  {/* Badge + Tagline */}
                  <p className={styles.strategyBadge}>{badge}</p>
                  <p className={styles.strategyTagline}>{t(`strategies.${strategyId}.tagline`)}</p>

                  {/* Growth exposure */}
                  {growth > 0 ? (
                    <p className={styles.strategyGrowth}>
                      {growth}% {t('growthBadge')}
                    </p>
                  ) : null}

                  {/* Stats grid */}
                  <div className={styles.strategyStats}>
                    <div className={styles.strategyStat}>
                      <span className={styles.strategyStatLabel}>{t('statsLabels.lossChance')}:</span>
                      <span className={styles.strategyStatValue}>{t(`strategies.${strategyId}.stats.lossChance`)}</span>
                    </div>
                    <div className={styles.strategyStat}>
                      <span className={styles.strategyStatLabel}>{t('statsLabels.typicalReturn')}:</span>
                      <span className={styles.strategyStatValue}>{typicalReturn}</span>
                    </div>
                    <div className={styles.strategyStat}>
                      <span className={styles.strategyStatLabel}>{t('statsLabels.bumpiness')}:</span>
                      <span className={styles.strategyStatValue}>{t(`strategies.${strategyId}.stats.bumpiness`)}</span>
                    </div>
                    <div className={styles.strategyStat}>
                      <span className={styles.strategyStatLabel}>{t('statsLabels.riskLevel')}:</span>
                      <span className={styles.strategyStatValue}>{t(`strategies.${strategyId}.riskLevel`)}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className={styles.strategyDescription}>{t(`strategies.${strategyId}.description`)}</p>
                  {optionals.hasDescription2 ? (
                    <p className={styles.strategyDescription}>{t(`strategies.${strategyId}.description2`)}</p>
                  ) : null}

                  {/* Allocation */}
                  <div className={styles.strategyAllocation}>
                    <p className={styles.strategyAllocationText}>{t(`strategies.${strategyId}.allocation`)}</p>
                    <p className={styles.strategyAllocationNote}>{t(`strategies.${strategyId}.allocationNote`)}</p>
                  </div>

                  {/* Common use case */}
                  <p className={styles.strategyUseCase}>{t(`strategies.${strategyId}.commonUseCase`)}</p>

                  {/* Optional: Note, Warning, Access Requirements */}
                  {optionals.hasNote ? (
                    <p className={styles.strategyNote}>{t(`strategies.${strategyId}.note`)}</p>
                  ) : null}
                  {optionals.hasWarning ? (
                    <div className={styles.strategyWarning}>{t(`strategies.${strategyId}.warning`)}</div>
                  ) : null}
                  {optionals.hasAccessRequirements ? (
                    <div className={styles.strategyAccess}>{t(`strategies.${strategyId}.accessRequirements`)}</div>
                  ) : null}
                </ExpandableCard>
              );
            })}
          </>
        )}
      </ExpandableCardGrid>

      <p className={styles.honestLimitation}>
        {t('allCardsHonestLimitation')}
      </p>
    </>
  );
}
