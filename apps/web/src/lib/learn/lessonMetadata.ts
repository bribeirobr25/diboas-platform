/**
 * Per-lesson metadata builders.
 *
 * Defers to SEOMetadataFactory for the heavy lifting (canonical, hreflang,
 * OG, Twitter) but adds structured data hints unique to learning resources.
 */

import type { Metadata } from 'next';
import { SEOMetadataFactory } from '@/lib/seo';
import type { SupportedLocale } from '@diboas/i18n/server';
import { getLesson } from './registry';

export async function generateLessonMetadata(
  lessonId: string,
  locale: SupportedLocale,
): Promise<Metadata> {
  const lesson = getLesson(lessonId);
  if (!lesson) {
    return SEOMetadataFactory.generateStaticPageMetadata('home', locale);
  }
  // The PAGE_SEO_CONFIG entry is keyed `learn/<slug>` (e.g. `learn/compound-interest`).
  return SEOMetadataFactory.generateStaticPageMetadata(
    `learn/${lesson.slug}` as 'learn/compound-interest',
    locale,
  );
}

export async function generateLearnIndexMetadata(
  locale: SupportedLocale,
): Promise<Metadata> {
  return SEOMetadataFactory.generateStaticPageMetadata('learn', locale);
}
