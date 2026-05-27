import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { StructuredData } from '@/components/SEO/StructuredData';
import { SEOMetadataFactory } from '@/lib/seo';
import { LearnIndex } from '@/components/Sections/LearnIndex';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { ScrollToHash } from '@/components/Layout/ScrollToHash';
import { generateLearnIndexMetadata, buildLearnIndexStructuredData } from '@/lib/learn';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
import type { Metadata } from 'next';
import type { LocalePageProps } from '@/types/page';

// V3 (audit/2026-05-08 visual review): force-dynamic so the root
// layout's `headers().get('x-locale')` lookup runs per request rather
// than once at build time. Otherwise prerender caches `<html lang="en">`
// for every locale variant.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = (isValidLocale(locale) ? locale : 'en') as SupportedLocale;
  return generateLearnIndexMetadata(validLocale);
}

export default async function LearnIndexPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // V1 (audit/2026-05-08 visual review): include 'landing-b2c' so the
  // shared MinimalFooter's `landing-b2c.footer.*` keys resolve.
  const pageMessages = await loadPageNamespaces(locale, ['learn', 'landing-b2c']);

  const breadcrumbData = SEOMetadataFactory.generateBreadcrumbs(
    [
      { name: 'Home', url: '/' },
      { name: 'Learn', url: '/learn' },
    ],
    locale
  );

  const indexStructuredData = buildLearnIndexStructuredData({
    locale,
    lessonTitles: {
      'compound-interest':
        pageMessages['learn.lessons.compoundInterest.cardTitle'] ?? 'How Money Really Grows',
    },
  });

  const structuredDataItems = indexStructuredData
    ? [breadcrumbData, indexStructuredData]
    : [breadcrumbData];

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={structuredDataItems} />
      <ScrollToHash />

      <div className="main-page-wrapper">
        <LearnIndex />

        <MinimalFooter
          taglineKey="landing-b2c.footer.tagline"
          navLinks={B2C_FOOTER_NAV}
          disclosureKeys={B2C_FOOTER_DISCLOSURES}
        />
      </div>
    </PageI18nProvider>
  );
}
