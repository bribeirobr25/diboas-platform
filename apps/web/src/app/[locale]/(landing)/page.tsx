import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { generateStaticPageMetadata, MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { HeroSection, FAQAccordion, FeatureShowcase } from '@/components/Sections';
import { ProductCarouselFactory } from '@/components/Sections/ProductCarousel';
import { BenefitsCardsSection } from '@/components/Sections/BenefitsCards';
import { DemoEmbedSection } from '@/components/Sections/DemoEmbed';
import { CalculatorSection } from '@/components/Sections/CalculatorSection';
import { WaitlistSection } from '@/components/Sections/WaitlistSection';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { PageI18nProvider } from '@/components/PageI18nProvider';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import {
  B2C_HERO_CONFIG,
  B2C_HOW_IT_WORKS_CONFIG,
  B2C_ORIGIN_STORY_CONFIG,
  B2C_FEATURES_CONFIG,
  B2C_SOCIAL_PROOF_CONFIG,
  B2C_DEMO_CONFIG,
  B2C_FAQ_CONFIG
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://diboas.com';
  return {
    title: 'diBoaS - Make Your Money Work',
    description: 'Turn your idle money into real growth. Start with just €5. Withdraw anytime. No crypto knowledge required.',
    keywords: ['yield', 'savings', 'DeFi', 'stablecoin', 'earn interest', 'passive income', 'finance app'],
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        'en': `${baseUrl}/en`,
        'de': `${baseUrl}/de`,
        'es': `${baseUrl}/es`,
        'pt-BR': `${baseUrl}/pt-BR`,
        'x-default': `${baseUrl}/en`,
      },
    },
    openGraph: {
      title: 'diBoaS - Make Your Money Work',
      description: 'Turn your idle money into real growth. Start with just €5.',
      type: 'website',
      locale: locale,
      url: `${baseUrl}/${locale}`,
      siteName: 'diBoaS',
      images: [
        {
          url: `${baseUrl}/api/og/b2c`,
          width: 1200,
          height: 630,
          alt: 'diBoaS - Make Your Money Work',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'diBoaS - Make Your Money Work',
      description: 'Turn your idle money into real growth. Start with just €5.',
      images: [`${baseUrl}/api/og/b2c`],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * B2C Landing Page
 *
 * Landing page for consumer audience featuring:
 * - Section 1: Hero with headline and CTA
 * - Section 2: Origin Story (Grandmother story)
 * - Section 3: How It Works (3 steps)
 * - Section 4: Future You Calculator
 * - Section 5: Feature Showcase (EARN, SEND, INVEST, GOALS)
 * - Section 6: Interactive Demo
 * - Section 7: Social Proof
 * - Section 8: FAQ
 * - Section 9: Final CTA / Waitlist
 */
export default async function B2CLandingPage({ params }: B2CLandingPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespaces (including calculator and waitlist for new sections)
  const pageMessages = await loadPageNamespaces(locale, ['landing-b2c', 'calculator', 'waitlist', 'share', 'dreamMode']);

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
        {/* Section 1: Hero */}
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

        {/* Section 2: Origin Story (Grandmother) */}
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

        {/* Section 3: How It Works */}
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

        {/* Section 4: Future You Calculator */}
        <SectionErrorBoundary
          sectionId="calculator-section-b2c"
          sectionType="CalculatorSection"
          enableReporting={true}
          context={{ page: 'landing-b2c' }}
        >
          <div id="calculator">
            <CalculatorSection enableAnalytics={true} />
          </div>
        </SectionErrorBoundary>

        {/* Section 5: Feature Showcase (EARN, SEND, INVEST, GOALS) */}
        <SectionErrorBoundary
          sectionId="features-section-b2c"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'landing-b2c' }}
        >
          <div id="features">
            <BenefitsCardsSection
              config={B2C_FEATURES_CONFIG}
              variant="default"
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 6: Demo */}
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

        {/* Section 7: Social Proof */}
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

        {/* Section 8: FAQ */}
        <SectionErrorBoundary
          sectionId="faq-section-b2c"
          sectionType="FAQAccordion"
          enableReporting={true}
          context={{ page: 'landing-b2c' }}
        >
          <FAQAccordion config={B2C_FAQ_CONFIG} />
        </SectionErrorBoundary>

        {/* Section 9: Final CTA / Waitlist */}
        <SectionErrorBoundary
          sectionId="waitlist-section-b2c"
          sectionType="WaitlistSection"
          enableReporting={true}
          context={{ page: 'landing-b2c' }}
        >
          <div id="waitlist">
            <WaitlistSection enableAnalytics={true} />
          </div>
        </SectionErrorBoundary>
      </main>
    </PageI18nProvider>
  );
}
