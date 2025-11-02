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
  return generateStaticPageMetadata('help/faq', locale as SupportedLocale);
}

export default async function HelpFaqPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const serviceData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS FAQ',
    description: 'Your questions, our answers',
    category: 'Help Services'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'FAQ', url: ROUTES.HELP.FAQ }
  ], locale);

  const heroVariant = getVariantForPageConfig('help-faq');

  return (
    <>
      <StructuredData data={[serviceData, breadcrumbData]} />

      <main className="main-page-wrapper">
        <SectionErrorBoundary
          sectionId="hero-section-help-faq"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'help-faq', variant: heroVariant }}
        >
          <HeroSection
            variant={heroVariant}
            config={HERO_PAGE_CONFIGS['help-faq']}
            enableAnalytics={true}
            priority={true}
          />
        </SectionErrorBoundary>

        {/* Feature Showcase Section */}
        <SectionErrorBoundary
          sectionId="feature-showcase-helpFaq"
          sectionType="FeatureShowcase"
          enableReporting={true}
          context={{ page: 'helpFaq' }}
        >
          <FeatureShowcase
            variant="default"
            config={FEATURE_SHOWCASE_PAGE_CONFIGS.helpFaq}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>


        
        {/* Benefits Cards Section */}
        <SectionErrorBoundary
          sectionId="benefits-cards-help-faq"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'help-faq' }}
        >
          <BenefitsCardsSection
            config={getBenefitsCardsConfig('help-faq')!}
            variant="default"
            enableAnalytics={true}
          />
        </SectionErrorBoundary>

        {/* Sticky Features Navigation Section */}
        <SectionErrorBoundary
          sectionId="sticky-features-nav-helpFaq"
          sectionType="StickyFeaturesNav"
          enableReporting={true}
          context={{ page: 'helpFaq' }}
        >
          <StickyFeaturesNav
            variant="default"
            config={STICKY_FEATURES_NAV_PAGE_CONFIGS.helpFaq}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>
      
        {/* FAQ Accordion Section */}
        <SectionErrorBoundary
          sectionId="faq-accordion-helpFaq"
          sectionType="FAQAccordion"
          enableReporting={true}
          context={{ page: 'helpFaq' }}
        >
          <FAQAccordion
            variant="default"
            config={FAQ_ACCORDION_PAGE_CONFIGS.helpFaq!}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>

      </main>
    </>
  );
}
