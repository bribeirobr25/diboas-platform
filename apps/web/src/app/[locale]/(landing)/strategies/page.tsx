import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { StrategiesPageContent } from '@/components/Pages/StrategiesPageContent';
import type { Metadata } from 'next';

export const dynamic = 'auto';

interface StrategiesPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Generate metadata for the Strategies page
 * Uses i18n translations for locale-aware SEO
 */
export async function generateMetadata({ params }: StrategiesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = isValidLocale(locale) ? locale as SupportedLocale : 'en';

  // Load translations for metadata
  const messages = await loadMessages(validLocale, 'strategies');
  const seo = messages?.seo || {};

  const title = seo.title || 'Investment Strategies | diBoaS';
  const description = seo.description || '10 strategies. Different goals. Different timelines. Different risk levels.';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://diboas.com';

  return {
    title,
    description,
    openGraph: {
      title: seo.ogTitle || 'Find the Strategy That Fits Your Life | diBoaS',
      description: seo.ogDescription || description,
      type: 'website',
      locale: validLocale,
      images: [
        {
          url: `${siteUrl}/api/og/strategies`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.ogTitle || 'Find the Strategy That Fits Your Life | diBoaS',
      description: seo.ogDescription || description,
      images: [`${siteUrl}/api/og/strategies`],
    },
    alternates: {
      canonical: `/strategies`,
      languages: {
        'en': '/en/strategies',
        'de': '/de/strategies',
        'pt-BR': '/pt-BR/strategies',
        'es': '/es/strategies',
      },
    },
  };
}

/**
 * Strategies Page
 *
 * Page showcasing all 10 investment strategies:
 * - Section 1: Hero with headline
 * - Section 2: Strategy Matrix
 * - Section 3: Strategy Cards
 * - Section 4: How to Choose
 * - Section 5: FAQ
 * - Section 6: Final CTA / Waitlist
 */
export default async function StrategiesPage({ params }: StrategiesPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespaces
  const pageMessages = await loadPageNamespaces(locale, ['strategies', 'waitlist', 'share', 'common']);

  // Generate structured data
  const organizationData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS Investment Strategies',
    description: '10 investment strategies from conservative to aggressive for different financial goals',
    category: 'Investment Services'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Strategies', url: '/strategies' }
  ], locale);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[organizationData, breadcrumbData]} />
      <StrategiesPageContent />
    </PageI18nProvider>
  );
}
