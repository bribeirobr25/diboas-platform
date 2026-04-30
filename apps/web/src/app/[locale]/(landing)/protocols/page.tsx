import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { SEOMetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { FAQAccordion } from '@/components/Sections/FAQAccordion/FAQAccordionFactory';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { CvmBanner } from '@/components/Pages/CvmBanner';
import {
  ProtocolsHeroSection,
  ProtocolsIntroSection,
  ProtocolsGridSection,
  ProtocolsSelectionSection,
  ProtocolsTvlSection,
  ProtocolsNotIsSection,
} from '@/components/Pages/Protocols/sections';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import {
  ProtocolsTransitionHook,
} from '@/components/Pages/Protocols/ProtocolsClientSections';
import { PROTOCOLS_I18N_PREFIX, PROTOCOLS_FAQ_CONFIG } from '@/config/landing-protocols';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
import type { Metadata } from 'next';
import type { LocalePageProps } from '@/types/page';

export const dynamic = 'auto';

/**
 * Generate metadata for the Protocols page
 * Uses i18n translations for locale-aware SEO
 */
export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = isValidLocale(locale) ? locale as SupportedLocale : 'en';

  // Load translations for metadata
  const messages = await loadMessages(validLocale, 'protocols');
  const seo = messages?.seo || {};

  const title = seo.title || 'Where Your Money Works | The Protocols We Trust | diBoaS';
  const description = seo.description || 'diBoaS connects you to established decentralized finance protocols. See exactly where your money goes with full transparency.';

  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.diboas.com';

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
      site: '@diboasfi',
      creator: '@bribeiro_br',
      title: seo.ogTitle || title,
      description: seo.ogDescription || description,
      images: [`${siteUrl}/api/og/protocols`],
    },
    alternates: {
      canonical: `${siteUrl}/${validLocale}/protocols`,
      languages: {
        'en': `${siteUrl}/en/protocols`,
        'de': `${siteUrl}/de/protocols`,
        'es': `${siteUrl}/es/protocols`,
        'pt-br': `${siteUrl}/pt-BR/protocols`,
        'x-default': `${siteUrl}/en/protocols`,
      },
    },
  };
}

/**
 * Protocols Page
 *
 * Config-driven composition pattern (Phase 3E migration).
 * Each section is a self-contained client component with SectionErrorBoundary.
 *
 * - CVM Banner (PT-BR only, before Hero)
 * - Section 1: Hero with headline
 * - t1: Transition hook
 * - Section 2: Transparency (intro / why this page exists)
 * - t3: Transition hook (pivotal) — "So how much real money is in these systems?"
 * - Section 3: Total TVL (dark theme)
 * - t2: Transition hook — "How did these 26 make the list?"
 * - Section 4: Protocol Grid (25 protocols in categories)
 * - Section 5: Our Selection Process
 * - t4: Transition hook (pivotal) — "Before you go further, something important."
 * - Section 6: Attention (What This Page Is Not, warm bg)
 * - Section 7: FAQ (8 items)
 * - Section 8: Footer Disclaimers (locale-conditional)
 */
export default async function ProtocolsPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespaces (common + waitlist already provided by landing layout)
  const pageMessages = await loadPageNamespaces(locale, ['protocols', 'landing-b2c']);

  // Generate structured data
  const organizationData = SEOMetadataFactory.generateServiceStructuredData({
    name: 'diBoaS Protocol Transparency',
    description: 'Complete list of DeFi protocols used by diBoaS with security audits and regulatory information',
    category: 'Financial Technology'
  });

  const breadcrumbData = SEOMetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Protocols', url: '/protocols' }
  ], locale);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[organizationData, breadcrumbData]} />

      <main className="main-page-wrapper">
        {/* CVM Banner (PT-BR only, BEFORE Hero) */}
        <CvmBanner namespace={PROTOCOLS_I18N_PREFIX} />

        {/* Section 1: Hero */}
        <div data-section-id="hero-section-protocols">
          <ProtocolsHeroSection />
        </div>

        {/* Transition 1 */}
        <ProtocolsTransitionHook hookKey="transitions.t1" />

        {/* Section 2: Transparency (intro / why this page exists) */}
        <div data-section-id="intro-section-protocols">
          <ProtocolsIntroSection />
        </div>

        {/* Transition 3 (pivotal) — "So how much real money is in these systems?" */}
        <ProtocolsTransitionHook hookKey="transitions.t3" variant="pivotal" />

        {/* Section 3: TVL (dark theme) */}
        <div data-section-id="tvl-section-protocols">
          <ProtocolsTvlSection />
        </div>

        {/* Transition 2 — "How did these 26 make the list?" */}
        <ProtocolsTransitionHook hookKey="transitions.t2" />

        {/* Section 4: Protocol Grid */}
        <div id="protocols" data-section-id="grid-section-protocols">
          <ProtocolsGridSection />
        </div>

        {/* Section 5: Selection Process */}
        <div data-section-id="selection-section-protocols">
          <ProtocolsSelectionSection />
        </div>

        {/* Transition 4 (pivotal) — "Before you go further, something important." */}
        <ProtocolsTransitionHook hookKey="transitions.t4" variant="pivotal" />

        {/* Section 6: Attention (What This Page Is Not, warm bg) */}
        <div data-section-id="notis-section-protocols">
          <ProtocolsNotIsSection />
        </div>

        {/* Section 7: FAQ */}
        <SectionErrorBoundary
          sectionId="faq-section-protocols"
          sectionType="FAQAccordion"
          enableReporting
          context={{ page: 'protocols' }}
        >
          <div id="faq" data-section-id="faq-section-protocols">
            <FAQAccordion config={PROTOCOLS_FAQ_CONFIG} />
          </div>
        </SectionErrorBoundary>

        {/* Section 8: Footer */}
        <MinimalFooter
          taglineKey="landing-b2c.footer.tagline"
          navLinks={B2C_FOOTER_NAV}
          disclosureKeys={B2C_FOOTER_DISCLOSURES}
        />
      </main>
    </PageI18nProvider>
  );
}
