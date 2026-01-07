/**
 * Original Marketing Home Page
 *
 * ROUTING CHANGE NOTE:
 * This page was previously at the root URL (/).
 * It has been moved to /main to allow the B2C landing page to load at the root.
 *
 * To restore this as the main home page:
 * 1. Move this file back to (marketing)/page.tsx
 * 2. Delete or move the (landing)/page.tsx
 * 3. Update the (marketing)/layout.tsx to use full Navigation and SiteFooter
 */

import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { generateStaticPageMetadata, MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { HeroSection, ProductCarousel, FeatureShowcase, AppFeaturesCarousel, OneFeature, StickyFeaturesNav, FAQAccordion } from '@/components/Sections';
import { BenefitsCardsSection } from '@/components/Sections/BenefitsCards';
import { BgHighlightSection } from '@/components/Sections/BgHighlight';
import { StepGuideSection } from '@/components/Sections/StepGuide';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { DEFAULT_FAQ_ACCORDION_CONFIG } from '@/config/faqAccordion';
import { DEFAULT_BENEFITS_CARDS_CONFIG } from '@/config/benefitsCards';
import { DEFAULT_BG_HIGHLIGHT_CONFIG } from '@/config/bgHighlight';
import { DEFAULT_STEP_GUIDE_CONFIG } from '@/config/stepGuide';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import type { Metadata } from 'next';

export const dynamic = 'auto';

interface MainPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Generate metadata for the main marketing page
 * SEO Optimization: Dynamic metadata generation with i18n support
 */
export async function generateMetadata({ params }: MainPageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateStaticPageMetadata('home', locale as SupportedLocale);
}

export default async function MainPage({ params }: MainPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespaces (home + shared FAQ)
  const pageMessages = await loadPageNamespaces(locale, ['home', 'faq']);

  // Generate structured data for the home page
  const organizationData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS Financial Platform',
    description: 'Comprehensive financial platform for banking, investing, and DeFi management',
    category: 'Financial Services'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Main', url: '/main' }
  ], locale);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
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
            enableAnalytics={true}
          />
        </SectionErrorBoundary>
      </main>
    </PageI18nProvider>
  );
}
