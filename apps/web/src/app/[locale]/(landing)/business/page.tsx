import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale, loadMessages } from '@diboas/i18n/server';
import { MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { HeroSection, FAQAccordion, FeatureShowcase } from '@/components/Sections';
import { AppFeaturesCarousel } from '@/components/Sections/AppFeaturesCarousel';
import { BenefitsCardsSection } from '@/components/Sections/BenefitsCards';
import { TreasuryCalculator } from '@/components/Sections/TreasuryCalculator';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { PageI18nProvider } from '@/components/PageI18nProvider';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import {
  B2B_HERO_CONFIG,
  B2B_THE_MATH_CONFIG,
  B2B_ORIGIN_STORY_CONFIG,
  B2B_CALCULATOR_CONFIG,
  B2B_HOW_IT_WORKS_CONFIG,
  B2B_FEATURES_CONFIG,
  B2B_TRUST_CONFIG,
  B2B_FIT_ASSESSMENT_CONFIG,
  B2B_FAQ_CONFIG,
  B2B_SOCIAL_PROOF_CONFIG,
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://diboas.com';

  // Load translations for SEO metadata
  const messages = await loadMessages(locale as SupportedLocale, 'landing-b2b');
  const seo = messages.seo || {};

  const title = seo.title || 'diBoaS Treasury | Earn 6-8% on Operating Cash';
  const description = seo.description || 'Put your startup treasury to work.';
  const ogTitle = seo.ogTitle || title;
  const ogDescription = seo.ogDescription || description;

  return {
    title,
    description,
    keywords: ['treasury management', 'startup finance', 'yield', 'operating cash', 'DeFi', 'B2B fintech'],
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
 * B2B Landing Page - Treasury Management for Startups
 *
 * Landing page for business audience featuring:
 * - Section 1: Hero with headline and CTA
 * - Section 2: The Math (comparison table)
 * - Section 3: Origin Story (Grandmother story)
 * - Section 4: Interactive Calculator
 * - Section 5: How It Works (4 steps)
 * - Section 6: More Than Yield (4 features)
 * - Section 7: Trust & Compliance
 * - Section 8: Is This Right For You (Fit Assessment)
 * - Section 9: FAQ
 * - Section 10: Social Proof
 * - Section 11: Final CTA
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

        {/* Section 2: The Math */}
        <SectionErrorBoundary
          sectionId="the-math-section-b2b"
          sectionType="FeatureShowcase"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <div id="the-math">
            <FeatureShowcase
              variant="default"
              config={B2B_THE_MATH_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 3: Origin Story (Grandmother) */}
        <SectionErrorBoundary
          sectionId="origin-story-section-b2b"
          sectionType="FeatureShowcase"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <div id="origin-story">
            <FeatureShowcase
              variant="default"
              config={B2B_ORIGIN_STORY_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 4: Interactive Calculator */}
        <SectionErrorBoundary
          sectionId="calculator-section-b2b"
          sectionType="TreasuryCalculator"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <div id="calculator">
            <TreasuryCalculator
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
          <div id="how-it-works">
            <AppFeaturesCarousel
              config={B2B_HOW_IT_WORKS_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 6: More Than Yield (Features) */}
        <SectionErrorBoundary
          sectionId="features-section-b2b"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <div id="features">
            <BenefitsCardsSection
              config={B2B_FEATURES_CONFIG}
              variant="default"
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 7: Trust & Compliance */}
        <SectionErrorBoundary
          sectionId="trust-section-b2b"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <div id="trust">
            <BenefitsCardsSection
              config={B2B_TRUST_CONFIG}
              variant="default"
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 8: Is This Right For You (Fit Assessment) */}
        <SectionErrorBoundary
          sectionId="fit-assessment-section-b2b"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <div id="fit-assessment">
            <BenefitsCardsSection
              config={B2B_FIT_ASSESSMENT_CONFIG}
              variant="default"
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 9: FAQ */}
        <SectionErrorBoundary
          sectionId="faq-section-b2b"
          sectionType="FAQAccordion"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <FAQAccordion config={B2B_FAQ_CONFIG} />
        </SectionErrorBoundary>

        {/* Section 10: Social Proof */}
        <SectionErrorBoundary
          sectionId="social-proof-section-b2b"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'landing-b2b' }}
        >
          <div id="social-proof">
            <BenefitsCardsSection
              config={B2B_SOCIAL_PROOF_CONFIG}
              variant="default"
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 11: Final CTA */}
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
