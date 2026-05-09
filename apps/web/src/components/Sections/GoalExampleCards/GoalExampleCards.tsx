'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useTranslation } from '@diboas/i18n/client';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { analyticsService } from '@/lib/analytics';
import { GoalExampleCard } from './GoalExampleCard';
import styles from './GoalExampleCards.module.css';

const PreDream = dynamic(
  () => import('@/components/PreDream').then(m => ({ default: m.PreDream })),
  { ssr: false, loading: () => null }
);

interface GoalExampleCardsProps {
  enableAnalytics?: boolean;
  className?: string;
}

const CARD_KEYS = ['wealthy', 'christmas', 'retirement', 'emergency'] as const;

export const GoalExampleCards = memo(function GoalExampleCards({
  enableAnalytics = true,
  className = '',
}: GoalExampleCardsProps) {
  const intl = useTranslation();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showPreDream, setShowPreDream] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // Portal target for PreDream — must render outside ScrollReveal's transform
  // stacking context to allow position:fixed to work relative to viewport.
  // SSR renders portalContainer=null; client mount flips it to document.body.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPortalContainer(document.body);
  }, []);

  const handleToggle = useCallback((key: string) => {
    setExpandedCard((prev) => (prev === key ? null : key));
  }, []);

  const handleTryWithNumbers = useCallback(() => {
    setShowPreDream(true);
    if (enableAnalytics) {
      analyticsService.track({
        name: 'goal_card_try_numbers_click',
        parameters: { locale: intl.locale },
      });
    }
  }, [enableAnalytics, intl.locale]);

  const handlePreDreamClose = useCallback(() => {
    setShowPreDream(false);
  }, []);

  const heading = intl.formatMessage({ id: 'landing-b2c.goalExamples.heading' });
  const ariaLabel = intl.formatMessage({ id: 'landing-b2c.sections.goalExamples.ariaLabel' });

  return (
    <>
      <SectionContainer
        variant="standard"
        padding="standard"
        ariaLabel={ariaLabel}
        className={className}
      >
        <h2 className={styles.heading}>{heading}</h2>
        <div className={styles.grid}>
          {CARD_KEYS.map((key) => (
            <GoalExampleCard
              key={key}
              cardKey={key}
              isExpanded={expandedCard === key}
              onToggle={handleToggle}
              onTryWithNumbers={handleTryWithNumbers}
              enableAnalytics={enableAnalytics}
            />
          ))}
        </div>
      </SectionContainer>

      {showPreDream && portalContainer ? createPortal(
        <PreDream
          onClose={handlePreDreamClose}
          onBackToHome={handlePreDreamClose}
        />,
        portalContainer
      ) : null}
    </>
  );
});

GoalExampleCards.displayName = 'GoalExampleCards';
