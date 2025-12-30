import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { generateStaticPageMetadata, MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { HeroSection, FAQAccordion, FeatureShowcase } from '@/components/Sections';
import { ProductCarouselFactory } from '@/components/Sections/ProductCarousel';
import { BenefitsCardsSection } from '@/components/Sections/BenefitsCards';
import { BgHighlightSection } from '@/components/Sections/BgHighlight';
import { DemoEmbedSection } from '@/components/Sections/DemoEmbed';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { PageI18nProvider } from '@/components/PageI18nProvider';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import {
  B2C_HERO_CONFIG,
  B2C_PROBLEM_CONFIG,
  B2C_HOW_IT_WORKS_CONFIG,
  B2C_ORIGIN_STORY_CONFIG,
  B2C_SOCIAL_PROOF_CONFIG,
  B2C_DEMO_CONFIG,
  B2C_FAQ_CONFIG,
  B2C_FINAL_CTA_CONFIG
} from '@/config/landing-b2c';
import type { Metadata } from 'next';

export const dynamic = 'auto';

interface B2CLandingPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Generate metadata for the B2C landing page
 */
export async function generateMetadata({ params }: B2CLandingPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'diBoaS - Make Your Money Work',
    description: 'Turn your idle money into real growth. Start with just \u20ac5. Withdraw anytime. No crypto knowledge required.',
    openGraph: {
      title: 'diBoaS - Make Your Money Work',
      description: 'Turn your idle money into real growth. Start with just \u20ac5.',
      type: 'website'
    }
  };
}

/**
 * B2C Landing Page
 *
 * Simplified landing page for consumer audience featuring:
 * - Hero with headline and CTA
 * - Problem section explaining the issue with traditional savings
 * - How it works (3 steps)
 * - Social proof
 * - Interactive demo
 * - FAQ
 * - Final CTA
 */
export default async function B2CLandingPage({ params }: B2CLandingPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespaces
  const pageMessages = await loadPageNamespaces(locale, ['landing-b2c']);

  // Generate structured data
  const organizationData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS',
    description: 'Turn your idle money into real growth with DeFi yields',
    category: 'Financial Services'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' }
  ], locale);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[organizationData, breadcrumbData]} />

      <main className="main-page-wrapper">
        {/* Hero Section */}
        <SectionErrorBoundary
          sectionId="hero-section-b2c"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', variant: 'fullBackground' }}
        >
          <HeroSection
            variant="fullBackground"
            config={B2C_HERO_CONFIG}
            enableAnalytics={true}
            priority={true}
          />
        </SectionErrorBoundary>

        {/* Problem Section (The Problem) */}
        <SectionErrorBoundary
          sectionId="problem-section-b2c"
          sectionType="FeatureShowcase"
          enableReporting={true}
          context={{ page: 'landing-b2c' }}
        >
          <FeatureShowcase
            variant="default"
            config={B2C_PROBLEM_CONFIG}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>

        {/* How It Works Section */}
        <SectionErrorBoundary
          sectionId="how-it-works-section-b2c"
          sectionType="ProductCarousel"
          enableReporting={true}
          context={{ page: 'landing-b2c' }}
        >
          <div id="how-it-works">
            <ProductCarouselFactory
              config={B2C_HOW_IT_WORKS_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Why We Built This - Origin Story Section */}
        <SectionErrorBoundary
          sectionId="origin-story-section-b2c"
          sectionType="FeatureShowcase"
          enableReporting={true}
          context={{ page: 'landing-b2c' }}
        >
          <div id="our-story">
            <FeatureShowcase
              variant="default"
              config={B2C_ORIGIN_STORY_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Social Proof Section */}
        <SectionErrorBoundary
          sectionId="social-proof-section-b2c"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'landing-b2c' }}
        >
          <BenefitsCardsSection
            config={B2C_SOCIAL_PROOF_CONFIG}
            variant="default"
            enableAnalytics={true}
          />
        </SectionErrorBoundary>

        {/* Demo Section */}
        <SectionErrorBoundary
          sectionId="demo-section-b2c"
          sectionType="DemoEmbed"
          enableReporting={true}
          context={{ page: 'landing-b2c' }}
        >
          <div id="demo">
            <DemoEmbedSection
              config={B2C_DEMO_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* FAQ Section */}
        <SectionErrorBoundary
          sectionId="faq-section-b2c"
          sectionType="FAQAccordion"
          enableReporting={true}
          context={{ page: 'landing-b2c' }}
        >
          <FAQAccordion config={B2C_FAQ_CONFIG} />
        </SectionErrorBoundary>

        {/* Final CTA Section */}
        <SectionErrorBoundary
          sectionId="final-cta-b2c"
          sectionType="BgHighlight"
          enableReporting={true}
          context={{ page: 'landing-b2c' }}
        >
          <div id="waitlist">
            <BgHighlightSection
              config={B2C_FINAL_CTA_CONFIG}
              enableAnalytics={true}
              priority={false}
            />
          </div>
        </SectionErrorBoundary>
      </main>
    </PageI18nProvider>
  );
}
