import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { generateStaticPageMetadata, MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { HeroSection, FeatureShowcase } from '@/components/Sections';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { BENEFITS_SHOWCASE_CONFIG } from '@/config/benefitsCarousel';
import type { Metadata } from 'next';
export const dynamic = 'auto';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateStaticPageMetadata('benefits', locale as SupportedLocale);
}

export default async function BenefitsPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Generate structured data for the benefits page
  const serviceData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS Benefits & Rewards',
    description: 'Discover the exclusive benefits and rewards available with diBoaS financial platform',
    category: 'Financial Benefits'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Benefits', url: '/benefits' }
  ], locale);

  return (
    <>
      <StructuredData data={[serviceData, breadcrumbData]} />
      
      <main className="main-page-wrapper">
        <SectionErrorBoundary
          sectionId="hero-section-benefits"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'benefits', variant: 'default' }}
        >
          <HeroSection 
            variant="default"
            enableAnalytics={true}
            priority={true}
          />
        </SectionErrorBoundary>
        
        {/* Benefits Showcase Section */}
        <SectionErrorBoundary
          sectionId="feature-showcase-benefits"
          sectionType="FeatureShowcase"
          enableReporting={true}
          context={{ page: 'benefits', variant: 'benefits' }}
        >
          <FeatureShowcase 
            variant="benefits"
            config={BENEFITS_SHOWCASE_CONFIG}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>
        
        {/* Benefits content sections will be added here */}
        <div className="page-content-container">
          <div className="page-content-center">
            <div className="page-content-text-center">
              <h2 className="page-title-construction">
                More Benefits Details Coming Soon
              </h2>
              <p className="page-description-construction">
                Additional benefits information will be added here.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}