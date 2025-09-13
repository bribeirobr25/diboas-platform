import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/config';
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

// SEO: Generate page-specific metadata
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
  
  return {
    title: pageConfig.metadata.title,
    description: pageConfig.metadata.description,
    keywords: pageConfig.metadata.keywords,
    openGraph: {
      title: pageConfig.metadata.openGraph?.title || pageConfig.metadata.title,
      description: pageConfig.metadata.openGraph?.description || pageConfig.metadata.description,
      url: `https://diboas.com/${locale}`,
      siteName: 'diBoaS',
      images: [
        {
          url: pageConfig.metadata.openGraph?.image || '/assets/social/home-og.jpg',
          width: 1200,
          height: 630,
          alt: 'diBoaS - Financial Freedom Made Simple'
        }
      ],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageConfig.metadata.twitter?.title || pageConfig.metadata.title,
      description: pageConfig.metadata.twitter?.description || pageConfig.metadata.description,
      images: [pageConfig.metadata.twitter?.image || '/assets/social/home-twitter.jpg'],
    },
    alternates: {
      canonical: `https://diboas.com/${locale}`,
      languages: pageConfig.metadata.alternates
    },
    other: {
      // Structured Data
      'script:ld+json': JSON.stringify(pageConfig.metadata.jsonLd)
    }
  };
}

// Performance: Generate static params for supported locales
export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'pt-BR' },
    { locale: 'es' },
    { locale: 'de' }
  ];
}

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