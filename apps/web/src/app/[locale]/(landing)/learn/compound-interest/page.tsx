import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { StructuredData } from '@/components/SEO/StructuredData';
import { SEOMetadataFactory } from '@/lib/seo';
import { LessonFactory } from '@/components/Sections/Lesson';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { ScrollToHash } from '@/components/Layout/ScrollToHash';
import { generateLessonMetadata } from '@/lib/learn';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
import type { Metadata } from 'next';
import type { LocalePageProps } from '@/types/page';

export const dynamic = 'auto';

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

  const pageMessages = await loadPageNamespaces(locale, [
    'learn',
    'learn-compound-interest',
  ]);

  const breadcrumbData = SEOMetadataFactory.generateBreadcrumbs(
    [
      { name: 'Home', url: '/' },
      { name: 'Learn', url: '/learn' },
      { name: 'How Money Really Grows', url: '/learn/compound-interest' },
    ],
    locale,
  );

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[breadcrumbData]} />
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
