import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { AboutPageContent } from '@/components/Pages/AboutPageContent';
import { ROUTES } from '@/config/routes';
import type { Metadata } from 'next';

export const dynamic = 'auto';

interface AboutPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Generate metadata for the About page
 * Uses i18n translations for locale-aware SEO
 */
export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = isValidLocale(locale) ? locale as SupportedLocale : 'en';

  // Load translations for metadata
  const messages = await loadMessages(validLocale, 'about');
  const seo = messages?.seo || {};

  const title = seo.title || 'About diBoaS | Built to Fix What Banks Keep Hidden';
  const description = seo.description || 'diBoaS was founded to give everyone access to real returns. Learn the story of why Breno is building this platform.';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://diboas.com';

  return {
    title,
    description,
    openGraph: {
      title: seo.ogTitle || title,
      description: seo.ogDescription || description,
      type: 'website',
      locale: validLocale,
      images: [
        {
          url: `${siteUrl}/api/og/about`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.ogTitle || title,
      description: seo.ogDescription || description,
      images: [`${siteUrl}/api/og/about`],
    },
    alternates: {
      canonical: `/about`,
      languages: {
        'en': '/en/about',
        'de': '/de/about',
        'pt-BR': '/pt-BR/about',
        'es': '/es/about',
      },
    },
  };
}

/**
 * About Page
 *
 * Personal founder story page featuring:
 * - Section 1: Hero with headline
 * - Section 2: The Story (grandmother narrative)
 * - Section 3: What diBoaS Does
 * - Section 4: What We Believe (3 pillars)
 * - Section 5: The Mission
 * - Section 6: For Businesses CTA
 * - Section 7: Contact
 */
export default async function AboutPage({ params }: AboutPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespaces
  const pageMessages = await loadPageNamespaces(locale, ['about', 'common', 'waitlist']);

  // Generate structured data
  const serviceData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS',
    description: 'Platform giving regular people access to institutional-grade financial returns',
    category: 'Financial Technology'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'About', url: ROUTES.ABOUT }
  ], locale);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[serviceData, breadcrumbData]} />
      <AboutPageContent />
    </PageI18nProvider>
  );
}
