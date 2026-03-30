'use client';

import { memo, useRef, useCallback } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { Target, ShieldCheck, Gift, TrendingUp } from '@/components/UI/LucideIcon';
import { analyticsService } from '@/lib/analytics';
import styles from './GoalExampleCards.module.css';

interface GoalExampleCardProps {
  cardKey: 'retirement' | 'emergency' | 'christmas' | 'wealthy';
  isExpanded: boolean;
  onToggle: (key: string) => void;
  onCollapse: () => void;
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
  enableAnalytics = true,
}: GoalExampleCardProps) {
  const intl = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const Icon = ICON_MAP[cardKey];

  const t = (suffix: string) =>
    intl.formatMessage({ id: `landing-b2c.goalExamples.cards.${cardKey}.${suffix}` });

  const tShared = (key: string) =>
    intl.formatMessage({ id: `landing-b2c.goalExamples.${key}` });

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

  const handleSeeAnother = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onCollapse();
    },
    [onCollapse]
  );

  const handleHowPossible = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    document.getElementById('the-catch')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const differenceLabel = cardKey === 'emergency' ? tShared('less') : tShared('more');

  // Time-based cards (e.g. emergency) may have diboasTime/bankTime keys
  const diboasTimeRaw = t('diboasTime');
  const bankTimeRaw = t('bankTime');
  const diboasTime = diboasTimeRaw.includes('.') ? '' : diboasTimeRaw;
  const bankTime = bankTimeRaw.includes('.') ? '' : bankTimeRaw;

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
          {!isExpanded ? (
            <span className={styles.titleSummary}> {t('titleSummary')}</span>
          ) : null}
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
              {t('diboasResult')}
              {diboasTime ? <span className={styles.resultTime}> {diboasTime}</span> : null}
            </p>
          </div>

          <div className={styles.resultBlock}>
            <p className={styles.resultLabel}>{tShared('yourBank')}</p>
            <p className={styles.resultValueBank}>
              {t('bankResult')}
              {bankTime ? <span className={styles.resultTime}> {bankTime}</span> : null}
            </p>
          </div>

          <div className={styles.differenceBlock}>
            <span className={styles.differenceValue}>{t('difference')}</span>
            <span className={styles.differenceLabel}>{differenceLabel}</span>
          </div>

          <p className={styles.tagline}>{t('tagline')}</p>
          <p className={styles.bankSource}>{t('bankSource')}</p>

          <div className={styles.links}>
            <button
              type="button"
              className={styles.link}
              onClick={handleSeeAnother}
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
