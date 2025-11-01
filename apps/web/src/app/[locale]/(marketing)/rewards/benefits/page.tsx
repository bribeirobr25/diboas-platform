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
  return generateStaticPageMetadata('rewards/benefits', locale as SupportedLocale);
}

export default async function RewardsBenefitsPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const serviceData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS Rewards',
    description: 'Rewards that actually matter',
    category: 'Rewards Services'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Rewards Benefits', url: ROUTES.REWARDS.BENEFITS }
  ], locale);

  const heroVariant = getVariantForPageConfig('rewards-benefits');

  return (
    <>
      <StructuredData data={[serviceData, breadcrumbData]} />

      <main className="main-page-wrapper">
        <SectionErrorBoundary
          sectionId="hero-section-rewards-benefits"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'rewards-benefits', variant: heroVariant }}
        >
          <HeroSection
            variant={heroVariant}
            config={HERO_PAGE_CONFIGS['rewards-benefits']}
            enableAnalytics={true}
            priority={true}
          />
        </SectionErrorBoundary>

        
        {/* Benefits Cards Section */}
        <SectionErrorBoundary
          sectionId="benefits-cards-rewards-benefits"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'rewards-benefits' }}
        >
          <BenefitsCardsSection
            config={getBenefitsCardsConfig('rewards-benefits')!}
            variant="default"
            enableAnalytics={true}
          />
        </SectionErrorBoundary>
      </main>
    </>
  );
}
