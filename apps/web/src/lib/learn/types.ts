/**
 * Learn Center domain types.
 *
 * Phase 1 has one lesson; the registry pattern is set up so Lessons 02–05
 * each ship as a one-line registry addition + content backfill.
 */

import type { SupportedLocale } from '@diboas/i18n/config';

export type LessonId = 'compound-interest';

export type LessonStatus = 'live' | 'comingSoon';

export interface VideoSourceConfig {
  sources: Array<{ src: string; type: 'video/mp4' | 'application/x-mpegURL' }>;
  poster: string;
  captions: Array<{
    locale: SupportedLocale;
    src: string;
    srcLang: string;
    label: string;
  }>;
}

export interface LessonMetadata {
  id: LessonId;
  /** URL slug under /learn/ */
  slug: string;
  /** Translation namespace this lesson loads. */
  namespace: string;
  status: LessonStatus;
  /** Lesson template variant — phase 1 only has 'threeBeat'. */
  variant: 'threeBeat';
  /** When the video lands, this becomes defined. */
  video?: VideoSourceConfig;
  /** Roadmap key used to render the "what's next" hint. */
  next?: RoadmapLessonKey;
}

export type RoadmapLessonKey =
  | 'inflation'
  | 'savingsVsInvesting'
  | 'currencyDepreciation';

export interface RoadmapLesson {
  key: RoadmapLessonKey;
  /** Title and description live in the `learn` namespace under roadmap.lessons.<key>. */
  status: 'comingSoon';
}
