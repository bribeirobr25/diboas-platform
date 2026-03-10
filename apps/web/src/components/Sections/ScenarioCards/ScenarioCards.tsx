'use client';

import { memo } from 'react';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { useConfigTranslation } from '@/lib/i18n/config-translator';
import { ScenarioCard } from './components/ScenarioCard';
import type { ScenarioCardsConfig } from '@/config/scenarioCards';
import styles from './ScenarioCards.module.css';

interface ScenarioCardsProps {
  config: ScenarioCardsConfig;
  enableAnalytics?: boolean;
  className?: string;
}

export const ScenarioCards = memo(function ScenarioCards({
  config,
  enableAnalytics = true,
  className = '',
}: ScenarioCardsProps) {
  const translated = useConfigTranslation(config);

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      ariaLabel={translated.seo.ariaLabel}
      className={className}
    >
      {translated.section.transitionHook ? (
        <p className={styles.transitionHook}>{translated.section.transitionHook}</p>
      ) : null}
      <h2 className={styles.header}>{translated.section.title}</h2>
      <div className={styles.grid}>
        {translated.cards.map((card: { id: string; title: string; description: string; backgroundImage: string; imageAlt: string; costComparison?: string }) => (
          <ScenarioCard key={card.id} card={card} />
        ))}
      </div>
      {translated.section.clarificationLine ? (
        <p className={styles.clarificationLine}>{translated.section.clarificationLine}</p>
      ) : null}
      {translated.section.footnote ? (
        <p className={styles.footnote}>{translated.section.footnote}</p>
      ) : null}
    </SectionContainer>
  );
});

ScenarioCards.displayName = 'ScenarioCards';
