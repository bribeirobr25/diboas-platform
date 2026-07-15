'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { analyticsService } from '@/lib/analytics';
import { LESSON_EVENTS, type RoadmapLessonKey } from '@/lib/learn';
import styles from './LessonRoadmap.module.css';

interface RoadmapCardProps {
  lessonKey: RoadmapLessonKey;
  enableAnalytics?: boolean;
}

/**
 * Coming-soon roadmap card.
 *
 * Phase 0 a11y fix (B-2, learn redesign plan 2026-07-15): the card previously
 * carried role="button" + tabIndex + key handling (added by visual-audit F-L2
 * for keyboard parity with an onClick), but activating it did nothing
 * user-visible, so screen readers announced a button that was a no-op. The
 * card is informational: all interactive semantics AND the click handler are
 * removed, and the honest signal is an impression (>=50% visible, once per
 * mount) via the same IntersectionObserver pattern as LessonProgressBar.
 */
export function RoadmapCard({ lessonKey, enableAnalytics = true }: RoadmapCardProps) {
  const intl = useTranslation();

  const title = intl.formatMessage({
    id: `learn.roadmap.lessons.${lessonKey}.title`,
  });
  const description = intl.formatMessage({
    id: `learn.roadmap.lessons.${lessonKey}.description`,
  });
  const comingSoonLabel = intl.formatMessage({ id: 'learn.roadmap.comingSoon' });

  const cardRef = useRef<HTMLElement | null>(null);
  const viewedRef = useRef(false);
  const locale = intl.locale;

  useEffect(() => {
    if (!enableAnalytics) return;
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || viewedRef.current) continue;
          viewedRef.current = true;
          analyticsService.track({
            name: LESSON_EVENTS.ROADMAP_CARD_VIEWED,
            parameters: {
              lessonKey,
              locale,
              timestamp: Date.now(),
            },
          });
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [enableAnalytics, lessonKey, locale]);

  return (
    <article className={styles.card} data-status="comingSoon" ref={cardRef}>
      <span className={styles.badge}>{comingSoonLabel}</span>
      <h3 className={styles.cardTitle}>{title}</h3>
      <p className={styles.cardDescription}>{description}</p>
    </article>
  );
}
