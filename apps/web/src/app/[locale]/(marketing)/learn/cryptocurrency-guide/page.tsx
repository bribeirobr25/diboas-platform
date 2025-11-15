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
import { PageI18nProvider } from '@/components/PageI18nProvider';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
export const dynamic = 'auto';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateStaticPageMetadata('learn/cryptocurrency-guide', locale as SupportedLocale);
}

export default async function CryptocurrencyGuidePage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespaces (learn/cryptocurrency-guide + shared: home for StickyFeaturesNav, faq for FAQAccordion)
  const pageMessages = await loadPageNamespaces(locale, ['learn/cryptocurrency-guide', 'home', 'faq']);

  const serviceData = MetadataFactory.generateServiceStructuredData({
    name: 'Cryptocurrency Guide',
    description: 'A to Z on cryptocurrency',
    category: 'Educational Services'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Cryptocurrency Guide', url: ROUTES.LEARN.CRYPTOCURRENCY_GUIDE }
  ], locale);

  const heroVariant = getVariantForPageConfig('learn-cryptocurrency-guide');

  return (
    <PageI18nProvider pageMessages={pageMessages}>
    <>
      <StructuredData data={[serviceData, breadcrumbData]} />

      <main className="main-page-wrapper">
        <SectionErrorBoundary
          sectionId="hero-section-learn-cryptocurrency-guide"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'learn-cryptocurrency-guide', variant: heroVariant }}
        >
          <HeroSection
            variant={heroVariant}
            config={HERO_PAGE_CONFIGS['learn-cryptocurrency-guide']}
            enableAnalytics={true}
            priority={true}
          />
        </SectionErrorBoundary>

        {/* Feature Showcase Section */}
        <SectionErrorBoundary
          sectionId="feature-showcase-learnCryptocurrencyGuide"
          sectionType="FeatureShowcase"
          enableReporting={true}
          context={{ page: 'learnCryptocurrencyGuide' }}
        >
          <FeatureShowcase
            config={FEATURE_SHOWCASE_PAGE_CONFIGS.learnCryptocurrencyGuide}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>


        
        {/* Benefits Cards Section */}
        <SectionErrorBoundary
          sectionId="benefits-cards-cryptocurrency-guide"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'cryptocurrency-guide' }}
        >
          <BenefitsCardsSection
            config={getBenefitsCardsConfig('learn-cryptocurrency-guide')!}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>

        {/* Sticky Features Navigation Section */}
        <SectionErrorBoundary
          sectionId="sticky-features-nav-learnCryptocurrencyGuide"
          sectionType="StickyFeaturesNav"
          enableReporting={true}
          context={{ page: 'learnCryptocurrencyGuide' }}
        >
          <StickyFeaturesNav
            config={STICKY_FEATURES_NAV_PAGE_CONFIGS.learnCryptocurrencyGuide}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>
      
        {/* FAQ Accordion Section */}
        <SectionErrorBoundary
          sectionId="faq-accordion-learnCryptocurrencyGuide"
          sectionType="FAQAccordion"
          enableReporting={true}
          context={{ page: 'learnCryptocurrencyGuide' }}
        >
          <FAQAccordion
            config={FAQ_ACCORDION_PAGE_CONFIGS.learnCryptocurrencyGuide!}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>

      </main>
    </>
    </PageI18nProvider>
  );
}
