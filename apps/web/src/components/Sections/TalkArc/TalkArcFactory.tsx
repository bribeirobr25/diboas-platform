/**
 * TalkArcFactory — variant selector for the 7-talk series arc (Phase 2 of the
 * learn redesign plan, 2026-07-15; replaces LessonRoadmap/RoadmapCard, G-3).
 *
 * The arc is a registry-driven view of the lesson domain: series order is the
 * prev/next spine, live talks link to their pages, announced talks are honest
 * non-interactive cards (the Phase-0 B-2 lesson: no fake buttons). Copy comes
 * from `learn.arc.*` (the approved talk titles + taglines).
 */

import { TalkArcDefault } from './variants/TalkArcDefault';

interface TalkArcFactoryProps {
  variant?: 'default';
  enableAnalytics?: boolean;
}

export function TalkArcFactory({ variant = 'default', enableAnalytics }: TalkArcFactoryProps) {
  switch (variant) {
    case 'default':
    default:
      return <TalkArcDefault enableAnalytics={enableAnalytics} />;
  }
}
