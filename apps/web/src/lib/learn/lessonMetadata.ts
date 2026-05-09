/**
 * Per-lesson metadata builders.
 *
 * V2 (audit/2026-05-08 visual review): localized via `loadMessages` so
 * non-English Learn pages get correctly-translated `<title>` and
 * `<meta description>` (was English-only before, regardless of URL
 * locale). Pattern matches `apps/web/src/app/[locale]/(landing)/security/page.tsx`
 * and the other locale-aware pages.
 *
 * The page-level OG image still comes from `/api/og/<key>`; canonical +
 * hreflang alternates are computed from the URL.
 */

import type { Metadata } from 'next';
import { loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { SEO_DEFAULTS } from '@/lib/seo/constants';
import { getLesson } from './registry';

const SITE_URL = SEO_DEFAULTS.siteUrl;
// Root layout's `metadata.title.template` already appends ` | diBoaS`
// to every page title — we hand back the bare localized title so the
// template renders `Foo | diBoaS`, not `Foo | diBoaS | diBoaS`.

interface LearnSeoFields {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
}

function buildAlternates(path: string, currentLocale: SupportedLocale) {
  const localePath = (l: string) => `${SITE_URL}/${l}${path}`;
  return {
    canonical: localePath(currentLocale),
    languages: {
      en: localePath('en'),
      de: localePath('de'),
      es: localePath('es'),
      'pt-br': localePath('pt-BR'),
      'x-default': localePath('en'),
    },
  };
}

function buildLearnMetadata(args: {
  locale: SupportedLocale;
  path: string;
  ogImagePath: string;
  fallbackTitle: string;
  fallbackDescription: string;
  seo: LearnSeoFields;
}): Metadata {
  const { locale, path, ogImagePath, fallbackTitle, fallbackDescription, seo } = args;
  const title = seo.title || fallbackTitle;
  const description = seo.description || fallbackDescription;
  const ogImageUrl = `${SITE_URL}${ogImagePath}`;
  const ogTitle = seo.ogTitle || title;
  const ogDescription = seo.ogDescription || description;

  return {
    // Bare title — root layout's titleTemplate appends ` | diBoaS`.
    title,
    description,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'article',
      locale,
      url: `${SITE_URL}/${locale}${path}`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: ogTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@diboasfi',
      creator: '@bribeiro_br',
      title: ogTitle,
      description: ogDescription,
      images: [ogImageUrl],
    },
    alternates: buildAlternates(path, locale),
  };
}

export async function generateLessonMetadata(
  lessonId: string,
  locale: SupportedLocale,
): Promise<Metadata> {
  const lesson = getLesson(lessonId);
  if (!lesson) {
    return {};
  }

  const messages = await loadMessages(locale, lesson.namespace);
  const seo = (messages?.seo ?? {}) as LearnSeoFields;

  return buildLearnMetadata({
    locale,
    path: `/learn/${lesson.slug}`,
    // Per-lesson OG art falls back to /default if a specific template
    // isn't registered yet; the lesson page registers via its slug.
    ogImagePath: '/api/og/default',
    fallbackTitle: 'How Money Really Grows — Compound Interest Explained',
    fallbackDescription:
      'Learn how compound interest works — the math banks and Wall Street have used for decades. Plug in your own numbers and see what 12 years looks like.',
    seo,
  });
}

export async function generateLearnIndexMetadata(
  locale: SupportedLocale,
): Promise<Metadata> {
  const messages = await loadMessages(locale, 'learn');
  const seo = (messages?.seo ?? {}) as LearnSeoFields;

  return buildLearnMetadata({
    locale,
    path: '/learn',
    ogImagePath: '/api/og/default',
    fallbackTitle: 'Learn how money actually works',
    fallbackDescription:
      "Short, honest lessons on the financial system — written for people the system wasn't built for.",
    seo,
  });
}
