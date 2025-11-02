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
  return generateStaticPageMetadata('rewards/points-system', locale as SupportedLocale);
}

export default async function PointsSystemPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const serviceData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS Points System',
    description: 'Every action earns points',
    category: 'Rewards Services'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Points System', url: ROUTES.REWARDS.POINTS_SYSTEM }
  ], locale);

  const heroVariant = getVariantForPageConfig('rewards-points-system');

  return (
    <>
      <StructuredData data={[serviceData, breadcrumbData]} />

      <main className="main-page-wrapper">
        <SectionErrorBoundary
          sectionId="hero-section-rewards-points-system"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'rewards-points-system', variant: heroVariant }}
        >
          <HeroSection
            variant={heroVariant}
            config={HERO_PAGE_CONFIGS['rewards-points-system']}
            enableAnalytics={true}
            priority={true}
          />
        </SectionErrorBoundary>

        {/* Feature Showcase Section */}
        <SectionErrorBoundary
          sectionId="feature-showcase-rewardsPointsSystem"
          sectionType="FeatureShowcase"
          enableReporting={true}
          context={{ page: 'rewardsPointsSystem' }}
        >
          <FeatureShowcase
            variant="default"
            config={FEATURE_SHOWCASE_PAGE_CONFIGS.rewardsPointsSystem}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>


        
        {/* Benefits Cards Section */}
        <SectionErrorBoundary
          sectionId="benefits-cards-rewards-points-system"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'rewards-points-system' }}
        >
          <BenefitsCardsSection
            config={getBenefitsCardsConfig('rewards-points-system')!}
            variant="default"
            enableAnalytics={true}
          />
        </SectionErrorBoundary>

        {/* Sticky Features Navigation Section */}
        <SectionErrorBoundary
          sectionId="sticky-features-nav-rewardsPointsSystem"
          sectionType="StickyFeaturesNav"
          enableReporting={true}
          context={{ page: 'rewardsPointsSystem' }}
        >
          <StickyFeaturesNav
            variant="default"
            config={STICKY_FEATURES_NAV_PAGE_CONFIGS.rewardsPointsSystem}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>
      </main>
    </>
  );
}
