/**
 * Lesson registry.
 *
 * Single source of truth for the 7-talk "Basics" series: slugs, namespaces,
 * status (D-2 weekly drip: flip 'announced' -> 'live' per release), the
 * series spine (prev/next), read times, and per-talk block composition.
 *
 * Going live with a talk = flip its status + add its 4 locale JSON files,
 * SUPPORTED_NAMESPACES + translations-map entries, and a PAGE_SEO_CONFIG
 * entry. `__tests__/registryInvariants.test.ts` fails loudly on any missing
 * sync point. Tool hrefs come from the approved talk docs
 * (docs/learn/30-day-series/lesson-0N-*.md).
 */

import type { LessonId, LessonMetadata } from './types';

export const LESSONS: Readonly<Record<LessonId, LessonMetadata>> = {
  'compound-interest': {
    id: 'compound-interest',
    slug: 'compound-interest',
    namespace: 'learn-compound-interest',
    status: 'live',
    variant: 'threeBeat',
    readTimeMinutes: 5,
    video: undefined, // D-1: YouTube facade lands in Phase 3; self-hosted config stays supported
    next: 'money-objective',
    blocks: {
      beat2Media: 'calculatorVignettes',
      beat3Tool: { kind: 'embeddedCalculator' },
      extraNamespaces: ['tools-shared'], // UsdEquivalentBadge inside the embedded calculator
      needsMarketData: true, // A8: prime the market snapshot before render
      // Approved Talk-1 quiz (docs §5): Q1 correct = (b), Q2 correct = (a).
      quiz: { correctIndexes: [1, 0] },
    },
  },
  'money-objective': {
    id: 'money-objective',
    slug: 'money-objective',
    namespace: 'learn-money-objective',
    status: 'announced',
    variant: 'threeBeat',
    readTimeMinutes: 5,
    prev: 'compound-interest',
    next: 'pay-yourself-first',
    blocks: { beat3Tool: { kind: 'toolCard', href: '/tools/goal-savings' } },
  },
  'pay-yourself-first': {
    id: 'pay-yourself-first',
    slug: 'pay-yourself-first',
    namespace: 'learn-pay-yourself-first',
    status: 'announced',
    variant: 'threeBeat',
    readTimeMinutes: 5,
    prev: 'money-objective',
    next: 'ten-percent',
    blocks: { beat3Tool: { kind: 'toolCard', href: '/tools/money-jobs' } },
  },
  'ten-percent': {
    id: 'ten-percent',
    slug: 'ten-percent',
    namespace: 'learn-ten-percent',
    status: 'announced',
    variant: 'threeBeat',
    readTimeMinutes: 5,
    prev: 'pay-yourself-first',
    next: 'seventy-percent',
    blocks: { beat3Tool: { kind: 'toolCard', href: '/tools/compound-interest' } },
  },
  'seventy-percent': {
    id: 'seventy-percent',
    slug: 'seventy-percent',
    namespace: 'learn-seventy-percent',
    status: 'announced',
    variant: 'threeBeat',
    readTimeMinutes: 5,
    prev: 'ten-percent',
    next: 'clearing-debt',
    blocks: { beat3Tool: { kind: 'toolCard', href: '/tools/money-jobs' } },
  },
  'clearing-debt': {
    id: 'clearing-debt',
    slug: 'clearing-debt',
    namespace: 'learn-clearing-debt',
    status: 'announced',
    variant: 'threeBeat',
    readTimeMinutes: 5,
    prev: 'seventy-percent',
    next: 'putting-it-together',
    blocks: { beat3Tool: { kind: 'toolCard', href: '/tools/money-jobs' } },
  },
  'putting-it-together': {
    id: 'putting-it-together',
    slug: 'putting-it-together',
    namespace: 'learn-putting-it-together',
    status: 'announced',
    variant: 'threeBeat',
    readTimeMinutes: 5,
    prev: 'clearing-debt',
    blocks: { beat3Tool: { kind: 'toolCard', href: '/tools/money-jobs' } },
  },
};

export function getLesson(id: string): LessonMetadata | undefined {
  return (LESSONS as Readonly<Record<string, LessonMetadata>>)[id];
}

export function getLessonBySlug(slug: string): LessonMetadata | undefined {
  return Object.values(LESSONS).find((l) => l.slug === slug);
}

export function getActiveLessons(): LessonMetadata[] {
  return Object.values(LESSONS).filter((l) => l.status === 'live');
}

export function getAnnouncedLessons(): LessonMetadata[] {
  return Object.values(LESSONS).filter((l) => l.status === 'announced');
}

/**
 * The 7 talks in series order, walked along the prev/next spine from the head
 * (the talk with no `prev`). Phase 2: the TalkArc renders this, so series
 * order is derived from the spine, never from object-key order or a
 * hand-numbered list. The `lessons` param exists for test fixtures; the
 * invariants test guarantees the real registry walks completely.
 */
export function getSeriesLessons(
  lessons: Readonly<Partial<Record<LessonId, LessonMetadata>>> = LESSONS
): LessonMetadata[] {
  const all = Object.values(lessons).filter(Boolean) as LessonMetadata[];
  const head = all.find((l) => !l.prev);
  if (!head) return [];

  const ordered: LessonMetadata[] = [];
  const seen = new Set<LessonId>();
  let current: LessonMetadata | undefined = head;
  while (current && !seen.has(current.id)) {
    ordered.push(current);
    seen.add(current.id);
    current = current.next ? lessons[current.next] : undefined;
  }
  return ordered;
}

/**
 * The next talk in the spine ONLY if it is live (D-2 drip: talk pages link
 * forward only to published talks; otherwise the CTA falls back to the
 * honest "more talks are on the way" line).
 */
export function getNextLiveLesson(
  lesson: LessonMetadata,
  lessons: Readonly<Partial<Record<LessonId, LessonMetadata>>> = LESSONS
): LessonMetadata | undefined {
  const next = lesson.next ? lessons[lesson.next] : undefined;
  return next?.status === 'live' ? next : undefined;
}

/**
 * The previous talk in the spine ONLY if it is live (Phase 3 mirror of
 * getNextLiveLesson: a prev link to an announced talk would 404).
 */
export function getPrevLiveLesson(
  lesson: LessonMetadata,
  lessons: Readonly<Partial<Record<LessonId, LessonMetadata>>> = LESSONS
): LessonMetadata | undefined {
  const prev = lesson.prev ? lessons[lesson.prev] : undefined;
  return prev?.status === 'live' ? prev : undefined;
}
