import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { generateStaticPageMetadata, MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { HeroSection, StickyFeaturesNav } from '@/components/Sections';
import { FeatureShowcase } from '@/components/Sections';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { HERO_PAGE_CONFIGS, getVariantForPageConfig } from '@/config/hero-pages';
import { ROUTES } from '@/config/routes';
import type { Metadata } from 'next';


import { BenefitsCardsSection } from '@/components/Sections/BenefitsCards';
import { getBenefitsCardsConfig } from '@/config/benefitsCards-pages';
import { STICKY_FEATURES_NAV_PAGE_CONFIGS } from '@/config/stickyFeaturesNav-pages';
import { FEATURE_SHOWCASE_PAGE_CONFIGS } from '@/config/featureShowcase-pages';
export const dynamic = 'auto';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateStaticPageMetadata('banking-services', locale as SupportedLocale);
}

export default async function BankingServicesPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const serviceData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS Banking Services',
    description: 'Modern banking services without borders',
    category: 'Financial Services'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Banking Services', url: ROUTES.BANKING_SERVICES }
  ], locale);

  const heroVariant = getVariantForPageConfig('banking-services');

  return (
    <>
      <StructuredData data={[serviceData, breadcrumbData]} />

      <main className="main-page-wrapper">
        <SectionErrorBoundary
          sectionId="hero-section-banking-services"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'banking-services', variant: heroVariant }}
        >
          <HeroSection
            variant={heroVariant}
            config={HERO_PAGE_CONFIGS['banking-services']}
            enableAnalytics={true}
            priority={true}
          />
        </SectionErrorBoundary>

        {/* Feature Showcase Section */}
        <SectionErrorBoundary
          sectionId="feature-showcase-bankingServices"
          sectionType="FeatureShowcase"
          enableReporting={true}
          context={{ page: 'bankingServices' }}
        >
          <FeatureShowcase
            variant="default"
            config={FEATURE_SHOWCASE_PAGE_CONFIGS.bankingServices}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>


        
        {/* Benefits Cards Section */}
        <SectionErrorBoundary
          sectionId="benefits-cards-banking-services"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'banking-services' }}
        >
          <BenefitsCardsSection
            config={getBenefitsCardsConfig('banking-services')!}
            variant="default"
            enableAnalytics={true}
          />
        </SectionErrorBoundary>

        {/* Sticky Features Navigation Section */}
        <SectionErrorBoundary
          sectionId="sticky-features-nav-bankingServices"
          sectionType="StickyFeaturesNav"
          enableReporting={true}
          context={{ page: 'bankingServices' }}
        >
          <StickyFeaturesNav
            variant="default"
            config={STICKY_FEATURES_NAV_PAGE_CONFIGS.bankingServices}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>
      </main>
    </>
  );
}