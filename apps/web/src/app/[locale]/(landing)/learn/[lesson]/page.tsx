import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { PageI18nProvider, MarketDataContextProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { marketDataService } from '@/lib/market-data';
import { StructuredData } from '@/components/SEO/StructuredData';
import { SEOMetadataFactory } from '@/lib/seo';
import { LessonFactory } from '@/components/Sections/Lesson';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { ScrollToHash } from '@/components/Layout/ScrollToHash';
import {
  generateLessonMetadata,
  buildLessonStructuredData,
  getLessonBySlug,
  getActiveLessons,
} from '@/lib/learn';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
import type { Metadata } from 'next';

// V3 (audit/2026-05-08 visual review): force-dynamic so the root
// layout's `headers().get('x-locale')` lookup runs per request rather
// than once at build time. Otherwise prerender caches `<html lang="en">`
// for every locale variant. (D-4: the static-rendering rework is a
// separate platform task; keep this until then.)
export const dynamic = 'force-dynamic';

// 404 handling for unknown/announced slugs, audited on BOTH dev and
// `next start` (2026-07-15), which behave differently:
// - dev: dynamicParams=false + the allowlist below gives real router 404s.
// - production: under force-dynamic, the segment still matches and Next 16
//   STREAMS metadata, so both the page's and generateMetadata's notFound()
//   resolve after the 200 shell has started. Result: correct 404 UI, no
//   content leak, but HTTP 200 (a soft 404). KNOWN LIMITATION, accepted for
//   now: announced slugs are linked nowhere, and the real-status fix is
//   either a middleware slug allowlist (touches the CSP-critical middleware;
//   founder decision) or the D-4 static-rendering rework, where
//   dynamicParams=false binds. Both layers below stay: dev 404s today,
//   correct behavior automatically when D-4 lands.
export const dynamicParams = false;

export function generateStaticParams() {
  return getActiveLessons().map((lesson) => ({ lesson: lesson.slug }));
}

interface LessonPageProps {
  params: Promise<{ locale: string; lesson: string }>;
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { locale, lesson: slug } = await params;
  const validLocale = (isValidLocale(locale) ? locale : 'en') as SupportedLocale;
  const lesson = getLessonBySlug(slug);
  if (!lesson || lesson.status !== 'live') {
    // Real 404 status in production (see the mechanism note above).
    notFound();
  }
  return generateLessonMetadata(lesson.id, validLocale);
}

/**
 * Dynamic talk page (Phase 1 refactor, learn redesign plan 2026-07-15).
 * Replaces the per-lesson page files: the registry decides which slugs
 * exist, which namespaces load, and whether the market snapshot is needed
 * (A8 priming for the embedded calculator). Announced talks 404 until their
 * status flips to 'live' (D-2 weekly drip).
 */
export default async function LessonPage({ params }: LessonPageProps) {
  const { locale: localeParam, lesson: slug } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const lesson = getLessonBySlug(slug);
  if (!lesson || lesson.status !== 'live') {
    notFound();
  }

  // V1 (audit/2026-05-08): 'landing-b2c' so the shared MinimalFooter's keys
  // resolve. Extra namespaces come from the registry (Talk 1: 'tools-shared'
  // for the embedded calculator's UsdEquivalentBadge). A8: the market
  // snapshot is pre-fetched in parallel only when the lesson needs it.
  const namespaces = [
    'learn',
    lesson.namespace,
    'landing-b2c',
    ...(lesson.blocks.extraNamespaces ?? []),
  ];
  const [pageMessages, snapshot] = await Promise.all([
    loadPageNamespaces(locale, namespaces),
    lesson.blocks.needsMarketData ? marketDataService.get() : Promise.resolve(null),
  ]);

  const lessonTitle = pageMessages[`${lesson.namespace}.lesson.h1`] ?? lesson.slug;
  // Phase 2: every live talk's namespace carries seo.description (the old
  // learn.lessons.* card keys retired with the TalkArc).
  const lessonDescription = pageMessages[`${lesson.namespace}.seo.description`] ?? '';

  // B-3 (learn redesign plan, 2026-07-15): breadcrumb names localized via the
  // learn namespace (wires the previously-dead `learn.nav.label`, F-8).
  const breadcrumbData = SEOMetadataFactory.generateBreadcrumbs(
    [
      { name: pageMessages['learn.nav.home'] ?? 'Home', url: '/' },
      { name: pageMessages['learn.nav.label'] ?? 'Learn', url: '/learn' },
      { name: lessonTitle, url: `/learn/${lesson.slug}` },
    ],
    locale
  );

  // Phase 3 Slice B (G-5): VideoObject only when this locale has a recording
  // AND the registry carries a real publish date (never invented).
  const youtubeId = lesson.youtube?.[locale];
  const videoArg =
    youtubeId && lesson.youtubePublishedAt
      ? {
          embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
          thumbnailUrl: `https://diboas.com${lesson.illustration ?? '/assets/navigation/learn-banner.avif'}`,
          uploadDate: lesson.youtubePublishedAt,
        }
      : undefined;

  const lessonStructuredData = buildLessonStructuredData({
    lessonId: lesson.id,
    locale,
    title: lessonTitle,
    description: lessonDescription,
    teaches: pageMessages[`${lesson.namespace}.seo.teaches`],
    video: videoArg,
  });

  const structuredDataItems = lessonStructuredData
    ? [breadcrumbData, lessonStructuredData]
    : [breadcrumbData];

  const content = (
    <>
      <StructuredData data={structuredDataItems} />
      <ScrollToHash />

      <div className="main-page-wrapper">
        <LessonFactory lessonId={lesson.id} waitlistCtaHref="/#waitlist" />

        <MinimalFooter
          taglineKey="landing-b2c.footer.tagline"
          navLinks={B2C_FOOTER_NAV}
          disclosureKeys={B2C_FOOTER_DISCLOSURES}
        />
      </div>
    </>
  );

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      {snapshot ? (
        <MarketDataContextProvider initialSnapshot={snapshot}>{content}</MarketDataContextProvider>
      ) : (
        content
      )}
    </PageI18nProvider>
  );
}
