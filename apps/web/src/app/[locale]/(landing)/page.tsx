import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale, loadMessages } from '@diboas/i18n/server';
import { SEOMetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { ScrollToHash } from '@/components/Layout/ScrollToHash';
import { PageI18nProvider, MarketDataContextProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { marketDataService } from '@/lib/market-data';
import { StickyMobileCTA } from '@/components/UI';
import { LandingPtBR } from '@/components/Pages/LandingPtBR';
import { LandingDe } from '@/components/Pages/LandingDe';
import { LandingEs } from '@/components/Pages/LandingEs';
import { LandingEn } from '@/components/Pages/LandingEn';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
import type { Metadata } from 'next';
import type { LocalePageProps } from '@/types/page';

export const dynamic = 'auto';

/**
 * Open Graph `locale` requires the `language_TERRITORY` form (underscore), not the
 * route's `language-TERRITORY` (hyphen). Map the supported locales explicitly.
 */
const OG_LOCALE: Record<SupportedLocale, string> = {
  en: 'en_US',
  de: 'de_DE',
  es: 'es_ES',
  'pt-BR': 'pt_BR',
};

/**
 * Generate metadata for the B2C landing page
 */
export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://diboas.com';

  // Load translations for SEO metadata
  const messages = await loadMessages(locale as SupportedLocale, 'landing-b2c');
  const seo = messages.seo || {};

  const title = seo.title || 'diBoaS - Make Your Money Work';
  const description = seo.description || 'Turn your idle money into real growth.';
  const ogTitle = seo.ogTitle || title;
  const ogDescription = seo.ogDescription || description;

  return {
    title,
    description,
    keywords: [
      'goal-driven investing',
      'wealth building',
      'earn interest on savings',
      'free money transfers',
      'non-custodial wallet',
      'finance app',
    ],
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        en: `${baseUrl}/en`,
        de: `${baseUrl}/de`,
        es: `${baseUrl}/es`,
        'pt-br': `${baseUrl}/pt-BR`,
        'x-default': `${baseUrl}/en`,
      },
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'website',
      locale: OG_LOCALE[locale as SupportedLocale] ?? 'en_US',
      url: `${baseUrl}/${locale}`,
      siteName: 'diBoaS',
      images: [
        {
          url: `${baseUrl}/api/og/b2c`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@diboasfi',
      creator: '@bribeiro_br',
      title: ogTitle,
      description: ogDescription,
      images: [`${baseUrl}/api/og/b2c`],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * B2C Landing Page (route shell)
 *
 * Owns the shared, locale-param-driven shell — metadata, the 3 JSON-LD blocks,
 * the i18n + market-data providers, ScrollToHash, MinimalFooter, StickyMobileCTA —
 * and selects the per-locale section composition. Each supported locale has its
 * own Draper composition (LandingPtBR/LandingDe/LandingEs/LandingEn); the shell
 * picks one by locale. See LANDING_REBUILD_PLAN*.md.
 */
export default async function B2CLandingPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespaces + market snapshot in parallel.
  // A8 fix (2026-05-23): pre-fetch the snapshot server-side so the data-bound
  // sections render with live data on first paint instead of flipping from
  // static fallback after hydration. See TOOLS_IMPROVEMENT.md A8.
  const [pageMessages, snapshot, lbMessages] = await Promise.all([
    loadPageNamespaces(locale, ['landing-b2c', 'faq', 'share', 'dreamMode', 'preDemo', 'preDream']),
    marketDataService.get(),
    loadMessages(locale, 'landing-b2c'),
  ]);

  // Localized JSON-LD strings (so structured data is served in the page locale,
  // not English-only). English literals are kept as resilient fallbacks.
  const jsonLd = (lbMessages?.seo?.jsonLd as Record<string, string> | undefined) || {};

  // Generate structured data
  const organizationData = SEOMetadataFactory.generateServiceStructuredData({
    name: 'diBoaS',
    description:
      jsonLd.serviceDescription ||
      'Goal-driven wealth building powered by the digital dollar. Your money, your wallet, your control.',
    category: 'Financial Services',
  });

  const breadcrumbData = SEOMetadataFactory.generateBreadcrumbs(
    [{ name: jsonLd.breadcrumbHome || 'Home', url: '/' }],
    locale
  );

  const appStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'diBoaS',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      jsonLd.appDescription ||
      'Goal-driven wealth building starting at $5. Your money, your wallet, your control.',
  };

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <MarketDataContextProvider initialSnapshot={snapshot}>
        <StructuredData data={[organizationData, breadcrumbData, appStructuredData]} />
        <ScrollToHash />

        {/* Per-locale section composition. `isValidLocale` above guarantees one of
            the four supported locales, so `en` is the exhaustive final branch
            (also the x-default). See LANDING_REBUILD_PLAN*.md. */}
        {locale === 'pt-BR' ? (
          <LandingPtBR />
        ) : locale === 'de' ? (
          <LandingDe />
        ) : locale === 'es' ? (
          <LandingEs />
        ) : (
          <LandingEn />
        )}

        {/* Footer */}
        <MinimalFooter
          taglineKey="landing-b2c.footer.tagline"
          navLinks={B2C_FOOTER_NAV}
          disclosureKeys={B2C_FOOTER_DISCLOSURES}
        />

        {/* Sticky Mobile CTA — appears after hero, hides at waitlist */}
        <StickyMobileCTA />
      </MarketDataContextProvider>
    </PageI18nProvider>
  );
}
