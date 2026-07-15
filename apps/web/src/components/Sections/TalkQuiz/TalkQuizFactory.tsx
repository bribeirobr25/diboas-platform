/**
 * TalkQuizFactory — variant selector for the talk-page quiz (Phase 3 of the
 * learn redesign plan, Slice A).
 *
 * Retrieval practice, never a test to game: graded questions give instant
 * honest feedback (no retries-gating, no score-shaming), the reflection is a
 * noticing exercise (never a data capture), and the share line is an offered
 * result, never share-to-unlock (anti-slop row 15 inverse).
 *
 * Correctness lives in the registry (`lesson.blocks.quiz.correctIndexes`,
 * RV-4: one source of truth for all locales); i18n carries only display
 * strings. A talk without a quiz block renders nothing.
 */

import type { LessonMetadata } from '@/lib/learn';
import { TalkQuizDefault } from './variants/TalkQuizDefault';

interface TalkQuizFactoryProps {
  variant?: 'default';
  lesson: LessonMetadata;
  enableAnalytics?: boolean;
}

export function TalkQuizFactory({
  variant = 'default',
  lesson,
  enableAnalytics,
}: TalkQuizFactoryProps) {
  if (!lesson.blocks.quiz?.correctIndexes.length) {
    return null;
  }

  switch (variant) {
    case 'default':
    default:
      return <TalkQuizDefault lesson={lesson} enableAnalytics={enableAnalytics} />;
  }
}
