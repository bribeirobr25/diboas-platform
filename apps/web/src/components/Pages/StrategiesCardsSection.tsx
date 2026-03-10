'use client';

/**
 * StrategiesCardsSection
 *
 * Renders all 10 strategy cards in matrix order (stable-then-growth per row).
 * Uses config-driven optional fields map to avoid calling t() for missing keys.
 */

import { useTranslation } from '@diboas/i18n/client';
import { StrategyCard } from '@/components/UI';
import styles from './StrategiesPageContent.module.css';

const I18N_PREFIX = 'marketing.pages.strategies';

/**
 * Card render order follows matrix sequence: top-to-bottom, stable-then-growth.
 */
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

/**
 * Config-driven map of which optional fields each strategy has.
 * Verified against FINAL EN copy.
 */
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
  return (
    <>
      <h2 className={styles.sectionTitle}>
        {t('allStrategiesHeader')}
      </h2>

      <div className={styles.cardsGrid}>
        {STRATEGY_ORDER.map((strategyId) => {
          const optionals = STRATEGY_OPTIONAL_FIELDS[strategyId] || {};
          return (
            <StrategyCard
              key={strategyId}
              strategyId={strategyId}
              name={t(`strategies.${strategyId}.name`)}
              badge={t(`strategies.${strategyId}.badge`)}
              tagline={t(`strategies.${strategyId}.tagline`)}
              growthExposure={GROWTH_EXPOSURE[strategyId]}
              growthBadgeLabel={t('growthBadge')}
              description={t(`strategies.${strategyId}.description`)}
              description2={optionals.hasDescription2 ? t(`strategies.${strategyId}.description2`) : undefined}
              allocation={t(`strategies.${strategyId}.allocation`)}
              allocationNote={t(`strategies.${strategyId}.allocationNote`)}
              commonUseCase={t(`strategies.${strategyId}.commonUseCase`)}
              note={optionals.hasNote ? t(`strategies.${strategyId}.note`) : undefined}
              warning={optionals.hasWarning ? t(`strategies.${strategyId}.warning`) : undefined}
              accessRequirements={optionals.hasAccessRequirements ? t(`strategies.${strategyId}.accessRequirements`) : undefined}
              showMoreLabel={t('card.showMore')}
              showLessLabel={t('card.showLess')}
              stats={[
                { label: t('statsLabels.lossChance'), value: t(`strategies.${strategyId}.stats.lossChance`) },
                { label: t('statsLabels.typicalReturn'), value: t(`strategies.${strategyId}.stats.typicalReturn`) },
                { label: t('statsLabels.bumpiness'), value: t(`strategies.${strategyId}.stats.bumpiness`) },
                { label: t('statsLabels.riskLevel'), value: t(`strategies.${strategyId}.riskLevel`) },
              ]}
            />
          );
        })}
      </div>

      <p className={styles.honestLimitation}>
        {t('allCardsHonestLimitation')}
      </p>
    </>
  );
}
