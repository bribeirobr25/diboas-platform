import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { generateStaticPageMetadata, MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { HeroSection } from '@/components/Sections';
import { ProductCarousel, FeatureShowcase, AppFeaturesCarousel, OneFeature, StickyFeaturesNav, FAQAccordion } from '@/components/Sections';
import { BenefitsCardsSection } from '@/components/Sections/BenefitsCards';
import { BgHighlightSection } from '@/components/Sections/BgHighlight';
import { StepGuideSection } from '@/components/Sections/StepGuide';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { BRAND_CONFIG } from '@/config/brand';
import { DEFAULT_FAQ_ACCORDION_CONFIG } from '@/config/faqAccordion';
import { DEFAULT_BENEFITS_CARDS_CONFIG } from '@/config/benefitsCards';
import { DEFAULT_BG_HIGHLIGHT_CONFIG } from '@/config/bgHighlight';
import { DEFAULT_STEP_GUIDE_CONFIG } from '@/config/stepGuide';
import type { Metadata } from 'next';

export const dynamic = 'auto';

interface HomePageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Generate metadata for the home page
 * SEO Optimization: Dynamic metadata generation with i18n support
 */
export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateStaticPageMetadata('home', locale as SupportedLocale);
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Generate structured data for the home page
  const organizationData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS Financial Platform',
    description: 'Comprehensive financial platform for banking, investing, and DeFi management',
    category: 'Financial Services'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' }
  ], locale);

  return (
    <>
      <StructuredData data={[organizationData, breadcrumbData]} />
      
      <main className="main-page-wrapper">
        <SectionErrorBoundary
          sectionId="hero-section-home"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'home', variant: 'fullBackground' }}
        >
          <HeroSection 
            variant="fullBackground"
            enableAnalytics={true}
            priority={true}
          />
        </SectionErrorBoundary>

        <SectionErrorBoundary
          sectionId="product-carousel-home"
          sectionType="ProductCarousel"
          enableReporting={true}
          context={{ page: 'home' }}
        >
          <ProductCarousel />
        </SectionErrorBoundary>

        <SectionErrorBoundary
          sectionId="feature-showcase-home"
          sectionType="FeatureShowcase"
          enableReporting={true}
          context={{ page: 'home' }}
        >
          <FeatureShowcase />
        </SectionErrorBoundary>

        <SectionErrorBoundary
          sectionId="app-features-carousel-home"
          sectionType="AppFeaturesCarousel"
          enableReporting={true}
          context={{ page: 'home' }}
        >
          <AppFeaturesCarousel />
        </SectionErrorBoundary>

        <SectionErrorBoundary
          sectionId="one-feature-home"
          sectionType="OneFeature"
          enableReporting={true}
          context={{ page: 'home' }}
        >
          <OneFeature />
        </SectionErrorBoundary>

        <SectionErrorBoundary
          sectionId="sticky-features-nav-home"
          sectionType="StickyFeaturesNav"
          enableReporting={true}
          context={{ page: 'home' }}
        >
          <StickyFeaturesNav />
        </SectionErrorBoundary>

        <SectionErrorBoundary
          sectionId="faq-accordion-home"
          sectionType="FAQAccordion"
          enableReporting={true}
          context={{ page: 'home' }}
        >
          <FAQAccordion config={DEFAULT_FAQ_ACCORDION_CONFIG} />
        </SectionErrorBoundary>

        <SectionErrorBoundary
          sectionId="benefits-cards-home"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'home' }}
        >
          <BenefitsCardsSection
            config={DEFAULT_BENEFITS_CARDS_CONFIG}
            variant="default"
            enableAnalytics={true}
            priority={false}
          />
        </SectionErrorBoundary>

        <SectionErrorBoundary
          sectionId="bg-highlight-home"
          sectionType="BgHighlight"
          enableReporting={true}
          context={{ page: 'home' }}
        >
          <BgHighlightSection
            config={DEFAULT_BG_HIGHLIGHT_CONFIG}
            variant="default"
            enableAnalytics={true}
            priority={false}
          />
        </SectionErrorBoundary>

        <SectionErrorBoundary
          sectionId="step-guide-home"
          sectionType="StepGuide"
          enableReporting={true}
          context={{ page: 'home' }}
        >
          <StepGuideSection
            config={DEFAULT_STEP_GUIDE_CONFIG}
            variant="default"
            enableAnalytics={true}
          />
        </SectionErrorBoundary>
        {/* Additional content sections will be developed later */}
      </main>
    </>
  );
}