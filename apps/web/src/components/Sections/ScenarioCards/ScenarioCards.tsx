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
      <h2 className={styles.header}>{translated.section.title}</h2>
      <div className={styles.grid}>
        {translated.cards.map((card: { id: string; title: string; description: string; backgroundImage: string; imageAlt: string }) => (
          <ScenarioCard key={card.id} card={card} />
        ))}
      </div>
    </SectionContainer>
  );
});

ScenarioCards.displayName = 'ScenarioCards';
