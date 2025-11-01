import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { generateStaticPageMetadata, MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { HeroSection } from '@/components/Sections';
import { BenefitsCardsSection } from '@/components/Sections/BenefitsCards';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { HERO_PAGE_CONFIGS, getVariantForPageConfig } from '@/config/hero-pages';
import { getBenefitsCardsConfig } from '@/config/benefitsCards-pages';
import { ROUTES } from '@/config/routes';
import type { Metadata } from 'next';

export const dynamic = 'auto';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateStaticPageMetadata('account', locale as SupportedLocale);
}

export default async function AccountPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Generate structured data for the account page
  const serviceData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS Account',
    description: 'Free account that earns 100% CDI and puts you in control of your money',
    category: 'Financial Services'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Account', url: ROUTES.ACCOUNT }
  ], locale);

  const heroVariant = getVariantForPageConfig('account');

  return (
    <>
      <StructuredData data={[serviceData, breadcrumbData]} />

      <main className="main-page-wrapper">
        <SectionErrorBoundary
          sectionId="hero-section-account"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'account', variant: heroVariant }}
        >
          <HeroSection
            variant={heroVariant}
            config={HERO_PAGE_CONFIGS.account}
            enableAnalytics={true}
            priority={true}
          />
        </SectionErrorBoundary>

        {/* Benefits Cards Section */}
        <SectionErrorBoundary
          sectionId="benefits-cards-account"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'account' }}
        >
          <BenefitsCardsSection
            config={getBenefitsCardsConfig('account')!}
            variant="default"
            enableAnalytics={true}
          />
        </SectionErrorBoundary>
      </main>
    </>
  );
}