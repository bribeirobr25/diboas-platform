import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { SEOMetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { SectionContainer } from '@/components/Sections';
import { FAQAccordion } from '@/components/Sections/FAQAccordion/FAQAccordionFactory';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { CvmBanner } from '@/components/Pages/CvmBanner';
import { StrategiesMatrixSection } from '@/components/Pages/StrategiesMatrixSection';
import { StrategiesProtocolTable } from '@/components/Pages/StrategiesProtocolTable';
import { StrategyFeeTable } from '@/components/Pages/StrategyFeeTable';
import { StrategiesHowToChoose } from '@/components/Pages/StrategiesHowToChoose';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { StrategiesHeroSection } from '@/components/Pages/StrategiesClientSections';
import {
  STRATEGIES_I18N_PREFIX,
  STRATEGIES_FAQ_CONFIG,
} from '@/config/landing-strategies';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
import type { Metadata } from 'next';
import type { LocalePageProps } from '@/types/page';

export const dynamic = 'auto';

/**
 * Generate metadata for the Strategies page
 * Uses i18n translations for locale-aware SEO
 */
export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = isValidLocale(locale) ? locale as SupportedLocale : 'en';

  // Load translations for metadata
  const messages = await loadMessages(validLocale, 'strategies');
  const seo = messages?.seo || {};

  const title = seo.title || 'Investment Strategies | diBoaS';
  const description = seo.description || '10 strategies. Different goals. Different timelines. Different risk levels.';

  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.diboas.com';

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
      site: '@diboasfi',
      creator: '@bribeiro_br',
      title: seo.ogTitle || 'Find the Strategy That Fits Your Life | diBoaS',
      description: seo.ogDescription || description,
      images: [`${siteUrl}/api/og/strategies`],
    },
    alternates: {
      canonical: `${siteUrl}/${validLocale}/strategies`,
      languages: {
        'en': `${siteUrl}/en/strategies`,
        'de': `${siteUrl}/de/strategies`,
        'es': `${siteUrl}/es/strategies`,
        'pt-br': `${siteUrl}/pt-BR/strategies`,
        'x-default': `${siteUrl}/en/strategies`,
      },
    },
  };
}

/**
 * Strategies Page
 *
 * Config-driven composition pattern (Phase 3E migration).
 * Each section is a self-contained client component with SectionErrorBoundary.
 *
 * - CVM Banner (PT-BR only, before Hero)
 * - Section 1: Hero with trust line + honest limitation
 * - Section 2: Strategy Matrix (6 rows, null handling)
 * - Section 3: Strategy Cards ×10 (expanded with protocols, allocation, use cases)
 * - Section 4: Protocol Table (6 protocols, expandable)
 * - Section 5: Fee Table (invest=FREE, sell=0.39%)
 * - Section 6: How to Choose (3 questions + brand promise)
 * - Section 7: FAQ Accordion (10 items, A/B answer for "safe")
 * - Section 8: Waitlist / CTA
 * - Section 9: Footer Disclaimers (locale-conditional)
 */
export default async function StrategiesPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespaces (common + waitlist already provided by landing layout)
  const pageMessages = await loadPageNamespaces(locale, ['strategies', 'share', 'landing-b2c']);

  // Generate structured data
  const organizationData = SEOMetadataFactory.generateServiceStructuredData({
    name: 'diBoaS Investment Strategies',
    description: '10 investment strategies from conservative to aggressive for different financial goals',
    category: 'Investment Services'
  });

  const breadcrumbData = SEOMetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Strategies', url: '/strategies' }
  ], locale);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[organizationData, breadcrumbData]} />

      <main className="main-page-wrapper">
        {/* CVM Banner (PT-BR only, BEFORE Hero) */}
        <CvmBanner namespace={STRATEGIES_I18N_PREFIX} />

        {/* Section 1: Hero */}
        <StrategiesHeroSection />

        {/* Section 2: Strategy Matrix */}
        <SectionErrorBoundary sectionId="matrix-section-strategies" sectionType="StrategyMatrix" enableReporting context={{ page: 'strategies' }}>
          <div data-section-id="matrix-section-strategies">
            <SectionContainer variant="standard" padding="standard" backgroundColor="var(--section-bg-neutral)">
              <StrategiesMatrixSection />
            </SectionContainer>
          </div>
        </SectionErrorBoundary>

        {/* Strategy cards section hidden — awaiting redesign */}

        {/* Section 4: Protocol Table */}
        <SectionErrorBoundary sectionId="protocols-section-strategies" sectionType="ProtocolTable" enableReporting context={{ page: 'strategies' }}>
          <div data-section-id="protocols-section-strategies">
            <SectionContainer variant="standard" padding="standard" backgroundColor="var(--section-bg-neutral)">
              <StrategiesProtocolTable />
            </SectionContainer>
          </div>
        </SectionErrorBoundary>

        {/* Section 5: Fee Table */}
        <SectionErrorBoundary sectionId="fees-section-strategies" sectionType="FeeTable" enableReporting context={{ page: 'strategies' }}>
          <div id="fees" data-section-id="fees-section-strategies">
            <SectionContainer variant="standard" padding="standard" backgroundColor="var(--bc-color-section-bg)">
              <StrategyFeeTable />
            </SectionContainer>
          </div>
        </SectionErrorBoundary>

        {/* Section 6: How to Choose */}
        <SectionErrorBoundary sectionId="how-to-choose-section" sectionType="HowToChoose" enableReporting context={{ page: 'strategies' }}>
          <div data-section-id="how-to-choose-section">
            <SectionContainer variant="narrow" padding="standard" backgroundColor="var(--section-bg-neutral)">
              <StrategiesHowToChoose />
            </SectionContainer>
          </div>
        </SectionErrorBoundary>

        {/* Section 7: FAQ */}
        <SectionErrorBoundary sectionId="faq-section-strategies" sectionType="FAQAccordion" enableReporting context={{ page: 'strategies' }}>
          <div id="faq" data-section-id="faq-section-strategies">
            <FAQAccordion config={STRATEGIES_FAQ_CONFIG} />
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
