import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale, loadMessages } from '@diboas/i18n/server';
import { MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import {
  HeroSection,
  FAQAccordion,
  FeatureShowcase,
  ProseSection,
  ScenarioCards,
  FeeTable,
  DemoLauncher,
} from '@/components/Sections';
import { SocialProofSection } from '@/components/Sections/SocialProofSection/SocialProofSection';
import { ProductCarouselFactory } from '@/components/Sections/ProductCarousel';
import { WaitlistSection } from '@/components/Sections/WaitlistSection';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { ScrollToHash } from '@/components/Layout/ScrollToHash';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import {
  B2C_HERO_CONFIG,
  B2C_ORIGIN_STORY_CONFIG,
  B2C_HOW_IT_WORKS_CONFIG,
  B2C_SCENARIOS_CONFIG,
  B2C_FEATURES_CONFIG,
  B2C_FEES_CONFIG,
  B2C_CATCH_CONFIG,
  B2C_DEMO_CONFIG,
  B2C_WAITLIST_CONFIG,
  B2C_FAQ_CONFIG,
  B2C_FOOTER_NAV,
  B2C_FOOTER_DISCLOSURES,
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
      title: ogTitle,
      description: ogDescription,
      type: 'website',
      locale: locale,
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
 * B2C Landing Page
 *
 * 11-section layout:
 * 1. Hero — Full background with headline and CTA
 * 2. Origin Story — "Why This Exists" (ProseSection)
 * 3. How It Works — 3-step ProductCarousel
 * 4. Scenarios — Real-life scenario cards
 * 5. Features — Feature showcase slides
 * 6. Fees — Transparent fee table
 * 7. What's the Catch? — Honest transparency (ProseSection)
 * 8. Demo — Interactive demo embed
 * 9. Waitlist — Email signup with counter
 * 10. FAQ — 5 CLO-approved Q&A items
 * 11. Footer — Tagline, nav, disclosures
 */
export default async function B2CLandingPage({ params }: B2CLandingPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespaces
  const pageMessages = await loadPageNamespaces(locale, ['landing-b2c', 'calculator', 'waitlist', 'share', 'dreamMode', 'preDemo', 'preDream']);

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
      <ScrollToHash />

      <div className="main-page-wrapper">
        {/* Section 1: Hero */}
        <SectionErrorBoundary
          sectionId="hero-section-b2c"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'landing-b2c', variant: 'fullBackground' }}
        >
          <div data-section-id="hero-section-b2c">
            <HeroSection
              variant="fullBackground"
              config={B2C_HERO_CONFIG}
              enableAnalytics={true}
              priority={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 2: Origin Story — "Why This Exists" */}
        <SectionErrorBoundary
          sectionId="origin-story-section-b2c"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c' }}
        >
          <div id="our-story" data-section-id="origin-story-section-b2c">
            <ProseSection
              config={B2C_ORIGIN_STORY_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 3: How It Works — 3 Steps */}
        <SectionErrorBoundary
          sectionId="how-it-works-section-b2c"
          sectionType="ProductCarousel"
          enableReporting={true}
          context={{ page: 'landing-b2c' }}
        >
          <div id="how-it-works" data-section-id="how-it-works-section-b2c">
            <ProductCarouselFactory
              config={B2C_HOW_IT_WORKS_CONFIG}
              enableAnalytics={true}
              backgroundColor="var(--section-bg-neutral)"
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 4: Scenarios — Real People, Real Moments */}
        <SectionErrorBoundary
          sectionId="scenarios-section-b2c"
          sectionType="ScenarioCards"
          enableReporting={true}
          context={{ page: 'landing-b2c' }}
        >
          <div id="scenarios" data-section-id="scenarios-section-b2c">
            <ScenarioCards
              config={B2C_SCENARIOS_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 5: Features — Send, Invest, Always On */}
        <SectionErrorBoundary
          sectionId="features-section-b2c"
          sectionType="FeatureShowcase"
          enableReporting={true}
          context={{ page: 'landing-b2c' }}
        >
          <div id="features" data-section-id="features-section-b2c">
            <FeatureShowcase
              variant="default"
              config={B2C_FEATURES_CONFIG}
              enableAnalytics={true}
              backgroundColor="var(--section-bg-neutral)"
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 6: Fees — Transparent Pricing */}
        <SectionErrorBoundary
          sectionId="fees-section-b2c"
          sectionType="FeeTable"
          enableReporting={true}
          context={{ page: 'landing-b2c' }}
        >
          <div id="fees" data-section-id="fees-section-b2c">
            <FeeTable
              config={B2C_FEES_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 7: What's the Catch? */}
        <SectionErrorBoundary
          sectionId="catch-section-b2c"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'landing-b2c' }}
        >
          <div id="the-catch" data-section-id="catch-section-b2c">
            <ProseSection
              config={B2C_CATCH_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 8: Demo — PreDemo + PreDream launchers */}
        <SectionErrorBoundary
          sectionId="demo-section-b2c"
          sectionType="DemoLauncher"
          enableReporting={true}
          context={{ page: 'landing-b2c' }}
        >
          <div id="demo" data-section-id="demo-section-b2c">
            <DemoLauncher config={B2C_DEMO_CONFIG} enableAnalytics={true} />
          </div>
        </SectionErrorBoundary>

        {/* Section 9: Social Proof */}
        <SectionErrorBoundary
          sectionId="social-proof-section-b2c"
          sectionType="SocialProofSection"
          enableReporting={true}
          context={{ page: 'landing-b2c' }}
        >
          <div data-section-id="social-proof-section-b2c">
            <SocialProofSection
              namespace="landing-b2c.socialProof"
              enableAnalytics={true}
              ctaText="cta"
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 10: Waitlist */}
        <SectionErrorBoundary
          sectionId="waitlist-section-b2c"
          sectionType="WaitlistSection"
          enableReporting={true}
          context={{ page: 'landing-b2c' }}
        >
          <div id="waitlist" data-section-id="waitlist-section-b2c">
            <WaitlistSection
              enableAnalytics={true}
              config={{
                sectionId: B2C_WAITLIST_CONFIG.sectionId,
                backgroundColor: B2C_WAITLIST_CONFIG.backgroundColor,
              }}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 10: FAQ */}
        <SectionErrorBoundary
          sectionId="faq-section-b2c"
          sectionType="FAQAccordion"
          enableReporting={true}
          context={{ page: 'landing-b2c' }}
        >
          <div id="faq" data-section-id="faq-section-b2c">
            <FAQAccordion
              config={B2C_FAQ_CONFIG}
            />
          </div>
        </SectionErrorBoundary>
      </div>

      {/* Section 11: Footer */}
      <MinimalFooter
        taglineKey="landing-b2c.footer.tagline"
        navLinks={B2C_FOOTER_NAV}
        disclosureKeys={B2C_FOOTER_DISCLOSURES}
      />
    </PageI18nProvider>
  );
}
