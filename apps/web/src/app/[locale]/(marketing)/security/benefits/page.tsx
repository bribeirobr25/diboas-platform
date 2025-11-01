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
  return generateStaticPageMetadata('security/benefits', locale as SupportedLocale);
}

export default async function SecurityBenefitsPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const serviceData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS Protection',
    description: 'Military-grade security',
    category: 'Security Services'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Security Benefits', url: ROUTES.SECURITY.BENEFITS }
  ], locale);

  const heroVariant = getVariantForPageConfig('security-benefits');

  return (
    <>
      <StructuredData data={[serviceData, breadcrumbData]} />

      <main className="main-page-wrapper">
        <SectionErrorBoundary
          sectionId="hero-section-security-benefits"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'security-benefits', variant: heroVariant }}
        >
          <HeroSection
            variant={heroVariant}
            config={HERO_PAGE_CONFIGS['security-benefits']}
            enableAnalytics={true}
            priority={true}
          />
        </SectionErrorBoundary>

        
        {/* Benefits Cards Section */}
        <SectionErrorBoundary
          sectionId="benefits-cards-security-benefits"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'security-benefits' }}
        >
          <BenefitsCardsSection
            config={getBenefitsCardsConfig('security-benefits')!}
            variant="default"
            enableAnalytics={true}
          />
        </SectionErrorBoundary>
      </main>
    </>
  );
}
