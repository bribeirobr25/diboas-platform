'use client';

import { memo, useCallback } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import { Palmtree, ShieldCheck, Gift, TrendingUp } from '@/components/UI/LucideIcon';
import { ExpandableCard } from '@/components/UI/ExpandableCard';
import { LocaleLink } from '@/components/UI/LocaleLink';
import { analyticsService } from '@/lib/analytics';
import { marketDataService, type SupportedLocale } from '@/lib/market-data';
import { formatRate } from '@/lib/market-data/formatters';
import type { GoalCardKey } from '@/config/goalCards';
import { useGoalCardData } from './useGoalCardData';
import styles from './GoalExampleCards.module.css';

/** Goal cards that have a dedicated standalone tool page (Phase 6C). */
const TOOL_LINK_BY_GOAL: Partial<Record<GoalCardKey, string>> = {
  retirement: '/tools/retirement',
  emergency: '/tools/emergency-fund',
};

interface GoalExampleCardProps {
  cardKey: GoalCardKey;
  isExpanded: boolean;
  onToggle: (key: string) => void;
  onTryWithNumbers: () => void;
  enableAnalytics?: boolean;
}

const ICON_MAP = {
  retirement: Palmtree,
  emergency: ShieldCheck,
  christmas: Gift,
  wealthy: TrendingUp,
} as const;

export const GoalExampleCard = memo(function GoalExampleCard({
  cardKey,
  isExpanded,
  onToggle,
  onTryWithNumbers,
  enableAnalytics = true,
}: GoalExampleCardProps) {
  const intl = useTranslation();
  const { locale: rawLocale } = useLocale();
  const locale = (rawLocale || 'en') as SupportedLocale;

  const t = (suffix: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `landing-b2c.goalExamples.cards.${cardKey}.${suffix}` }, values);

  const tShared = (key: string) =>
    intl.formatMessage({ id: `landing-b2c.goalExamples.${key}` });

  const expandLabel = intl.formatMessage({ id: 'common.expandable.showMore' });
  const collapseLabel = intl.formatMessage({ id: 'common.expandable.showLess' });

  const computed = useGoalCardData(cardKey, locale);

  const handleToggle = useCallback(
    (id: string) => {
      onToggle(id);
      if (enableAnalytics) {
        analyticsService.track({
          name: 'goal_card_toggle',
          parameters: { card: cardKey, expanded: !isExpanded, locale: intl.locale },
        });
      }
    },
    [cardKey, isExpanded, onToggle, enableAnalytics, intl.locale]
  );

  const handleTryWithNumbers = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onTryWithNumbers();
    },
    [onTryWithNumbers]
  );

  const handleHowPossible = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    document.getElementById('the-catch')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const differenceLabel = computed.isTimeBased ? tShared('less') : tShared('more');

  return (
    <ExpandableCard
      id={cardKey}
      icon={ICON_MAP[cardKey]}
      title={t('title')}
      titleSummary={computed.titleSummary}
      expandLabel={expandLabel}
      collapseLabel={collapseLabel}
      isExpanded={isExpanded}
      onToggle={handleToggle}
    >
      <p className={styles.cardSubtitle}>{t('subtitle')}</p>

      <div className={styles.resultBlock}>
        <p className={styles.resultLabel}>{tShared('withDiboas')}</p>
        <p className={styles.resultValue}>
          {computed.diboasResult}
          {computed.diboasTime ? <span className={styles.resultTime}> {computed.diboasTime}</span> : null}
        </p>
      </div>

      <div className={styles.resultBlock}>
        <p className={styles.resultLabel}>{tShared('yourBank')}</p>
        <p className={styles.resultValueBank}>
          {computed.bankResult}
          {computed.bankTime ? <span className={styles.resultTime}> {computed.bankTime}</span> : null}
        </p>
      </div>

      <div className={styles.differenceBlock}>
        <span className={styles.differenceValue}>{computed.difference}</span>
        <span className={styles.differenceLabel}>{differenceLabel}</span>
      </div>

      <p className={styles.tagline}>{t('tagline')}</p>
      <p className={styles.bankSource}>
        {/* Phase 7 PR-2 (2026-05-18): bank rate sourced from marketDataService
            single source of truth, NOT a translation-string literal. */}
        {t('bankSource', { rate: formatRate(marketDataService.getSync().rates.bankRates[locale].savings, locale) })}
      </p>

      <div className={styles.links}>
        <button
          type="button"
          className={styles.link}
          onClick={handleTryWithNumbers}
        >
          {t('seeAnother')}
        </button>
        <button
          type="button"
          className={styles.link}
          onClick={handleHowPossible}
        >
          {t('howPossible')}
        </button>
        {TOOL_LINK_BY_GOAL[cardKey] && (
          <LocaleLink
            href={TOOL_LINK_BY_GOAL[cardKey]!}
            className={styles.link}
            prefetch={false}
          >
            {tShared('openStandaloneTool')}
          </LocaleLink>
        )}
      </div>
    </ExpandableCard>
  );
});

GoalExampleCard.displayName = 'GoalExampleCard';
