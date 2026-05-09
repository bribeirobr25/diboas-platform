'use client';

import { useEffect, useRef, useState } from 'react';
import { analyticsService } from '@/lib/analytics';
import { LESSON_EVENTS } from '@/lib/learn';
import styles from './LessonProgressBar.module.css';

interface LessonProgressBarProps {
  lessonId: string;
  /** Element IDs for the beat sections (must exist in the DOM). */
  beatIds: readonly string[];
  /** Translated label per beat — used as anchor link aria-label. */
  beatLabels: readonly string[];
  locale: string;
  enableAnalytics?: boolean;
  className?: string;
}

const VIEW_THRESHOLD = 0.5;

/**
 * Sticky 3-segment progress bar that fills as the reader scrolls into each
 * beat. IntersectionObserver fires beat_viewed once per beat per session.
 */
export function LessonProgressBar({
  lessonId,
  beatIds,
  beatLabels,
  locale,
  enableAnalytics = true,
  className,
}: LessonProgressBarProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof IntersectionObserver === 'undefined') return;

    const elements = beatIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = beatIds.indexOf(entry.target.id);
          if (idx === -1) continue;

          setActiveIndex((prev) => Math.max(prev, idx));

          const fingerprint = `${lessonId}:${entry.target.id}`;
          if (enableAnalytics && !firedRef.current.has(fingerprint)) {
            firedRef.current.add(fingerprint);
            analyticsService.track({
              name: LESSON_EVENTS.BEAT_VIEWED,
              parameters: {
                lessonId,
                beatId: entry.target.id,
                beatIndex: idx,
                locale,
                timestamp: Date.now(),
              },
            });
          }
        }
      },
      { threshold: VIEW_THRESHOLD },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [beatIds, lessonId, enableAnalytics, locale]);

  return (
    <nav
      className={`${styles.bar} ${className ?? ''}`}
      aria-label="Lesson progress"
      data-active-index={activeIndex}
    >
      <ol className={styles.segments}>
        {beatIds.map((id, i) => (
          <li
            key={id}
            className={styles.segment}
            data-active={i <= activeIndex}
            data-current={i === activeIndex}
          >
            <a href={`#${id}`} className={styles.anchor} aria-label={beatLabels[i]}>
              <span className={styles.dot} aria-hidden="true">{i + 1}</span>
              <span className={styles.label}>{beatLabels[i]}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
