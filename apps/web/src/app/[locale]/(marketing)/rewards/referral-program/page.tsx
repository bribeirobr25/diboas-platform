import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { generateStaticPageMetadata, MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { HeroSection, StickyFeaturesNav, FAQAccordion, FeatureShowcase } from '@/components/Sections';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { HERO_PAGE_CONFIGS, getVariantForPageConfig } from '@/config/hero-pages';
import { ROUTES } from '@/config/routes';
import type { Metadata } from 'next';


import { BenefitsCardsSection } from '@/components/Sections/BenefitsCards';
import { getBenefitsCardsConfig } from '@/config/benefitsCards-pages';
import { STICKY_FEATURES_NAV_PAGE_CONFIGS } from '@/config/stickyFeaturesNav-pages';
import { FEATURE_SHOWCASE_PAGE_CONFIGS } from '@/config/featureShowcase-pages';
import { FAQ_ACCORDION_PAGE_CONFIGS } from '@/config/faqAccordion-pages';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
export const dynamic = 'auto';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateStaticPageMetadata('rewards/referral-program', locale as SupportedLocale);
}

export default async function RewardsReferralProgramPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespaces (rewards/referral-program + shared: home for StickyFeaturesNav, faq for FAQAccordion)
  const pageMessages = await loadPageNamespaces(locale, ['rewards/referral-program', 'home', 'faq']);

  const serviceData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS Referral Program',
    description: 'Share knowledge, earn rewards',
    category: 'Rewards Services'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Referral Program', url: ROUTES.REWARDS.REFERRAL_PROGRAM }
  ], locale);

  const heroVariant = getVariantForPageConfig('rewards-referral-program');

  return (
    <PageI18nProvider pageMessages={pageMessages}>
    <>
      <StructuredData data={[serviceData, breadcrumbData]} />

      <main className="main-page-wrapper">
        <SectionErrorBoundary
          sectionId="hero-section-rewards-referral-program"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'rewards-referral-program', variant: heroVariant }}
        >
          <HeroSection
            variant={heroVariant}
            config={HERO_PAGE_CONFIGS['rewards-referral-program']}
            enableAnalytics={true}
            priority={true}
          />
        </SectionErrorBoundary>

        {/* Feature Showcase Section */}
        <SectionErrorBoundary
          sectionId="feature-showcase-rewardsReferralProgram"
          sectionType="FeatureShowcase"
          enableReporting={true}
          context={{ page: 'rewardsReferralProgram' }}
        >
          <FeatureShowcase
            config={FEATURE_SHOWCASE_PAGE_CONFIGS.rewardsReferralProgram}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>


        
        {/* Benefits Cards Section */}
        <SectionErrorBoundary
          sectionId="benefits-cards-rewards-referral-program"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'rewards-referral-program' }}
        >
          <BenefitsCardsSection
            config={getBenefitsCardsConfig('rewards-referral-program')!}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>

        {/* Sticky Features Navigation Section */}
        <SectionErrorBoundary
          sectionId="sticky-features-nav-rewardsReferralProgram"
          sectionType="StickyFeaturesNav"
          enableReporting={true}
          context={{ page: 'rewardsReferralProgram' }}
        >
          <StickyFeaturesNav
            config={STICKY_FEATURES_NAV_PAGE_CONFIGS.rewardsReferralProgram}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>
      
        {/* FAQ Accordion Section */}
        <SectionErrorBoundary
          sectionId="faq-accordion-rewardsReferralProgram"
          sectionType="FAQAccordion"
          enableReporting={true}
          context={{ page: 'rewardsReferralProgram' }}
        >
          <FAQAccordion
            config={FAQ_ACCORDION_PAGE_CONFIGS.rewardsReferralProgram!}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>

      </main>
    </>
    </PageI18nProvider>
  );
}
