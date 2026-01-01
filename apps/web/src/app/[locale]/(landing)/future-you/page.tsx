import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { PageI18nProvider } from '@/components/PageI18nProvider';
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
 */
export async function generateMetadata({ params }: FutureYouPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Future You Calculator | diBoaS',
    description: 'See what your money could become. Small amounts. Consistent effort. Time does the rest.',
    openGraph: {
      title: 'Meet Your Future Self | diBoaS',
      description: 'See what your money could become if it worked as hard as you do.',
      type: 'website'
    }
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
  const pageMessages = await loadPageNamespaces(locale, ['future-you', 'calculator', 'waitlist', 'common']);

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
