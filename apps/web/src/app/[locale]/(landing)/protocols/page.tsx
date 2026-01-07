import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { ProtocolsPageContent } from '@/components/Pages/ProtocolsPageContent';
import type { Metadata } from 'next';

export const dynamic = 'auto';

interface ProtocolsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Generate metadata for the Protocols page
 * Uses i18n translations for locale-aware SEO
 */
export async function generateMetadata({ params }: ProtocolsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = isValidLocale(locale) ? locale as SupportedLocale : 'en';

  // Load translations for metadata
  const messages = await loadMessages(validLocale, 'protocols');
  const seo = messages?.seo || {};

  const title = seo.title || 'Where Your Money Works | The Protocols We Trust | diBoaS';
  const description = seo.description || 'diBoaS connects you to established decentralized finance protocols. See exactly where your money goes with full transparency.';

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
          url: `${siteUrl}/api/og/protocols`,
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
      images: [`${siteUrl}/api/og/protocols`],
    },
    alternates: {
      canonical: `/protocols`,
      languages: {
        'en': '/en/protocols',
        'de': '/de/protocols',
        'pt-BR': '/pt-BR/protocols',
        'es': '/es/protocols',
      },
    },
  };
}

/**
 * Protocols Page
 *
 * Transparency page showing all 26 DeFi protocols we trust:
 * - Section 1: Hero with headline
 * - Section 2: Why This Page Exists
 * - Section 3: Protocol Categories (Lending, Staking, etc.)
 * - Section 4: Our Selection Process
 * - Section 5: Total TVL
 * - Section 6: FAQ
 * - Section 7: Waitlist
 */
export default async function ProtocolsPage({ params }: ProtocolsPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespaces
  const pageMessages = await loadPageNamespaces(locale, ['protocols', 'common', 'waitlist']);

  // Generate structured data
  const organizationData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS Protocol Transparency',
    description: 'Complete list of DeFi protocols used by diBoaS with security audits and regulatory information',
    category: 'Financial Technology'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Protocols', url: '/protocols' }
  ], locale);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[organizationData, breadcrumbData]} />
      <ProtocolsPageContent />
    </PageI18nProvider>
  );
}
