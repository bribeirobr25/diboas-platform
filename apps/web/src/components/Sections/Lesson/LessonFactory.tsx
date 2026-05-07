/**
 * LessonFactory — variant selector for the Learn Center.
 *
 * PERMANENT EDITORIAL GUIDELINE (CMO Board, ratified 2026-05-07):
 * - Show the math; never tell the user what to do.
 * - Frame as "Did you know?" — not "Stop doing X."
 * - Every lesson advances the diBoaS thesis.
 * - Adelaide Filter on every line. See packages/i18n/translations/TRANSLATORS.md.
 *
 * Future engineers and AI agents adding Lessons 02–05: read this guideline
 * before drafting any beat copy or building any new lesson variant.
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
          lessonId={lessonId}
          video={lesson.video}
          primaryCtaHref={primaryCtaHref}
          secondaryCtaHref={secondaryCtaHref}
          enableAnalytics={enableAnalytics}
        />
      );
  }
}
