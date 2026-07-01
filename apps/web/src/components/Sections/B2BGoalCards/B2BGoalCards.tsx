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
import { useLocale } from '@/components/Providers';
import { BarChart3, TrendingUp } from '@/components/UI/LucideIcon';
import { ExpandableCard } from '@/components/UI/ExpandableCard';
import { analyticsService } from '@/lib/analytics';
import { marketDataService, type SupportedLocale } from '@/lib/market-data';
import { formatRate } from '@/lib/market-data/formatters';
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
  /**
   * `numeric` (default) renders the with-diBoaS / your-bank / difference number
   * blocks. `qualitative` (the get-ready "Math" direction, Bar 2026-06-30) shows
   * only the narrative body + link — no dollar figures. The numeric i18n keys
   * (diboasResult/bankResult/difference/tagline/source) stay for parity but are
   * not read in qualitative mode.
   */
  variant?: 'numeric' | 'qualitative';
}

export const B2BGoalCards = memo(function B2BGoalCards({
  enableAnalytics = true,
  className = '',
  variant = 'numeric',
}: B2BGoalCardsProps) {
  const intl = useTranslation();
  const { locale: rawLocale } = useLocale();
  const locale = (rawLocale || 'en') as SupportedLocale;
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const handleToggle = useCallback((key: string) => {
    setExpandedCard((prev) => (prev === key ? null : key));
  }, []);

  // Auto-expand card when navigating via URL hash (e.g., from TwoWorlds CTA).
  // Reads window/location which is only available client-side, so this MUST
  // run after mount in an effect. The setState here is intentional —
  // navigating to /#paymentFees pre-opens the matching card.
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'paymentFees' || hash === 'idleCash') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const t = (
    cardKey: B2BCardKey,
    suffix: string,
    values?: Record<string, string | number | boolean | Date>
  ) => intl.formatMessage({ id: `${prefix}.cards.${cardKey}.${suffix}` }, values);

  const hasValue = (cardKey: B2BCardKey, suffix: string): boolean => {
    const id = `${prefix}.cards.${cardKey}.${suffix}`;
    const value = (intl.messages as Record<string, string>)?.[id];
    return typeof value === 'string' && value.length > 0;
  };

  const tShared = (key: string) => intl.formatMessage({ id: `${prefix}.${key}` });

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
                  parameters: {
                    card: cardKey,
                    expanded: expandedCard !== cardKey,
                    locale: intl.locale,
                  },
                });
              }
            }}
          >
            <p className={styles.cardSubtitle}>{t(cardKey, 'subtitle')}</p>

            {variant === 'numeric' ? (
              <>
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
                <p className={styles.bankSource}>
                  {/* Phase 7 Followup PR-4 (2026-05-19): idleCash.source's
                      bank-savings rate sourced live from marketDataService for
                      pt-BR/es/de (literals match `bankRates.{locale}.savings`).
                      EN's `3.5%` literal cites a different metric (Bankrate
                      high-yield) and is not migrated — see §9 carry-forward. */}
                  {t(cardKey, 'source', {
                    rate: formatRate(
                      marketDataService.getSync().rates.bankRates[locale].savings,
                      locale
                    ),
                  })}
                </p>
              </>
            ) : null}

            <div className={styles.links}>
              <button type="button" className={styles.link} onClick={handleHowPossible}>
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
