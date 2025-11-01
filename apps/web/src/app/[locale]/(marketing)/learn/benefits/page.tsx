import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { generateStaticPageMetadata, MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { HeroSection } from '@/components/Sections';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { HERO_PAGE_CONFIGS, getVariantForPageConfig } from '@/config/hero-pages';
import { ROUTES } from '@/config/routes';
import type { Metadata } from 'next';


import { BenefitsCardsSection } from '@/components/Sections/BenefitsCards';
import { getBenefitsCardsConfig } from '@/config/benefitsCards-pages';
export const dynamic = 'auto';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateStaticPageMetadata('learn/benefits', locale as SupportedLocale);
}

export default async function LearnBenefitsPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const serviceData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS Learn Center',
    description: 'Financial education for everyone',
    category: 'Educational Services'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Learn Benefits', url: ROUTES.LEARN.BENEFITS }
  ], locale);

  const heroVariant = getVariantForPageConfig('learn-benefits');

  return (
    <>
      <StructuredData data={[serviceData, breadcrumbData]} />

      <main className="main-page-wrapper">
        <SectionErrorBoundary
          sectionId="hero-section-learn-benefits"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'learn-benefits', variant: heroVariant }}
        >
          <HeroSection
            variant={heroVariant}
            config={HERO_PAGE_CONFIGS['learn-benefits']}
            enableAnalytics={true}
            priority={true}
          />
        </SectionErrorBoundary>

        
        {/* Benefits Cards Section */}
        <SectionErrorBoundary
          sectionId="benefits-cards-learn-benefits"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'learn-benefits' }}
        >
          <BenefitsCardsSection
            config={getBenefitsCardsConfig('learn-benefits')!}
            variant="default"
            enableAnalytics={true}
          />
        </SectionErrorBoundary>
      </main>
    </>
  );
}