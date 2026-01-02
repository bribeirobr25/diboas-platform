/**
 * @deprecated This file is deprecated. Use the comprehensive metadata factory instead:
 *
 * ```typescript
 * import { MetadataFactory, generateStaticPageMetadata, generateLocaleStaticParams } from '@/lib/seo';
 * ```
 *
 * The comprehensive factory at /lib/seo/metadata-factory.ts provides:
 * - Integration with PAGE_SEO_CONFIG for static pages
 * - Structured data generation (JSON-LD)
 * - Breadcrumbs, FAQ, Service, and Educational schema support
 * - Better locale-aware URL generation
 *
 * This file will be removed in a future release.
 *
 * ---
 *
 * DRY Principle: Centralized metadata generation factory
 *
 * Eliminates duplicate generateMetadata() functions across pages
 * and provides consistent SEO metadata patterns
 */

import { type Metadata } from 'next';
import { type SupportedLocale, SUPPORTED_LOCALES } from '@diboas/i18n/server';
import { BRAND_CONFIG } from '@/config/brand';

export interface PageMetadataConfig {
  title: string;
  description: string;
  domain?: string;
  path?: string;
  image?: string;
  keywords?: string[];
  noIndex?: boolean;
  alternateLanguages?: boolean;
}

/**
 * @deprecated Use `generateStaticPageMetadata` or `generateDynamicPageMetadata` from '@/lib/seo' instead.
 */
export function generatePageMetadata(
  config: PageMetadataConfig,
  locale: SupportedLocale = 'en'
): Metadata {
  const {
    title,
    description,
    domain = process.env.NEXT_PUBLIC_SITE_DOMAIN || 'diboas.com',
    path = '/',
    image = '/api/og/default',
    keywords = [],
    noIndex = false,
    alternateLanguages = true
  } = config;

  const siteTitle = BRAND_CONFIG.FULL_NAME;
  const fullTitle = `${title} | ${siteTitle}`;
  const canonicalUrl = `https://${domain}${path}`;
  const ogImageUrl = image.startsWith('/api/') ? `https://${domain}${image}` : image;

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords.join(', ') : undefined,
    robots: noIndex ? 'noindex, nofollow' : 'index, follow',
    openGraph: {
      type: 'website',
      locale,
      url: canonicalUrl,
      title: fullTitle,
      description,
      siteName: siteTitle,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@diboas',
      creator: '@diboas',
      title: fullTitle,
      description,
      images: [ogImageUrl],
    },
    icons: {
      icon: [
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
  };

  // Add alternate language URLs for SEO
  if (alternateLanguages) {
    metadata.alternates = {
      languages: {
        'en': `https://${domain}/en${path}`,
        'pt-BR': `https://${domain}/pt-BR${path}`,
        'es': `https://${domain}/es${path}`,
        'de': `https://${domain}/de${path}`,
      },
    };
  }

  return metadata;
}

/**
 * @deprecated Use `generateLocaleStaticParams` from '@/lib/seo' instead.
 *
 * Generate static params for Next.js locale-based routing
 * DRY Principle: Single source for generateStaticParams across pages
 */
export function generateLocaleStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({
    locale,
  }));
}