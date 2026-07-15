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

import type { LessonId, LessonMetadata, RoadmapLesson } from './types';

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

/** @deprecated Phase-2 replaces the legacy coming-soon roadmap with the registry-driven arc. */
export const ROADMAP: ReadonlyArray<RoadmapLesson> = [
  { key: 'inflation', status: 'comingSoon' },
  { key: 'savingsVsInvesting', status: 'comingSoon' },
  { key: 'currencyDepreciation', status: 'comingSoon' },
];

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
