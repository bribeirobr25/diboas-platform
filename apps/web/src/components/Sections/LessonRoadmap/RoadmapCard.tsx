'use client';

import type { KeyboardEvent } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { analyticsService } from '@/lib/analytics';
import { LESSON_EVENTS, type RoadmapLessonKey } from '@/lib/learn';
import styles from './LessonRoadmap.module.css';

interface RoadmapCardProps {
  lessonKey: RoadmapLessonKey;
  enableAnalytics?: boolean;
}

export function RoadmapCard({ lessonKey, enableAnalytics = true }: RoadmapCardProps) {
  const intl = useTranslation();

  const title = intl.formatMessage({
    id: `learn.roadmap.lessons.${lessonKey}.title`,
  });
  const description = intl.formatMessage({
    id: `learn.roadmap.lessons.${lessonKey}.description`,
  });
  const comingSoonLabel = intl.formatMessage({ id: 'learn.roadmap.comingSoon' });

  const handleClick = () => {
    if (!enableAnalytics) return;
    analyticsService.track({
      name: LESSON_EVENTS.ROADMAP_CARD_CLICKED,
      parameters: {
        lessonKey,
        locale: intl.locale,
        timestamp: Date.now(),
      },
    });
  };

  // Keyboard parity for the click handler (visual-audit F-L2): the card carried an
  // onClick with no role/keyboard, so keyboard + screen-reader users couldn't reach it.
  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <article
      className={styles.card}
      data-status="comingSoon"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <span className={styles.badge}>{comingSoonLabel}</span>
      <h3 className={styles.cardTitle}>{title}</h3>
      <p className={styles.cardDescription}>{description}</p>
    </article>
  );
}
