/**
 * Lesson registry.
 *
 * Single source of truth for which lessons are live, what their slugs are,
 * which namespace they load, and (when ready) where their video assets live.
 *
 * Adding a Lesson 02 = one entry here + a translation namespace + ~1 day of
 * Phase A.4-style component composition.
 */

import type { LessonMetadata, RoadmapLesson } from './types';

export const LESSONS: Readonly<Record<string, LessonMetadata>> = {
  'compound-interest': {
    id: 'compound-interest',
    slug: 'compound-interest',
    namespace: 'learn-compound-interest',
    status: 'live',
    variant: 'threeBeat',
    video: undefined, // populated when D1 video lands; lesson hero falls back to text/illustration until then
    next: 'inflation',
  },
};

export const ROADMAP: ReadonlyArray<RoadmapLesson> = [
  { key: 'inflation', status: 'comingSoon' },
  { key: 'savingsVsInvesting', status: 'comingSoon' },
  { key: 'currencyDepreciation', status: 'comingSoon' },
];

export function getLesson(id: string): LessonMetadata | undefined {
  return LESSONS[id];
}

export function getActiveLessons(): LessonMetadata[] {
  return Object.values(LESSONS).filter((l) => l.status === 'live');
}
