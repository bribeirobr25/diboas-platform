import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { FutureYouPageContent } from '@/components/Pages/FutureYouPageContent';
import type { Metadata } from 'next';

export const dynamic = 'auto';

interface FutureYouPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Generate metadata for the Future You Calculator page
 * Uses i18n translations for locale-aware SEO
 */
export async function generateMetadata({ params }: FutureYouPageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = isValidLocale(locale) ? locale as SupportedLocale : 'en';

  // Load translations for metadata
  const messages = await loadMessages(validLocale, 'future-you');
  const seo = messages?.seo || {};

  const title = seo.title || 'Future You Calculator | diBoaS';
  const description = seo.description || 'See what your money could become. Small amounts. Consistent effort. Time does the rest.';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://diboas.com';

  return {
    title,
    description,
    openGraph: {
      title: seo.ogTitle || 'Meet Your Future Self | diBoaS',
      description: seo.ogDescription || description,
      type: 'website',
      locale: validLocale,
      images: [
        {
          url: `${siteUrl}/api/og/future-you`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.ogTitle || 'Meet Your Future Self | diBoaS',
      description: seo.ogDescription || description,
      images: [`${siteUrl}/api/og/future-you`],
    },
    alternates: {
      canonical: `/future-you`,
      languages: {
        'en': '/en/future-you',
        'de': '/de/future-you',
        'pt-BR': '/pt-BR/future-you',
        'es': '/es/future-you',
      },
    },
  };
}

/**
 * Future You Calculator Page
 *
 * Dedicated page for the Future You Calculator featuring:
 * - Section 1: Hero with headline
 * - Section 2: Interactive Calculator (monthly savings slider, timeframe buttons)
 * - Section 3: The Math Explained (Bank Gap, Compound, Time)
 * - Section 4: Strategy Connection (link to strategies page)
 * - Section 5: FAQ
 * - Section 6: Final CTA / Waitlist
 */
export default async function FutureYouPage({ params }: FutureYouPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespaces
  const pageMessages = await loadPageNamespaces(locale, ['future-you', 'calculator', 'waitlist', 'share', 'common']);

  // Generate structured data
  const organizationData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS Future You Calculator',
    description: 'Calculate your potential savings growth with diBoaS vs traditional banking',
    category: 'Financial Calculator'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Future You', url: '/future-you' }
  ], locale);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[organizationData, breadcrumbData]} />
      <FutureYouPageContent />
    </PageI18nProvider>
  );
}
