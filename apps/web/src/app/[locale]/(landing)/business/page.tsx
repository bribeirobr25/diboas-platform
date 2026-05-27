import { notFound } from 'next/navigation';
import nextDynamic from 'next/dynamic';
import { isValidLocale, type SupportedLocale, loadMessages } from '@diboas/i18n/server';
import { SEOMetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import {
  HeroSection,
  ProseSection,
  ScenarioCards,
  TwoWorldsSection,
  FoundingMembersSection,
  ComparisonTable,
} from '@/components/Sections';
import { B2BGoalCards } from '@/components/Sections/B2BGoalCards';
import { BenefitsCardsSection } from '@/components/Sections/BenefitsCards';

// Below-fold sections: code-split via dynamic imports
const FAQAccordion = nextDynamic(() =>
  import('@/components/Sections/FAQAccordion/FAQAccordionFactory').then((m) => ({
    default: m.FAQAccordion,
  }))
);
const FeeTable = nextDynamic(() =>
  import('@/components/Sections/FeeTable').then((m) => ({ default: m.FeeTable }))
);
const FounderSection = nextDynamic(() =>
  import('@/components/Sections/FounderSection').then((m) => ({ default: m.FounderSection }))
);
const AppFeaturesCarousel = nextDynamic(() =>
  import('@/components/Sections/AppFeaturesCarousel').then((m) => ({
    default: m.AppFeaturesCarousel,
  }))
);
const WaitlistSection = nextDynamic(() =>
  import('@/components/Sections/WaitlistSection').then((m) => ({ default: m.WaitlistSection }))
);
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { ScrollToHash } from '@/components/Layout/ScrollToHash';
import { PageI18nProvider, MarketDataContextProvider } from '@/components/Providers';
import { marketDataService } from '@/lib/market-data';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { B2BToolsCallout } from '@/components/Sections/B2BToolsCallout';
import {
  B2B_HERO_CONFIG,
  B2B_TWO_WORLDS_CONFIG,
  B2B_ORIGIN_STORY_CONFIG,
  B2B_HOW_IT_WORKS_CONFIG,
  B2B_FEATURES_CONFIG,
  B2B_FEES_CONFIG,
  B2B_FIT_ASSESSMENT_CONFIG,
  B2B_FOUNDER_CONFIG,
  B2B_WAITLIST_CONFIG,
  B2B_FAQ_CONFIG,
} from '@/config/landing-b2b';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
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
  const description =
    seo.description ||
    'Your card processor takes 2 to 3%. Your bank pays you almost nothing. diBoaS helps you keep more.';
  const ogTitle = seo.ogTitle || title;
  const ogDescription = seo.ogDescription || description;

  return {
    title,
    description,
    keywords: [
      'treasury management',
      'startup finance',
      'returns',
      'operating cash',
      'business payments',
      'B2B fintech',
    ],
    alternates: {
      canonical: `${baseUrl}/${locale}/business`,
      languages: {
        en: `${baseUrl}/en/business`,
        de: `${baseUrl}/de/business`,
        es: `${baseUrl}/es/business`,
        'pt-br': `${baseUrl}/pt-BR/business`,
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
      site: '@diboasfi',
      creator: '@bribeiro_br',
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
 * B2B Landing Page — 12-section layout
 *
 * 1.  Hero
 * 2.  Two Worlds (self-selection cards)
 * 3.  B2B Goal Cards (Payment Fees + Idle Cash)
 * 4.  Cashflow Investing (Save it + Grow it)
 * 5.  Origin Story (Adelaide / Grandmother)
 * 6.  Three Features (3 cards)
 * 7.  How It Works (4 steps carousel)
 * 8.  Fee Transparency (FeeTable)
 * 9.  Fit Assessment (Good Fit / Not a Fit)
 * 10. Waitlist (email signup)
 * 11. About the Founder
 * 12. FAQ
 *     Footer (MinimalFooter)
 */
export default async function B2BLandingPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // A8 fix (2026-05-23): pre-fetch market snapshot for ComparisonTable.
  const [pageMessages, snapshot] = await Promise.all([
    loadPageNamespaces(locale, ['landing-b2b', 'landing-b2c', 'faq']),
    marketDataService.get(),
  ]);

  const organizationData = SEOMetadataFactory.generateServiceStructuredData({
    name: 'diBoaS for Business',
    description:
      'Stop overpaying on fees and idle cash. Free payments, instant transfers, and your idle cash working for you.',
    category: 'Financial Services',
  });

  const breadcrumbData = SEOMetadataFactory.generateBreadcrumbs(
    [
      { name: 'Home', url: '/' },
      { name: 'Business', url: '/business' },
    ],
    locale
  );

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <MarketDataContextProvider initialSnapshot={snapshot}>
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
            <div data-section-id="hero-section-b2b">
              <HeroSection
                variant="fullBackground"
                config={B2B_HERO_CONFIG}
                enableAnalytics={true}
                priority={true}
              />
            </div>
          </SectionErrorBoundary>

          {/* Section 2: Comparison Table — neutral bg */}
          <SectionErrorBoundary
            sectionId="comparison-section-b2b"
            sectionType="ComparisonTable"
            enableReporting={true}
            context={{ page: 'landing-b2b' }}
          >
            <div
              id="comparison"
              data-section-id="comparison-section-b2b"
              style={{ backgroundColor: 'var(--section-bg-neutral)' }}
            >
              <ComparisonTable enableAnalytics={true} />
            </div>
          </SectionErrorBoundary>

          {/* Section 3: Two Worlds */}
          <SectionErrorBoundary
            sectionId="two-worlds-section-b2b"
            sectionType="TwoWorldsSection"
            enableReporting={true}
            context={{ page: 'landing-b2b' }}
          >
            <div id="two-worlds" data-section-id="two-worlds-section-b2b">
              <TwoWorldsSection config={B2B_TWO_WORLDS_CONFIG} enableAnalytics={true} />
            </div>
          </SectionErrorBoundary>

          {/* Section 3: B2B Goal Cards — Payment Fees + Idle Cash */}
          <SectionErrorBoundary
            sectionId="goals-section-b2b"
            sectionType="B2BGoalCards"
            enableReporting={true}
            context={{ page: 'landing-b2b' }}
          >
            <div
              id="goals"
              data-section-id="goals-section-b2b"
              style={{ backgroundColor: 'var(--section-bg-white)' }}
            >
              <B2BGoalCards enableAnalytics={true} />
              {/* Phase 6E — inline callout linking to the 2 B2B calculators */}
              <B2BToolsCallout />
            </div>
          </SectionErrorBoundary>

          {/* Section 4: Join the Movement (Social Proof — B2B users only) */}
          <SectionErrorBoundary
            sectionId="founding-members-section-b2b"
            sectionType="FoundingMembersSection"
            enableReporting={true}
            context={{ page: 'landing-b2b' }}
          >
            <div id="social-proof" data-section-id="founding-members-section-b2b">
              <FoundingMembersSection
                enableAnalytics={true}
                namespace="landing-b2b.socialProof"
                source="landing_b2b"
                backgroundColor="var(--section-bg-dark)"
              />
            </div>
          </SectionErrorBoundary>

          {/* Section 5: Origin Story */}
          <SectionErrorBoundary
            sectionId="origin-story-section-b2b"
            sectionType="ProseSection"
            enableReporting={true}
            context={{ page: 'landing-b2b' }}
          >
            <div id="origin-story" data-section-id="origin-story-section-b2b">
              <ProseSection config={B2B_ORIGIN_STORY_CONFIG} enableAnalytics={true} />
            </div>
          </SectionErrorBoundary>

          {/* Section 6: Three Features (ScenarioCards) */}
          <SectionErrorBoundary
            sectionId="features-section-b2b"
            sectionType="ScenarioCards"
            enableReporting={true}
            context={{ page: 'landing-b2b' }}
          >
            <div id="features" data-section-id="features-section-b2b">
              <ScenarioCards config={B2B_FEATURES_CONFIG} enableAnalytics={true} />
            </div>
          </SectionErrorBoundary>

          {/* Section 7: How It Works */}
          <SectionErrorBoundary
            sectionId="how-it-works-section-b2b"
            sectionType="AppFeaturesCarousel"
            enableReporting={true}
            context={{ page: 'landing-b2b' }}
          >
            <div id="how-it-works" data-section-id="how-it-works-section-b2b">
              <AppFeaturesCarousel config={B2B_HOW_IT_WORKS_CONFIG} enableAnalytics={true} />
            </div>
          </SectionErrorBoundary>

          {/* Section 8: Fee Transparency */}
          <SectionErrorBoundary
            sectionId="fees-section-b2b"
            sectionType="FeeTable"
            enableReporting={true}
            context={{ page: 'landing-b2b' }}
          >
            <div id="fees" data-section-id="fees-section-b2b">
              <FeeTable config={B2B_FEES_CONFIG} enableAnalytics={true} />
            </div>
          </SectionErrorBoundary>

          {/* Section 9: Fit Assessment */}
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

          {/* Section 10: Waitlist */}
          <SectionErrorBoundary
            sectionId="waitlist-section-b2b"
            sectionType="WaitlistSection"
            enableReporting={true}
            context={{ page: 'landing-b2b' }}
          >
            <div id="waitlist" data-section-id="waitlist-section-b2b">
              <WaitlistSection
                enableAnalytics={true}
                config={{
                  sectionId: B2B_WAITLIST_CONFIG.sectionId,
                  backgroundColor: B2B_WAITLIST_CONFIG.backgroundColor,
                  headline: B2B_WAITLIST_CONFIG.headline,
                  subheadline: B2B_WAITLIST_CONFIG.subheadline,
                  hideBenefits: B2B_WAITLIST_CONFIG.hideBenefits,
                  hideNoSpam: B2B_WAITLIST_CONFIG.hideNoSpam,
                  namespace: B2B_WAITLIST_CONFIG.namespace,
                  confirmationNamespace: B2B_WAITLIST_CONFIG.confirmationNamespace,
                  source: B2B_WAITLIST_CONFIG.source,
                }}
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
            <div
              id="founder"
              data-section-id="founder-section-b2b"
              style={{ backgroundColor: 'var(--section-bg-warm)' }}
            >
              <FounderSection config={B2B_FOUNDER_CONFIG} />
            </div>
          </SectionErrorBoundary>

          {/* Section 12: FAQ */}
          <SectionErrorBoundary
            sectionId="faq-section-b2b"
            sectionType="FAQAccordion"
            enableReporting={true}
            context={{ page: 'landing-b2b' }}
          >
            <div id="faq" data-section-id="faq-section-b2b">
              <FAQAccordion config={B2B_FAQ_CONFIG} />
            </div>
          </SectionErrorBoundary>
        </div>

        {/* Footer */}
        <MinimalFooter
          taglineKey="landing-b2c.footer.tagline"
          navLinks={B2C_FOOTER_NAV}
          disclosureKeys={B2C_FOOTER_DISCLOSURES}
        />
      </MarketDataContextProvider>
    </PageI18nProvider>
  );
}
