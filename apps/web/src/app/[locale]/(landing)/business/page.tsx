import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { HeroSection, FAQAccordion, FeatureShowcase } from '@/components/Sections';
import { AppFeaturesCarousel } from '@/components/Sections/AppFeaturesCarousel';
import { ProductCarouselFactory } from '@/components/Sections/ProductCarousel';
import { BenefitsCardsSection } from '@/components/Sections/BenefitsCards';
import { TreasuryCalculator } from '@/components/Sections/TreasuryCalculator';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { PageI18nProvider } from '@/components/PageI18nProvider';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import {
  B2B_HERO_CONFIG,
  B2B_PROBLEM_CONFIG,
  B2B_CALCULATOR_CONFIG,
  B2B_HOW_IT_WORKS_CONFIG,
  B2B_TRUST_CONFIG,
  B2B_USE_CASES_CONFIG,
  B2B_SOCIAL_PROOF_CONFIG,
  B2B_FAQ_CONFIG,
  B2B_PROCESS_CONFIG,
  B2B_FINAL_CTA_CONFIG
} from '@/config/landing-b2b';
import type { Metadata } from 'next';

export const dynamic = 'auto';

interface B2BLandingPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Generate metadata for the B2B landing page
 */
export async function generateMetadata({ params }: B2BLandingPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'diBoaS Treasury | Earn 6-8% on Startup Operating Cash',
    description: 'Put your startup\'s idle treasury to work. Earn 6-8% yield on operating cash with same-day liquidity. EU-regulated. Non-custodial. Book a 15-min conversation.',
    openGraph: {
      title: 'Your startup\'s treasury is earning 0%. Let\'s fix that.',
      description: 'diBoaS Treasury: 6-8% yield on operating cash. Same-day liquidity. No lock-ups. EU-regulated.',
      type: 'website'
    }
  };
}

/**
 * B2B Landing Page - Treasury Management for Startups
 *
 * Comprehensive landing page for business audience featuring:
 * - Hero with headline and CTA
 * - Problem section explaining treasury inefficiency
 * - Interactive yield calculator
 * - How it works (4 steps)
 * - Trust & compliance badges
 * - Use cases
 * - Social proof & metrics
 * - FAQ
 * - Getting started process
 * - Final CTA
 */
export default async function B2BLandingPage({ params }: B2BLandingPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespaces
  const pageMessages = await loadPageNamespaces(locale, ['landing-b2b']);

  // Generate structured data
  const organizationData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS Treasury',
    description: 'Treasury management for startups - earn 6-8% on operating cash',
    category: 'Financial Services'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Business', url: '/business' }
  ], locale);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[organizationData, breadcrumbData]} />

      <main className="main-page-wrapper">
        {/* Hero Section */}
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

        {/* Section 1: The Problem */}
        <SectionErrorBoundary
          sectionId="problem-section-b2b"
          sectionType="FeatureShowcase"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <FeatureShowcase
            variant="default"
            config={B2B_PROBLEM_CONFIG}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>

        {/* Section 2: Interactive Calculator */}
        <SectionErrorBoundary
          sectionId="calculator-section-b2b"
          sectionType="TreasuryCalculator"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <TreasuryCalculator
            config={B2B_CALCULATOR_CONFIG}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>

        {/* Section 3: How It Works */}
        <SectionErrorBoundary
          sectionId="how-it-works-section-b2b"
          sectionType="AppFeaturesCarousel"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <div id="how-it-works">
            <AppFeaturesCarousel
              config={B2B_HOW_IT_WORKS_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 4: Trust & Compliance */}
        <SectionErrorBoundary
          sectionId="trust-section-b2b"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <BenefitsCardsSection
            config={B2B_TRUST_CONFIG}
            variant="default"
            enableAnalytics={true}
          />
        </SectionErrorBoundary>

        {/* Section 5: Use Cases */}
        <SectionErrorBoundary
          sectionId="use-cases-section-b2b"
          sectionType="ProductCarousel"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <div id="use-cases">
            <ProductCarouselFactory
              config={B2B_USE_CASES_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 6: Social Proof */}
        <SectionErrorBoundary
          sectionId="social-proof-section-b2b"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <BenefitsCardsSection
            config={B2B_SOCIAL_PROOF_CONFIG}
            variant="default"
            enableAnalytics={true}
          />
        </SectionErrorBoundary>

        {/* Section 7: FAQ */}
        <SectionErrorBoundary
          sectionId="faq-section-b2b"
          sectionType="FAQAccordion"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <FAQAccordion config={B2B_FAQ_CONFIG} />
        </SectionErrorBoundary>

        {/* Section 8: The Process */}
        <SectionErrorBoundary
          sectionId="process-section-b2b"
          sectionType="AppFeaturesCarousel"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <div id="process">
            <AppFeaturesCarousel
              config={B2B_PROCESS_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 9: Final CTA */}
        <SectionErrorBoundary
          sectionId="final-cta-b2b"
          sectionType="FeatureShowcase"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <div id="final-cta">
            <FeatureShowcase
              variant="default"
              config={B2B_FINAL_CTA_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>
      </main>
    </PageI18nProvider>
  );
}
