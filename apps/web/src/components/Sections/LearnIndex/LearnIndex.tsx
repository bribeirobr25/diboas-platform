'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/config';
import { analyticsService } from '@/lib/analytics';
import { LESSON_EVENTS } from '@/lib/learn';
import { LocaleLink } from '@/components/UI/LocaleLink';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { LessonRoadmap } from '@/components/Sections/LessonRoadmap';
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
      <SectionContainer variant="standard" padding="standard" as="section">
        <div className={styles.header}>
          <h1 className={styles.h1}>{t('index.h1')}</h1>
          <p className={styles.subhead}>{t('index.subhead')}</p>
        </div>
      </SectionContainer>

      <SectionContainer variant="standard" padding="standard" as="section">
        <div className={styles.lessonsBlock}>
          {/* W7 (audit/2026-05-08): prefetch={false} so Next.js doesn't
           * preemptively load the lesson page's ~11KB CSS bundle
           * (LessonThreeBeat / CalculatorDefault / CompoundChart) on
           * /learn. The trigger was mobile viewport rendering this card
           * in-viewport early, firing prefetch before the user could
           * click. The lesson page is the user's destination not a
           * transient stop, so paying for CSS on click rather than
           * preemptively is the right trade. */}
          <LocaleLink
            href="/learn/compound-interest"
            className={styles.activeCard}
            prefetch={false}
          >
            <span className={styles.activeCardKicker}>
              {t('lessons.compoundInterest.cardReadTime')}
            </span>
            <h2 className={styles.activeCardTitle}>{t('lessons.compoundInterest.cardTitle')}</h2>
            <p className={styles.activeCardDescription}>
              {t('lessons.compoundInterest.cardDescription')}
            </p>
            <span className={styles.activeCardCta}>{t('lessons.compoundInterest.cardCta')} →</span>
          </LocaleLink>
        </div>
      </SectionContainer>

      <SectionContainer variant="standard" padding="standard" as="section">
        <div className={styles.roadmapBlock}>
          <LessonRoadmap enableAnalytics={enableAnalytics} />
        </div>
      </SectionContainer>

      <SectionContainer variant="standard" padding="standard" as="section">
        <p className={styles.footerLine}>{t('index.footerLine')}</p>
      </SectionContainer>
    </article>
  );
}
