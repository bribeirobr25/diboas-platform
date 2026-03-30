import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale, loadMessages } from '@diboas/i18n/server';
import { SEOMetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import {
  HeroSection,
  FAQAccordion,
  ProseSection,
  FeeTable,
  DemoLauncher,
  ExpandableSection,
  FounderSection,
  ComparisonTable,
  GoalExampleCards,
  SidePocketStrip,
  FoundingMembersSection,
  HowItWorksGrid,
} from '@/components/Sections';
import { AppFeaturesCarousel } from '@/components/Sections/AppFeaturesCarousel';
import { WaitlistSection } from '@/components/Sections/WaitlistSection';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { ScrollToHash } from '@/components/Layout/ScrollToHash';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { ScrollReveal, StickyMobileCTA } from '@/components/UI';
import {
  B2C_HERO_CONFIG,
  B2C_ORIGIN_STORY_CONFIG,
  B2C_HOW_IT_WORKS_CONFIG,
  B2C_FEES_CONFIG,
  B2C_CATCH_CONFIG,
  B2C_UNDER_THE_HOOD_CONFIG,
  B2C_DEMO_CONFIG,
  B2C_WAITLIST_CONFIG,
  B2C_FOUNDER_CONFIG,
  B2C_FAQ_CONFIG,
  B2C_FOOTER_NAV,
  B2C_FOOTER_DISCLOSURES,
} from '@/config/landing-b2c';
import type { Metadata } from 'next';
import type { LocalePageProps } from '@/types/page';

export const dynamic = 'auto';

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
 * 15-section layout + footer:
 * 1.  Hero — Full dark background with headline and CTA
 * 2.  ComparisonTable — "$1,000. 1 year. You decide." rate comparison
 * 3.  GoalExampleCards — "Let's make it simple." expandable goal cards
 * 4.  SidePocketStrip — Brand-tinted breathing strip
 * 5.  Adelaide Story — "Her name was Adelaide." (ProseSection)
 * 6.  How It Works (Detailed) — 3-card static grid explaining the mechanism
 * 7.  Money That Moves — 4-card AppFeaturesCarousel (Send, Invest, Track, Buy)
 * 8.  Fee Table — Transparent fee table (5 columns)
 * 9.  What's the Catch? — Honest transparency (ProseSection, dark background)
 * 10. Under the Hood — Expandable technical details
 * 11. Demo — Interactive demo embed
 * 12. Founding Members — Social proof wrapper with zero-state logic
 * 13. Built by Bar — Founder story + contact
 * 14. Waitlist — Email signup (dark background)
 * 15. FAQ — 16+ CLO-approved Q&A items
 *     Footer — Tagline, nav, disclosures
 */
export default async function B2CLandingPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespaces (waitlist already provided by landing layout)
  const pageMessages = await loadPageNamespaces(locale, ['landing-b2c', 'share', 'dreamMode', 'preDemo', 'preDream']);

  // Generate structured data
  const organizationData = SEOMetadataFactory.generateServiceStructuredData({
    name: 'diBoaS',
    description: 'Turn your idle money into real growth with DeFi yields',
    category: 'Financial Services'
  });

  const breadcrumbData = SEOMetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' }
  ], locale);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[organizationData, breadcrumbData]} />
      <ScrollToHash />

      <div className="main-page-wrapper">
        {/* Section 1: Hero — dark bg, NO scroll reveal (visible on load) */}
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

        {/* Section 2: Comparison Table — neutral bg */}
        <ScrollReveal>
          <SectionErrorBoundary
            sectionId="comparison-section-b2c"
            sectionType="ComparisonTable"
            enableReporting={true}
            context={{ page: 'landing-b2c' }}
          >
            <div id="comparison" data-section-id="comparison-section-b2c" style={{ backgroundColor: 'var(--section-bg-neutral)' }}>
              <ComparisonTable enableAnalytics={true} />
            </div>
          </SectionErrorBoundary>
        </ScrollReveal>

        {/* Section 3: Goal Example Cards — white bg */}
        <ScrollReveal>
          <SectionErrorBoundary
            sectionId="goals-section-b2c"
            sectionType="GoalExampleCards"
            enableReporting={true}
            context={{ page: 'landing-b2c' }}
          >
            <div id="goals" data-section-id="goals-section-b2c" style={{ backgroundColor: 'var(--section-bg-white)' }}>
              <GoalExampleCards enableAnalytics={true} />
            </div>
          </SectionErrorBoundary>
        </ScrollReveal>

        {/* Section 4: Side-Pocket Strip — brand bg */}
        <ScrollReveal>
          <SectionErrorBoundary
            sectionId="sidepocket-section-b2c"
            sectionType="SidePocketStrip"
            enableReporting={true}
            context={{ page: 'landing-b2c' }}
          >
            <SidePocketStrip />
          </SectionErrorBoundary>
        </ScrollReveal>

        {/* Section 5: Adelaide Story — warm bg (set via config) */}
        <ScrollReveal>
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
        </ScrollReveal>

        {/* Section 6: How It Works (Detailed) — white bg */}
        <ScrollReveal>
          <SectionErrorBoundary
            sectionId="how-it-works-detailed-section-b2c"
            sectionType="HowItWorksGrid"
            enableReporting={true}
            context={{ page: 'landing-b2c' }}
          >
            <div id="how-it-works" data-section-id="how-it-works-detailed-section-b2c" style={{ backgroundColor: 'var(--section-bg-white)' }}>
              <HowItWorksGrid enableAnalytics={true} />
            </div>
          </SectionErrorBoundary>
        </ScrollReveal>

        {/* Section 7: Money That Moves — neutral bg (set via component token) */}
        <ScrollReveal>
          <SectionErrorBoundary
            sectionId="how-it-works-section-b2c"
            sectionType="AppFeaturesCarousel"
            enableReporting={true}
            context={{ page: 'landing-b2c' }}
          >
            <div id="money-that-moves" data-section-id="how-it-works-section-b2c">
              <AppFeaturesCarousel
                config={B2C_HOW_IT_WORKS_CONFIG}
                enableAnalytics={true}
              />
            </div>
          </SectionErrorBoundary>
        </ScrollReveal>

        {/* Section 8: Fees — neutral bg */}
        <ScrollReveal>
          <SectionErrorBoundary
            sectionId="fees-section-b2c"
            sectionType="FeeTable"
            enableReporting={true}
            context={{ page: 'landing-b2c' }}
          >
            <div id="fees" data-section-id="fees-section-b2c" style={{ backgroundColor: 'var(--section-bg-neutral)' }}>
              <FeeTable
                config={B2C_FEES_CONFIG}
                enableAnalytics={true}
              />
            </div>
          </SectionErrorBoundary>
        </ScrollReveal>

        {/* Section 9: What's the Catch? — dark bg (set via config) */}
        <ScrollReveal>
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
        </ScrollReveal>

        {/* Section 10: Under the Hood — white bg */}
        <ScrollReveal>
          <SectionErrorBoundary
            sectionId="under-the-hood-section-b2c"
            sectionType="ExpandableSection"
            enableReporting={true}
            context={{ page: 'landing-b2c' }}
          >
            <div id="under-the-hood" data-section-id="under-the-hood-section-b2c" style={{ backgroundColor: 'var(--section-bg-white)' }}>
              <ExpandableSection
                config={B2C_UNDER_THE_HOOD_CONFIG}
              />
            </div>
          </SectionErrorBoundary>
        </ScrollReveal>

        {/* Section 11: Demo — brand bg */}
        <ScrollReveal>
          <SectionErrorBoundary
            sectionId="demo-section-b2c"
            sectionType="DemoLauncher"
            enableReporting={true}
            context={{ page: 'landing-b2c' }}
          >
            <div id="demo" data-section-id="demo-section-b2c" style={{ backgroundColor: 'var(--section-bg-brand)' }}>
              <DemoLauncher config={B2C_DEMO_CONFIG} enableAnalytics={true} />
            </div>
          </SectionErrorBoundary>
        </ScrollReveal>

        {/* Section 12: Founding Members — white bg */}
        <ScrollReveal>
          <SectionErrorBoundary
            sectionId="founding-members-section-b2c"
            sectionType="FoundingMembersSection"
            enableReporting={true}
            context={{ page: 'landing-b2c' }}
          >
            <div style={{ backgroundColor: 'var(--section-bg-white)' }}>
              <FoundingMembersSection enableAnalytics={true} />
            </div>
          </SectionErrorBoundary>
        </ScrollReveal>

        {/* Section 13: Built by Bar — warm bg */}
        <ScrollReveal>
          <SectionErrorBoundary
            sectionId="founder-section-b2c"
            sectionType="FounderSection"
            enableReporting={true}
            context={{ page: 'landing-b2c' }}
          >
            <div id="founder" data-section-id="founder-section-b2c" style={{ backgroundColor: 'var(--section-bg-warm)' }}>
              <FounderSection
                config={B2C_FOUNDER_CONFIG}
              />
            </div>
          </SectionErrorBoundary>
        </ScrollReveal>

        {/* Section 14: Waitlist — dark bg (set via config) */}
        <ScrollReveal>
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
                  headline: B2C_WAITLIST_CONFIG.headline,
                  subheadline: B2C_WAITLIST_CONFIG.subheadline,
                  hideBenefits: B2C_WAITLIST_CONFIG.hideBenefits,
                  hideNoSpam: B2C_WAITLIST_CONFIG.hideNoSpam,
                  source: B2C_WAITLIST_CONFIG.source,
                }}
              />
            </div>
          </SectionErrorBoundary>
        </ScrollReveal>

        {/* Section 15: FAQ — white bg */}
        <ScrollReveal>
          <SectionErrorBoundary
            sectionId="faq-section-b2c"
            sectionType="FAQAccordion"
            enableReporting={true}
            context={{ page: 'landing-b2c' }}
          >
            <div id="faq" data-section-id="faq-section-b2c" style={{ backgroundColor: 'var(--section-bg-white)' }}>
              <FAQAccordion
                config={B2C_FAQ_CONFIG}
              />
            </div>
          </SectionErrorBoundary>
        </ScrollReveal>
      </div>

      {/* Footer */}
      <MinimalFooter
        taglineKey="landing-b2c.footer.tagline"
        navLinks={B2C_FOOTER_NAV}
        disclosureKeys={B2C_FOOTER_DISCLOSURES}
      />

      {/* Sticky Mobile CTA — appears after hero, hides at waitlist */}
      <StickyMobileCTA />
    </PageI18nProvider>
  );
}
