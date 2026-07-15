'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/config';
import { analyticsService } from '@/lib/analytics';
import { LESSON_EVENTS } from '@/lib/learn';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { CinematicHeroFactory } from '@/components/Sections/CinematicHero';
import { TalkArcFactory } from '@/components/Sections/TalkArc';
import styles from './LearnIndex.module.css';

interface LearnIndexProps {
  enableAnalytics?: boolean;
}

export function LearnIndex({ enableAnalytics = true }: LearnIndexProps) {
  const intl = useTranslation();
  const locale: SupportedLocale = isValidLocale(intl.locale) ? intl.locale : 'en';

  const indexViewedRef = useRef(false);
  useEffect(() => {
    if (!enableAnalytics || indexViewedRef.current) return;
    indexViewedRef.current = true;
    analyticsService.track({
      name: LESSON_EVENTS.INDEX_VIEWED,
      parameters: { locale, timestamp: Date.now() },
    });
  }, [enableAnalytics, locale]);

  const t = (key: string) => intl.formatMessage({ id: `learn.${key}` });

  return (
    <article className={styles.page}>
      <CinematicHeroFactory
        scene="fluid"
        theme="lighter"
        align="center"
        sectionId="hero-learn"
        headline={t('index.h1')}
        accentHeadline
        subheadline={t('index.subhead')}
        priority
      />

      {/* Phase 2 (learn redesign plan): the hardcoded Talk-1 card + the legacy
       * coming-soon roadmap are replaced by the registry-driven TalkArc (live
       * cards keep the W7 prefetch={false} trade inside the arc). */}
      <SectionContainer variant="standard" padding="standard" as="section">
        <div className={styles.arcBlock}>
          <TalkArcFactory enableAnalytics={enableAnalytics} />
        </div>
      </SectionContainer>

      <SectionContainer variant="standard" padding="standard" as="section">
        <p className={styles.footerLine}>{t('index.footerLine')}</p>
      </SectionContainer>
    </article>
  );
}
