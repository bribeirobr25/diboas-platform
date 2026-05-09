/**
 * Structured data (schema.org JSON-LD) for Learn Center pages.
 *
 * Phase 3 L4 (audit/2026-05-08): standalone helper so future lessons can opt
 * in via a single import. Lesson pages emit a LearningResource record (which
 * extends CreativeWork) and the index page emits an ItemList of all live
 * lessons.
 */

import type { SupportedLocale } from '@diboas/i18n/config';
import { seoService } from '@/lib/seo';
import { LESSONS, getActiveLessons } from './registry';
import { READ_TIME_MINUTES } from './constants';

const ORGANIZATION = {
  '@type': 'Organization',
  name: 'diBoaS',
  url: 'https://diboas.com',
} as const;

/**
 * LearningResource for an individual lesson.
 *
 * Caller passes the localized title and description (already resolved from
 * i18n in the page component) so the JSON-LD respects locale parity.
 */
export function buildLessonStructuredData(args: {
  lessonId: keyof typeof LESSONS;
  locale: SupportedLocale;
  title: string;
  description: string;
}) {
  const lesson = LESSONS[args.lessonId];
  if (!lesson) return null;

  const path = `/learn/${lesson.slug}`;
  const url = seoService.generateCanonicalUrl(path, args.locale);

  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    '@id': url,
    url,
    name: args.title,
    description: args.description,
    inLanguage: args.locale,
    learningResourceType: 'Lesson',
    educationalLevel: 'beginner',
    teaches: 'Personal finance: how compound interest works',
    timeRequired: `PT${READ_TIME_MINUTES}M`,
    isAccessibleForFree: true,
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'general public',
    },
    provider: ORGANIZATION,
    publisher: ORGANIZATION,
  };
}

/**
 * ItemList of all live lessons for the /learn index page.
 *
 * Search engines treat ItemList as an entity carousel; including it improves
 * the chance of rich-results display when the index page is indexed.
 */
export function buildLearnIndexStructuredData(args: {
  locale: SupportedLocale;
  lessonTitles: Partial<Record<keyof typeof LESSONS, string>>;
}) {
  const lessons = getActiveLessons();
  if (lessons.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'diBoaS Learn — Lessons',
    inLanguage: args.locale,
    itemListElement: lessons.map((lesson, index) => {
      const path = `/learn/${lesson.slug}`;
      return {
        '@type': 'ListItem',
        position: index + 1,
        url: seoService.generateCanonicalUrl(path, args.locale),
        name: args.lessonTitles[lesson.id] ?? lesson.id,
      };
    }),
  };
}
