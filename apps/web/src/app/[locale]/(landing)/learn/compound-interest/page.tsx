import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { StructuredData } from '@/components/SEO/StructuredData';
import { SEOMetadataFactory } from '@/lib/seo';
import { LessonFactory } from '@/components/Sections/Lesson';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { ScrollToHash } from '@/components/Layout/ScrollToHash';
import { generateLessonMetadata, buildLessonStructuredData } from '@/lib/learn';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
import type { Metadata } from 'next';
import type { LocalePageProps } from '@/types/page';

// V3 (audit/2026-05-08 visual review): see /learn/page.tsx — same reason.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = (isValidLocale(locale) ? locale : 'en') as SupportedLocale;
  return generateLessonMetadata('compound-interest', validLocale);
}

export default async function CompoundInterestLessonPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // V1 (audit/2026-05-08 visual review): include 'landing-b2c' so the
  // shared MinimalFooter's `landing-b2c.footer.*` keys resolve.
  const pageMessages = await loadPageNamespaces(locale, [
    'learn',
    'learn-compound-interest',
    'landing-b2c',
  ]);

  const lessonTitle =
    pageMessages['learn-compound-interest.lesson.h1'] ?? 'How Money Really Grows';
  const lessonDescription =
    pageMessages['learn.lessons.compoundInterest.cardDescription'] ??
    "The math the banks have been using for centuries. Now it's your turn.";

  const breadcrumbData = SEOMetadataFactory.generateBreadcrumbs(
    [
      { name: 'Home', url: '/' },
      { name: 'Learn', url: '/learn' },
      { name: lessonTitle, url: '/learn/compound-interest' },
    ],
    locale,
  );

  const lessonStructuredData = buildLessonStructuredData({
    lessonId: 'compound-interest',
    locale,
    title: lessonTitle,
    description: lessonDescription,
  });

  const structuredDataItems = lessonStructuredData
    ? [breadcrumbData, lessonStructuredData]
    : [breadcrumbData];

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={structuredDataItems} />
      <ScrollToHash />

      <div className="main-page-wrapper">
        <LessonFactory
          lessonId="compound-interest"
          primaryCtaHref="/#waitlist"
          secondaryCtaHref="/learn"
        />

        <MinimalFooter
          taglineKey="landing-b2c.footer.tagline"
          navLinks={B2C_FOOTER_NAV}
          disclosureKeys={B2C_FOOTER_DISCLOSURES}
        />
      </div>
    </PageI18nProvider>
  );
}
