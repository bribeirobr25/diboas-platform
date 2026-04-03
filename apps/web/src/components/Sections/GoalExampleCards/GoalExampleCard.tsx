'use client';

import { memo, useRef, useCallback } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import { Target, ShieldCheck, Gift, TrendingUp } from '@/components/UI/LucideIcon';
import { analyticsService } from '@/lib/analytics';
import type { SupportedLocale } from '@/lib/market-data';
import type { GoalCardKey } from '@/config/goalCards';
import { useGoalCardData } from './useGoalCardData';
import styles from './GoalExampleCards.module.css';

interface GoalExampleCardProps {
  cardKey: GoalCardKey;
  isExpanded: boolean;
  onToggle: (key: string) => void;
  onCollapse: () => void;
  onTryWithNumbers: () => void;
  enableAnalytics?: boolean;
}

const ICON_MAP = {
  retirement: Target,
  emergency: ShieldCheck,
  christmas: Gift,
  wealthy: TrendingUp,
} as const;

export const GoalExampleCard = memo(function GoalExampleCard({
  cardKey,
  isExpanded,
  onToggle,
  onCollapse,
  onTryWithNumbers,
  enableAnalytics = true,
}: GoalExampleCardProps) {
  const intl = useTranslation();
  const { locale: rawLocale } = useLocale();
  const locale = (rawLocale || 'en') as SupportedLocale;
  const cardRef = useRef<HTMLDivElement>(null);
  const Icon = ICON_MAP[cardKey];

  // Labels from translations, values computed from market data
  const t = (suffix: string) =>
    intl.formatMessage({ id: `landing-b2c.goalExamples.cards.${cardKey}.${suffix}` });

  const tShared = (key: string) =>
    intl.formatMessage({ id: `landing-b2c.goalExamples.${key}` });

  const computed = useGoalCardData(cardKey, locale);

  const handleClick = useCallback(() => {
    onToggle(cardKey);
    if (enableAnalytics) {
      analyticsService.track({
        name: 'goal_card_toggle',
        parameters: { card: cardKey, expanded: !isExpanded, locale: intl.locale },
      });
    }
  }, [cardKey, isExpanded, onToggle, enableAnalytics, intl.locale]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
      if (e.key === 'Escape' && isExpanded) {
        onCollapse();
      }
    },
    [handleClick, isExpanded, onCollapse]
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
    <div
      ref={cardRef}
      className={`${styles.card} ${isExpanded ? styles.cardExpanded : ''}`}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.cardHeader}>
        <Icon className={styles.cardIcon} aria-hidden="true" />
        <h3 className={styles.cardTitle}>
          {t('title')}
          <span className={styles.titleSummary}> {computed.titleSummary}</span>
        </h3>
        {!isExpanded ? (
          <span className={styles.expandIndicator} aria-hidden="true">+</span>
        ) : null}
      </div>

      <div
        className={styles.expandable}
        aria-hidden={!isExpanded}
      >
        <div className={styles.expandableInner}>
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
          <p className={styles.bankSource}>{t('bankSource')}</p>

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
          </div>
        </div>
      </div>
    </div>
  );
});

GoalExampleCard.displayName = 'GoalExampleCard';
