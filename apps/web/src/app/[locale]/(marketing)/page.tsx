import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n';
import { generatePageMetadata, generateLocaleStaticParams } from '@/lib/metadata-factory';
import { PageBuilder } from '@/lib/page-builder';
import { homePageConfig } from '@/lib/content/pages/home';

/**
 * Home Page - Marketing Landing Page
 * 
 * SEO: Optimized metadata and structured data
 * i18n: Locale-aware content and metadata
 * Performance: Static generation with ISR
 * Analytics: Page view tracking
 */

interface HomePageProps {
  params: {
    locale: string;
  };
}

// DRY Principle: Use centralized metadata generation
export async function generateMetadata({ 
  params 
}: { 
  params: { locale: string } 
}): Promise<Metadata> {
  const locale = params.locale as SupportedLocale;
  
  if (!isValidLocale(locale)) {
    notFound();
  }

  const pageConfig = homePageConfig[locale] || homePageConfig.en;
  
  return generatePageMetadata({
    title: pageConfig.metadata.title,
    description: pageConfig.metadata.description,
    keywords: pageConfig.metadata.keywords,
    path: `/${locale}`,
    image: pageConfig.metadata.openGraph?.image || '/api/og/home'
  }, locale);
}

// DRY Principle: Use centralized static params generation
export const generateStaticParams = generateLocaleStaticParams;

export default function HomePage({ params }: HomePageProps) {
  const locale = params.locale as SupportedLocale;
  
  // Security: Validate locale
  if (!isValidLocale(locale)) {
    notFound();
  }

  // Get page configuration for locale
  const pageConfig = homePageConfig[locale] || homePageConfig.en;

  // Analytics: Track page view (handled by layout/middleware)
  // Performance: Page optimization settings from config
  if (pageConfig.optimization?.criticalCSS) {
    // Critical CSS would be injected here
  }

  return (
    <>
      {/* Performance: Preload critical assets */}
      {pageConfig.optimization?.preloadAssets?.map((asset) => (
        <link
          key={asset}
          rel="preload"
          as="image"
          href={asset}
        />
      ))}
      
      {/* Main page content */}
      <PageBuilder 
        sections={pageConfig.sections}
        locale={locale}
      />
    </>
  );
}

// Performance: Enable ISR (Incremental Static Regeneration)
export const revalidate = 3600; // Revalidate every hour

// Performance: Force static generation
export const dynamic = 'force-static';