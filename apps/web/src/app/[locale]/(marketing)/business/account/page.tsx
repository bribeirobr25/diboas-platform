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
  return generateStaticPageMetadata('business/account', locale as SupportedLocale);
}

export default async function BusinessAccountPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespaces (business/account + shared: home for StickyFeaturesNav, faq for FAQAccordion)
  const pageMessages = await loadPageNamespaces(locale, ['business/account', 'home', 'faq']);

  const serviceData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS Business Account',
    description: 'Free business account that earns',
    category: 'Business Services'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Business Account', url: ROUTES.BUSINESS.ACCOUNT }
  ], locale);

  const heroVariant = getVariantForPageConfig('business-account');

  return (
    <PageI18nProvider pageMessages={pageMessages}>
    <>
      <StructuredData data={[serviceData, breadcrumbData]} />

      <main className="main-page-wrapper">
        <SectionErrorBoundary
          sectionId="hero-section-business-account"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'business-account', variant: heroVariant }}
        >
          <HeroSection
            variant={heroVariant}
            config={HERO_PAGE_CONFIGS['business-account']}
            enableAnalytics={true}
            priority={true}
          />
        </SectionErrorBoundary>

        {/* Feature Showcase Section */}
        <SectionErrorBoundary
          sectionId="feature-showcase-businessAccount"
          sectionType="FeatureShowcase"
          enableReporting={true}
          context={{ page: 'businessAccount' }}
        >
          <FeatureShowcase
            config={FEATURE_SHOWCASE_PAGE_CONFIGS.businessAccount}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>


        
        {/* Benefits Cards Section */}
        <SectionErrorBoundary
          sectionId="benefits-cards-business-account"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'business-account' }}
        >
          <BenefitsCardsSection
            config={getBenefitsCardsConfig('business-account')!}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>

        {/* Sticky Features Navigation Section */}
        <SectionErrorBoundary
          sectionId="sticky-features-nav-businessAccount"
          sectionType="StickyFeaturesNav"
          enableReporting={true}
          context={{ page: 'businessAccount' }}
        >
          <StickyFeaturesNav
            config={STICKY_FEATURES_NAV_PAGE_CONFIGS.businessAccount}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>
      
        {/* FAQ Accordion Section */}
        <SectionErrorBoundary
          sectionId="faq-accordion-businessAccount"
          sectionType="FAQAccordion"
          enableReporting={true}
          context={{ page: 'businessAccount' }}
        >
          <FAQAccordion
            config={FAQ_ACCORDION_PAGE_CONFIGS.businessAccount!}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>

      </main>
    </>
    </PageI18nProvider>
  );
}