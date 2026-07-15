/**
 * Learn Center domain types.
 *
 * Phase 1 refactor (learn redesign plan, 2026-07-15): the registry is the
 * single source of truth for the 7-talk "Basics" series. Adding a talk is one
 * registry entry + its translation namespace (+ a PAGE_SEO_CONFIG entry when
 * it goes live); the invariants test makes every sync point fail loudly.
 */

import type { SupportedLocale } from '@diboas/i18n/config';

export type LessonId =
  | 'compound-interest'
  | 'money-objective'
  | 'pay-yourself-first'
  | 'ten-percent'
  | 'seventy-percent'
  | 'clearing-debt'
  | 'putting-it-together';

/**
 * 'live' renders a page and appears in the sitemap/index; 'announced' is
 * visible only as a non-interactive card on the index (D-2 weekly drip;
 * announced slugs 404).
 */
export type LessonStatus = 'live' | 'announced';

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

/** What the threeBeat variant composes for a given talk. */
export interface LessonBlocks {
  /** Beat-2 media: Talk 1 renders the CalculatorVignettes table. */
  beat2Media?: 'calculatorVignettes';
  /** Beat-3 tool: Talk 1 embeds the calculator; other talks link out. */
  beat3Tool: { kind: 'embeddedCalculator' } | { kind: 'toolCard'; href: string };
  /** Extra i18n namespaces this lesson's page must load (Talk 1: tools-shared). */
  extraNamespaces?: string[];
  /** Whether the page must prefetch the market snapshot (Talk 1: yes, A8). */
  needsMarketData?: boolean;
  /**
   * Graded quiz: correct-option indexes (0-based), one per graded question
   * (Phase 3, RV-4). One source of truth for ALL locales; i18n carries only
   * display strings (`quiz.qN.question` + until-exhausted `quiz.qN.options`).
   * Option order is fixed by the approved talk docs; translators must never
   * reorder options. Absent = the talk renders no quiz.
   */
  quiz?: { correctIndexes: readonly number[] };
}

export interface LessonMetadata {
  id: LessonId;
  /** URL slug under /learn/ */
  slug: string;
  /** Translation namespace this lesson loads (learn-<slug> convention). */
  namespace: string;
  status: LessonStatus;
  /** Lesson template variant. */
  variant: 'threeBeat';
  /** Read-time estimate; feeds analytics + schema.org timeRequired. */
  readTimeMinutes: number;
  /**
   * Per-talk hero illustration (/assets/learn/talk-0N-hero.avif). Optional
   * until the generated assets land; LessonHero falls back to its default.
   */
  illustration?: string;
  /** Self-hosted video config (existing path); populated when a recording lands. */
  video?: VideoSourceConfig;
  /**
   * YouTube-nocookie recordings (Phase 3 Slice B, D-1), keyed by locale. A
   * locale without an id renders the illustration hero (no facade, no broken
   * embed). Precedence when both exist: self-hosted `video` wins (RV-6).
   */
  youtube?: Partial<Record<SupportedLocale, string>>;
  /** ISO date of the FIRST recording's publish (feeds VideoObject uploadDate; never invented). */
  youtubePublishedAt?: string;
  /** Series spine. Undefined prev = first talk; undefined next = last talk. */
  prev?: LessonId;
  next?: LessonId;
  blocks: LessonBlocks;
}
