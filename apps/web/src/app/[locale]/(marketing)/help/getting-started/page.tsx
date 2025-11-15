import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { generateStaticPageMetadata, MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { HeroSection } from '@/components/Sections';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { HERO_PAGE_CONFIGS, getVariantForPageConfig } from '@/config/hero-pages';
import { ROUTES } from '@/config/routes';
import type { Metadata } from 'next';
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
  return generateStaticPageMetadata('help/getting-started', locale as SupportedLocale);
}

export default async function HelpGettingStartedPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespace
  const pageMessages = await loadPageNamespaces(locale, ['help/getting-started']);

  const serviceData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS Getting Started',
    description: 'Quick start guide for new diBoaS users',
    category: 'Getting Started Guide'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Help', url: '/help' },
    { name: 'Getting Started', url: ROUTES.HELP.GETTING_STARTED }
  ], locale);

  const heroVariant = getVariantForPageConfig('help-getting-started');

  return (
    <PageI18nProvider pageMessages={pageMessages}>
    <>
      <StructuredData data={[serviceData, breadcrumbData]} />

      <main className="main-page-wrapper">
        <SectionErrorBoundary
          sectionId="hero-section-help-getting-started"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'help-getting-started', variant: heroVariant }}
        >
          <HeroSection
            variant={heroVariant}
            config={HERO_PAGE_CONFIGS['help-getting-started']}
            enableAnalytics={true}
            priority={true}
          />
        </SectionErrorBoundary>
      </main>
    </>
    </PageI18nProvider>
  );
}
