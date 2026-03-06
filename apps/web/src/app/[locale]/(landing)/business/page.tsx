import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale, loadMessages } from '@diboas/i18n/server';
import { MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import {
  HeroSection,
  FAQAccordion,
  ProseSection,
  FeeTable,
  FounderSection,
  CalculatorFactory,
  TwoWorldsSection,
  DualCtaSection,
  CashflowExplainerSection,
} from '@/components/Sections';
import { AppFeaturesCarousel } from '@/components/Sections/AppFeaturesCarousel';
import { BenefitsCardsSection } from '@/components/Sections/BenefitsCards';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { ScrollToHash } from '@/components/Layout/ScrollToHash';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import {
  B2B_HERO_CONFIG,
  B2B_TWO_WORLDS_CONFIG,
  B2B_CASHFLOW_CALCULATOR_CONFIG,
  B2B_CALCULATOR_CONFIG,
  B2B_ORIGIN_STORY_CONFIG,
  B2B_HOW_IT_WORKS_CONFIG,
  B2B_FEATURES_CONFIG,
  B2B_CASHFLOW_INVESTING_CONFIG,
  B2B_FEES_CONFIG,
  B2B_FIT_ASSESSMENT_CONFIG,
  B2B_FOUNDER_CONFIG,
  B2B_DUAL_CTA_CONFIG,
  B2B_FAQ_CONFIG,
  B2B_FOOTER_NAV,
  B2B_FOOTER_DISCLOSURES,
} from '@/config/landing-b2b';
import type { Metadata } from 'next';
import type { LocalePageProps } from '@/types/page';

export const dynamic = 'auto';

/**
 * Generate metadata for the B2B landing page
 */
export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://diboas.com';

  const messages = await loadMessages(locale as SupportedLocale, 'landing-b2b');
  const seo = messages.seo || {};

  const title = seo.title || 'diBoaS for Business | Stop Overpaying on Fees and Idle Cash';
  const description = seo.description || 'Your card processor takes 2 to 3%. Your bank pays you almost nothing. diBoaS helps you keep more.';
  const ogTitle = seo.ogTitle || title;
  const ogDescription = seo.ogDescription || description;

  return {
    title,
    description,
    keywords: ['treasury management', 'startup finance', 'returns', 'operating cash', 'business payments', 'B2B fintech'],
    alternates: {
      canonical: `${baseUrl}/${locale}/business`,
      languages: {
        'en': `${baseUrl}/en/business`,
        'de': `${baseUrl}/de/business`,
        'es': `${baseUrl}/es/business`,
        'pt-BR': `${baseUrl}/pt-BR/business`,
        'x-default': `${baseUrl}/en/business`,
      },
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'website',
      locale: locale,
      url: `${baseUrl}/${locale}/business`,
      siteName: 'diBoaS',
      images: [
        {
          url: `${baseUrl}/api/og/b2b`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [`${baseUrl}/api/og/b2b`],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * B2B Landing Page — 14-section layout
 *
 * 1. Hero
 * 2. Two Worlds (self-selection cards)
 * 3. Cashflow Calculator (fee savings)
 * 4. Treasury Calculator (idle cash growth)
 * 5. How It Works (4 steps)
 * 6. Three Features (3 cards)
 * 7. Cashflow Investing (Save it + Grow it)
 * 8. Origin Story (Adelaide / Grandmother)
 * 9. Fee Transparency (FeeTable)
 * 10. Fit Assessment (Good Fit / Not a Fit)
 * 11. About the Founder
 * 12. Dual CTA (Waitlist + Book a conversation)
 * 13. FAQ (10 items)
 * 14. Footer (MinimalFooter)
 */
export default async function B2BLandingPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const pageMessages = await loadPageNamespaces(locale, ['landing-b2b', 'waitlist']);

  const organizationData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS for Business',
    description: 'Stop overpaying on fees and idle cash. Free payments, instant transfers, and your idle cash working for you.',
    category: 'Financial Services'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Business', url: '/business' }
  ], locale);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[organizationData, breadcrumbData]} />
      <ScrollToHash />

      <div className="main-page-wrapper">
        {/* Section 1: Hero */}
        <SectionErrorBoundary
          sectionId="hero-section-b2b"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'landing-b2b', variant: 'fullBackground' }}
        >
          <HeroSection
            variant="fullBackground"
            config={B2B_HERO_CONFIG}
            enableAnalytics={true}
            priority={true}
          />
        </SectionErrorBoundary>

        {/* Section 2: Two Worlds */}
        <SectionErrorBoundary
          sectionId="two-worlds-section-b2b"
          sectionType="TwoWorldsSection"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <div id="two-worlds" data-section-id="two-worlds-section-b2b">
            <TwoWorldsSection
              config={B2B_TWO_WORLDS_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 3: Cashflow Calculator */}
        <SectionErrorBoundary
          sectionId="cashflow-calculator-section-b2b"
          sectionType="CalculatorFactory"
          enableReporting={true}
          context={{ page: 'landing-b2b', variant: 'cashflow' }}
        >
          <div id="cashflow-calculator" data-section-id="cashflow-calculator-section-b2b">
            <CalculatorFactory
              config={B2B_CASHFLOW_CALCULATOR_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 4: Treasury Calculator */}
        <SectionErrorBoundary
          sectionId="treasury-calculator-section-b2b"
          sectionType="CalculatorFactory"
          enableReporting={true}
          context={{ page: 'landing-b2b', variant: 'treasury' }}
        >
          <div id="treasury-calculator" data-section-id="treasury-calculator-section-b2b">
            <CalculatorFactory
              config={B2B_CALCULATOR_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 5: How It Works */}
        <SectionErrorBoundary
          sectionId="how-it-works-section-b2b"
          sectionType="AppFeaturesCarousel"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <div id="how-it-works" data-section-id="how-it-works-section-b2b">
            <AppFeaturesCarousel
              config={B2B_HOW_IT_WORKS_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 6: Three Features */}
        <SectionErrorBoundary
          sectionId="features-section-b2b"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <div id="features" data-section-id="features-section-b2b">
            <BenefitsCardsSection
              config={B2B_FEATURES_CONFIG}
              variant="default"
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 7: Cashflow Investing */}
        <SectionErrorBoundary
          sectionId="cashflow-investing-section-b2b"
          sectionType="CashflowExplainerSection"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <div id="cashflow-investing" data-section-id="cashflow-investing-section-b2b">
            <CashflowExplainerSection
              config={B2B_CASHFLOW_INVESTING_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 8: Origin Story */}
        <SectionErrorBoundary
          sectionId="origin-story-section-b2b"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <div id="origin-story" data-section-id="origin-story-section-b2b">
            <ProseSection
              config={B2B_ORIGIN_STORY_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 9: Fee Transparency */}
        <SectionErrorBoundary
          sectionId="fees-section-b2b"
          sectionType="FeeTable"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <div id="fees" data-section-id="fees-section-b2b">
            <FeeTable
              config={B2B_FEES_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 10: Fit Assessment */}
        <SectionErrorBoundary
          sectionId="fit-assessment-section-b2b"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <div id="fit-assessment" data-section-id="fit-assessment-section-b2b">
            <BenefitsCardsSection
              config={B2B_FIT_ASSESSMENT_CONFIG}
              variant="default"
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 11: About the Founder */}
        <SectionErrorBoundary
          sectionId="founder-section-b2b"
          sectionType="FounderSection"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <div id="founder" data-section-id="founder-section-b2b">
            <FounderSection
              config={B2B_FOUNDER_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 12: Dual CTA */}
        <SectionErrorBoundary
          sectionId="dual-cta-section-b2b"
          sectionType="DualCtaSection"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <div id="dual-cta" data-section-id="dual-cta-section-b2b">
            <DualCtaSection
              config={B2B_DUAL_CTA_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 13: FAQ */}
        <SectionErrorBoundary
          sectionId="faq-section-b2b"
          sectionType="FAQAccordion"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <div id="faq" data-section-id="faq-section-b2b">
            <FAQAccordion
              config={B2B_FAQ_CONFIG}
            />
          </div>
        </SectionErrorBoundary>
      </div>

      {/* Section 14: Footer */}
      <MinimalFooter
        taglineKey="landing-b2b.footer.tagline"
        copyrightKey="landing-b2b.footer.copyright"
        navLinks={B2B_FOOTER_NAV}
        disclosureKeys={B2B_FOOTER_DISCLOSURES}
      />
    </PageI18nProvider>
  );
}
