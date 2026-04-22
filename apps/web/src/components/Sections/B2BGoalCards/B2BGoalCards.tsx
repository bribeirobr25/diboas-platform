'use client';

/**
 * B2B Goal Cards
 *
 * Pre-fixed business scenario cards matching the B2C GoalExampleCards pattern.
 * Two expandable cards: Payment Fees and Idle Cash — no interactive calculator,
 * all values are pre-computed from fixed business scenarios.
 */

import { memo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { BarChart3, TrendingUp } from '@/components/UI/LucideIcon';
import { ExpandableCard } from '@/components/UI/ExpandableCard';
import { analyticsService } from '@/lib/analytics';
import styles from '../GoalExampleCards/GoalExampleCards.module.css';

type B2BCardKey = 'paymentFees' | 'idleCash';

const CARD_KEYS: B2BCardKey[] = ['paymentFees', 'idleCash'];

const ICON_MAP = {
  paymentFees: BarChart3,
  idleCash: TrendingUp,
} as const;

interface B2BGoalCardsProps {
  enableAnalytics?: boolean;
  className?: string;
}

export const B2BGoalCards = memo(function B2BGoalCards({
  enableAnalytics = true,
  className = '',
}: B2BGoalCardsProps) {
  const intl = useTranslation();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const handleToggle = useCallback((key: string) => {
    setExpandedCard((prev) => (prev === key ? null : key));
  }, []);

  // Auto-expand card when navigating via URL hash (e.g., from TwoWorlds CTA)
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'paymentFees' || hash === 'idleCash') {
      setExpandedCard(hash);
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, []);

  const handleHowPossible = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const heading = intl.formatMessage({ id: 'landing-b2b.b2bGoals.heading' });
  const ariaLabel = intl.formatMessage({ id: 'landing-b2b.b2bGoals.ariaLabel' });
  const expandLabel = intl.formatMessage({ id: 'common.expandable.showMore' });
  const collapseLabel = intl.formatMessage({ id: 'common.expandable.showLess' });

  const prefix = 'landing-b2b.b2bGoals';

  const t = (cardKey: B2BCardKey, suffix: string) =>
    intl.formatMessage({ id: `${prefix}.cards.${cardKey}.${suffix}` });

  const hasValue = (cardKey: B2BCardKey, suffix: string): boolean => {
    const id = `${prefix}.cards.${cardKey}.${suffix}`;
    const value = (intl.messages as Record<string, string>)?.[id];
    return typeof value === 'string' && value.length > 0;
  };

  const tShared = (key: string) =>
    intl.formatMessage({ id: `${prefix}.${key}` });

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      ariaLabel={ariaLabel}
      className={className}
    >
      <h2 className={styles.heading}>{heading}</h2>
      <div className={styles.grid}>
        {CARD_KEYS.map((cardKey) => (
          <ExpandableCard
            key={cardKey}
            id={cardKey}
            icon={ICON_MAP[cardKey]}
            title={t(cardKey, 'title')}
            titleSummary={t(cardKey, 'titleSummary')}
            expandLabel={expandLabel}
            collapseLabel={collapseLabel}
            isExpanded={expandedCard === cardKey}
            onToggle={(id) => {
              handleToggle(id);
              if (enableAnalytics) {
                analyticsService.track({
                  name: 'b2b_goal_card_toggle',
                  parameters: { card: cardKey, expanded: expandedCard !== cardKey, locale: intl.locale },
                });
              }
            }}
          >
            <p className={styles.cardSubtitle}>{t(cardKey, 'subtitle')}</p>

            <div className={styles.resultBlock}>
              <p className={styles.resultLabel}>{tShared('withDiboas')}</p>
              <p className={styles.resultValue}>{t(cardKey, 'diboasResult')}</p>
            </div>

            {hasValue(cardKey, 'bankResult') ? (
              <div className={styles.resultBlock}>
                <p className={styles.resultLabel}>{tShared('yourBank')}</p>
                <p className={styles.resultValueBank}>{t(cardKey, 'bankResult')}</p>
              </div>
            ) : null}

            <div className={styles.differenceBlock}>
              <span className={styles.differenceValue}>{t(cardKey, 'difference')}</span>
              <span className={styles.differenceLabel}>{tShared('more')}</span>
            </div>

            <p className={styles.tagline}>{t(cardKey, 'tagline')}</p>
            <p className={styles.bankSource}>{t(cardKey, 'source')}</p>

            <div className={styles.links}>
              <button
                type="button"
                className={styles.link}
                onClick={handleHowPossible}
              >
                {t(cardKey, 'howPossible')}
              </button>
            </div>
          </ExpandableCard>
        ))}
      </div>
    </SectionContainer>
  );
});

B2BGoalCards.displayName = 'B2BGoalCards';
