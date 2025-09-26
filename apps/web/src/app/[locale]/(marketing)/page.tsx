import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n';
import { generateStaticPageMetadata, MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { HeroSection } from '@/components/Sections';
import { ProductCarousel, FeatureShowcase, AppFeaturesCarousel, SecurityOneFeature } from '@/components/Sections';
import { BRAND_CONFIG } from '@/config/brand';
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
        <HeroSection 
          variant="fullBackground"
          enableAnalytics={true}
          priority={true}
        />
        <ProductCarousel />
        <FeatureShowcase />
        <AppFeaturesCarousel />
        <SecurityOneFeature />
        {/* Additional content sections will be developed later */}
      </main>
    </>
  );
}