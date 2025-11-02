import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { generateStaticPageMetadata, MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { HeroSection, StickyFeaturesNav, FAQAccordion } from '@/components/Sections';
import { FeatureShowcase } from '@/components/Sections';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { HERO_PAGE_CONFIGS, getVariantForPageConfig } from '@/config/hero-pages';
import { ROUTES } from '@/config/routes';
import type { Metadata } from 'next';


import { BenefitsCardsSection } from '@/components/Sections/BenefitsCards';
import { getBenefitsCardsConfig } from '@/config/benefitsCards-pages';
import { STICKY_FEATURES_NAV_PAGE_CONFIGS } from '@/config/stickyFeaturesNav-pages';
import { FEATURE_SHOWCASE_PAGE_CONFIGS } from '@/config/featureShowcase-pages';
import { FAQ_ACCORDION_PAGE_CONFIGS } from '@/config/faqAccordion-pages';
export const dynamic = 'auto';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateStaticPageMetadata('learn/investment-guide', locale as SupportedLocale);
}

export default async function InvestmentGuidePage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const serviceData = MetadataFactory.generateServiceStructuredData({
    name: 'Investment Guide',
    description: 'Invest with confidence',
    category: 'Educational Services'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Investment Guide', url: ROUTES.LEARN.INVESTMENT_GUIDE }
  ], locale);

  const heroVariant = getVariantForPageConfig('learn-investment-guide');

  return (
    <>
      <StructuredData data={[serviceData, breadcrumbData]} />

      <main className="main-page-wrapper">
        <SectionErrorBoundary
          sectionId="hero-section-learn-investment-guide"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'learn-investment-guide', variant: heroVariant }}
        >
          <HeroSection
            variant={heroVariant}
            config={HERO_PAGE_CONFIGS['learn-investment-guide']}
            enableAnalytics={true}
            priority={true}
          />
        </SectionErrorBoundary>

        {/* Feature Showcase Section */}
        <SectionErrorBoundary
          sectionId="feature-showcase-learnInvestmentGuide"
          sectionType="FeatureShowcase"
          enableReporting={true}
          context={{ page: 'learnInvestmentGuide' }}
        >
          <FeatureShowcase
            variant="default"
            config={FEATURE_SHOWCASE_PAGE_CONFIGS.learnInvestmentGuide}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>


        
        {/* Benefits Cards Section */}
        <SectionErrorBoundary
          sectionId="benefits-cards-investment-guide"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'investment-guide' }}
        >
          <BenefitsCardsSection
            config={getBenefitsCardsConfig('learn-investment-guide')!}
            variant="default"
            enableAnalytics={true}
          />
        </SectionErrorBoundary>

        {/* Sticky Features Navigation Section */}
        <SectionErrorBoundary
          sectionId="sticky-features-nav-learnInvestmentGuide"
          sectionType="StickyFeaturesNav"
          enableReporting={true}
          context={{ page: 'learnInvestmentGuide' }}
        >
          <StickyFeaturesNav
            variant="default"
            config={STICKY_FEATURES_NAV_PAGE_CONFIGS.learnInvestmentGuide}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>
      
        {/* FAQ Accordion Section */}
        <SectionErrorBoundary
          sectionId="faq-accordion-learnInvestmentGuide"
          sectionType="FAQAccordion"
          enableReporting={true}
          context={{ page: 'learnInvestmentGuide' }}
        >
          <FAQAccordion
            variant="default"
            config={FAQ_ACCORDION_PAGE_CONFIGS.learnInvestmentGuide!}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>

      </main>
    </>
  );
}