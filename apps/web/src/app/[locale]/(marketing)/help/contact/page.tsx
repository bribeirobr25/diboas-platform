import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { generateStaticPageMetadata, MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { HeroSection } from '@/components/Sections';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { HERO_PAGE_CONFIGS, getVariantForPageConfig } from '@/config/hero-pages';
import { ROUTES } from '@/config/routes';
import type { Metadata } from 'next';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';

export const dynamic = 'auto';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateStaticPageMetadata('help/contact', locale as SupportedLocale);
}

export default async function HelpContactPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespace
  const pageMessages = await loadPageNamespaces(locale, ['help/contact']);

  const serviceData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS Contact Support',
    description: 'Get in touch with diBoaS support team',
    category: 'Customer Support'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Help', url: '/help' },
    { name: 'Contact', url: ROUTES.HELP.CONTACT }
  ], locale);

  const heroVariant = getVariantForPageConfig('help-contact');

  return (
    <PageI18nProvider pageMessages={pageMessages}>
    <>
      <StructuredData data={[serviceData, breadcrumbData]} />

      <main className="main-page-wrapper">
        <SectionErrorBoundary
          sectionId="hero-section-help-contact"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'help-contact', variant: heroVariant }}
        >
          <HeroSection
            variant={heroVariant}
            config={HERO_PAGE_CONFIGS['help-contact']}
            enableAnalytics={true}
            priority={true}
          />
        </SectionErrorBoundary>
      </main>
    </>
    </PageI18nProvider>
  );
}
