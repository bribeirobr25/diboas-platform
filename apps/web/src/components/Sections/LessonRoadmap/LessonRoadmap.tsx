'use client';

import { ROADMAP } from '@/lib/learn';
import { RoadmapCard } from './RoadmapCard';
import styles from './LessonRoadmap.module.css';

interface LessonRoadmapProps {
  enableAnalytics?: boolean;
}

export function LessonRoadmap({ enableAnalytics = true }: LessonRoadmapProps) {
  return (
    <ul className={styles.grid} role="list">
      {ROADMAP.map((lesson) => (
        <li key={lesson.key} className={styles.gridItem}>
          <RoadmapCard lessonKey={lesson.key} enableAnalytics={enableAnalytics} />
        </li>
      ))}
    </ul>
  );
}
