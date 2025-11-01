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
  return generateStaticPageMetadata('learn/cryptocurrency-guide', locale as SupportedLocale);
}

export default async function CryptocurrencyGuidePage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

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

        
        {/* Benefits Cards Section */}
        <SectionErrorBoundary
          sectionId="benefits-cards-cryptocurrency-guide"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'cryptocurrency-guide' }}
        >
          <BenefitsCardsSection
            config={getBenefitsCardsConfig('cryptocurrency-guide')!}
            variant="default"
            enableAnalytics={true}
          />
        </SectionErrorBoundary>
      </main>
    </>
  );
}
