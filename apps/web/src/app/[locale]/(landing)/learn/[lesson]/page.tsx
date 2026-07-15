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

// Router-level slug allowlist: without this, an unknown or announced slug
// matches the route and notFound() fires only after the route group's
// loading.tsx has streamed a 200 shell (a soft 404). dynamicParams=false
// makes non-listed slugs a real router 404 (status 404), like every other
// unknown URL on the site; rendering itself stays force-dynamic.
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
    return {};
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
  const namespaces = ['learn', lesson.namespace, 'landing-b2c', ...(lesson.blocks.extraNamespaces ?? [])];
  const [pageMessages, snapshot] = await Promise.all([
    loadPageNamespaces(locale, namespaces),
    lesson.blocks.needsMarketData ? marketDataService.get() : Promise.resolve(null),
  ]);

  const lessonTitle = pageMessages[`${lesson.namespace}.lesson.h1`] ?? lesson.slug;
  const lessonDescription =
    pageMessages[`${lesson.namespace}.seo.description`] ??
    pageMessages[`learn.lessons.compoundInterest.cardDescription`] ??
    '';

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

  const lessonStructuredData = buildLessonStructuredData({
    lessonId: lesson.id,
    locale,
    title: lessonTitle,
    description: lessonDescription,
    teaches: pageMessages[`${lesson.namespace}.seo.teaches`],
  });

  const structuredDataItems = lessonStructuredData
    ? [breadcrumbData, lessonStructuredData]
    : [breadcrumbData];

  const content = (
    <>
      <StructuredData data={structuredDataItems} />
      <ScrollToHash />

      <div className="main-page-wrapper">
        <LessonFactory
          lessonId={lesson.id}
          primaryCtaHref="/#waitlist"
          secondaryCtaHref="/learn"
        />

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
