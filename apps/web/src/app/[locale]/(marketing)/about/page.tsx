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
  return generateStaticPageMetadata('about', locale as SupportedLocale);
}

export default async function AboutPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespaces (about + shared: home for StickyFeaturesNav, faq for FAQAccordion)
  const pageMessages = await loadPageNamespaces(locale, ['about', 'home', 'faq']);

  const serviceData = MetadataFactory.generateServiceStructuredData({
    name: 'About diBoaS',
    description: "The world's first OneFi platform",
    category: 'About'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'About', url: ROUTES.ABOUT }
  ], locale);

  const heroVariant = getVariantForPageConfig('about');

  return (
    <PageI18nProvider pageMessages={pageMessages}>
    <>
      <StructuredData data={[serviceData, breadcrumbData]} />

      <main className="main-page-wrapper">
        <SectionErrorBoundary
          sectionId="hero-section-about"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'about', variant: heroVariant }}
        >
          <HeroSection
            variant={heroVariant}
            config={HERO_PAGE_CONFIGS.about}
            enableAnalytics={true}
            priority={true}
          />
        </SectionErrorBoundary>

        {/* Feature Showcase Section */}
        <SectionErrorBoundary
          sectionId="feature-showcase-about"
          sectionType="FeatureShowcase"
          enableReporting={true}
          context={{ page: 'about' }}
        >
          <FeatureShowcase
            config={FEATURE_SHOWCASE_PAGE_CONFIGS.about}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>


        
        {/* Benefits Cards Section */}
        <SectionErrorBoundary
          sectionId="benefits-cards-about"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'about' }}
        >
          <BenefitsCardsSection
            config={getBenefitsCardsConfig('about')!}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>

        {/* Sticky Features Navigation Section */}
        <SectionErrorBoundary
          sectionId="sticky-features-nav-about"
          sectionType="StickyFeaturesNav"
          enableReporting={true}
          context={{ page: 'about' }}
        >
          <StickyFeaturesNav
            config={STICKY_FEATURES_NAV_PAGE_CONFIGS.about}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>
      
        {/* FAQ Accordion Section */}
        <SectionErrorBoundary
          sectionId="faq-accordion-about"
          sectionType="FAQAccordion"
          enableReporting={true}
          context={{ page: 'about' }}
        >
          <FAQAccordion
            config={FAQ_ACCORDION_PAGE_CONFIGS.about!}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>

      </main>
    </>
    </PageI18nProvider>
  );
}
