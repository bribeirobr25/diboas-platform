/**
 * LessonFactory — variant selector for the Learn Center.
 *
 * PERMANENT EDITORIAL GUIDELINE (CMO Board, ratified 2026-05-07):
 * - Show the math; never tell the user what to do.
 * - Frame as "Did you know?" — not "Stop doing X."
 * - Every lesson advances the diBoaS thesis.
 * - Adelaide Filter on every line. See packages/i18n/translations/TRANSLATORS.md.
 *
 * Future engineers and AI agents adding talks: read this guideline before
 * drafting any beat copy or building any new lesson variant. Phase 1
 * refactor (2026-07-15): the resolved registry entry is passed down whole,
 * so variants are namespace- and blocks-driven (no per-lesson hardcoding).
 */

import { LessonThreeBeat } from './variants/LessonThreeBeat';
import { getLesson, type LessonId } from '@/lib/learn';

interface LessonFactoryProps {
  lessonId: LessonId;
  primaryCtaHref?: string;
  secondaryCtaHref?: string;
  enableAnalytics?: boolean;
}

export function LessonFactory({
  lessonId,
  primaryCtaHref,
  secondaryCtaHref,
  enableAnalytics,
}: LessonFactoryProps) {
  const lesson = getLesson(lessonId);
  if (!lesson) {
    return null;
  }

  switch (lesson.variant) {
    case 'threeBeat':
    default:
      return (
        <LessonThreeBeat
          lesson={lesson}
          primaryCtaHref={primaryCtaHref}
          secondaryCtaHref={secondaryCtaHref}
          enableAnalytics={enableAnalytics}
        />
      );
  }
}
