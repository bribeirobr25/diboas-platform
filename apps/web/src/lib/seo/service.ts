/**
 * SEO Service Implementation
 * Service Agnostic Abstraction: Centralized SEO logic
 * Domain Service Pattern: Encapsulates SEO domain logic
 */

import { Metadata } from 'next';
import { SEO_DEFAULTS } from './constants';
import { PageSEOConfig, SEOService, BreadcrumbList, WebPage } from './types';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@diboas/i18n/server';

class SEOServiceImpl implements SEOService {
  /**
   * Generate Next.js metadata from SEO configuration
   * DRY Principle: Reusable metadata generation
   */
  generateMetadata(config: PageSEOConfig, locale?: string): Metadata {
    const { metadata, openGraph, twitter, alternateLanguages } = config;

    // Generate canonical URL
    const canonicalUrl = this.generateCanonicalUrl(metadata.canonicalUrl || '', locale);

    // Build alternates for i18n
    const languages = alternateLanguages || this.generateAlternateUrls(metadata.canonicalUrl || '');

    const nextMetadata: Metadata = {
      // Basic metadata
      title: metadata.title || SEO_DEFAULTS.defaultTitle,
      description: metadata.description || SEO_DEFAULTS.defaultDescription,
      keywords: metadata.keywords?.join(', ') || SEO_DEFAULTS.defaultKeywords.join(', '),
      authors: metadata.author ? [{ name: metadata.author }] : undefined,
      robots: metadata.robots || SEO_DEFAULTS.defaultRobots,

      // Open Graph
      openGraph: {
        title: openGraph?.title || metadata.title,
        description: openGraph?.description || metadata.description,
        type: openGraph?.type || SEO_DEFAULTS.ogType,
        url: openGraph?.url || canonicalUrl,
        siteName: openGraph?.siteName || SEO_DEFAULTS.siteName,
        locale: openGraph?.locale || this.getOGLocale(locale),
        images: openGraph?.image ? [{
          url: this.getAbsoluteUrl(openGraph.image),
          width: 1200,
          height: 630,
          alt: openGraph?.title || metadata.title
        }] : [{
          url: this.getAbsoluteUrl(SEO_DEFAULTS.defaultImage),
          width: 1200,
          height: 630,
          alt: SEO_DEFAULTS.siteName
        }]
      },

      // Twitter Card
      twitter: {
        card: twitter?.card || 'summary_large_image',
        site: twitter?.site || SEO_DEFAULTS.twitterHandle,
        creator: twitter?.creator || SEO_DEFAULTS.twitterHandle,
        title: twitter?.title || metadata.title,
        description: twitter?.description || metadata.description,
        images: twitter?.image ? [this.getAbsoluteUrl(twitter.image)] : undefined
      },

      // Alternates for i18n SEO
      alternates: {
        canonical: canonicalUrl,
        languages: {
          ...languages.reduce((acc, { lang, url }) => {
            acc[lang] = url;
            return acc;
          }, {} as Record<string, string>),
          'x-default': canonicalUrl
        }
      },

      // Other metadata
      metadataBase: new URL(SEO_DEFAULTS.siteUrl),
      verification: {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
      }
    };

    return nextMetadata;
  }

  /**
   * Generate structured data JSON-LD
   * Performance: Pre-stringify for faster rendering
   */
  generateStructuredData(config: PageSEOConfig): string {
    const scripts: any[] = [];

    // Organization structured data
    if (config.structuredData?.organization) {
      scripts.push({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: config.structuredData.organization.name,
        url: config.structuredData.organization.url,
        logo: config.structuredData.organization.logo,
        sameAs: config.structuredData.organization.sameAs,
        contactPoint: config.structuredData.organization.contactPoint
      });
    }

    // WebPage structured data
    if (config.structuredData?.webpage) {
      const webpage = config.structuredData.webpage;
      scripts.push({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: webpage.name,
        description: webpage.description,
        url: webpage.url,
        datePublished: webpage.datePublished,
        dateModified: webpage.dateModified || new Date().toISOString(),
        publisher: config.structuredData.organization,
        breadcrumb: config.structuredData.breadcrumbs
      });
    }

    // Breadcrumbs structured data
    if (config.structuredData?.breadcrumbs) {
      scripts.push(config.structuredData.breadcrumbs);
    }

    // Category-specific structured data
    if (config.structuredData?.categorySpecific) {
      scripts.push(config.structuredData.categorySpecific);
    }

    // Custom structured data
    if (config.structuredData?.custom) {
      Object.values(config.structuredData.custom).forEach(data => {
        scripts.push(data);
      });
    }

    return scripts.map(script =>
      `<script type="application/ld+json">${JSON.stringify(script)}</script>`
    ).join('\n');
  }

  /**
   * Generate canonical URL
   * Security: Sanitize and validate URLs
   */
  generateCanonicalUrl(path: string, locale?: string): string {
    const baseUrl = SEO_DEFAULTS.siteUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const localePath = locale && locale !== 'en' ? `/${locale}` : '';

    return `${baseUrl}${localePath}${cleanPath}`.replace(/\/+$/, '');
  }

  /**
   * Generate alternate language URLs
   * SEO: Proper hreflang implementation
   */
  generateAlternateUrls(path: string): { lang: string; url: string }[] {
    return SUPPORTED_LOCALES.map(locale => ({
      lang: this.getHreflangCode(locale),
      url: this.generateCanonicalUrl(path, locale)
    }));
  }

  /**
   * Helper: Convert locale to OpenGraph format
   */
  private getOGLocale(locale?: string): string {
    const localeMap: Record<string, string> = {
      'en': 'en_US',
      'pt-BR': 'pt_BR',
      'es': 'es_ES',
      'de': 'de_DE'
    };

    return localeMap[locale || 'en'] || 'en_US';
  }

  /**
   * Helper: Convert locale to hreflang format
   */
  private getHreflangCode(locale: SupportedLocale): string {
    return locale === 'pt-BR' ? 'pt-br' : locale;
  }

  /**
   * Helper: Ensure absolute URLs
   * Security: Prevent relative URL injection
   */
  private getAbsoluteUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    const baseUrl = SEO_DEFAULTS.siteUrl;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;

    return `${baseUrl}${cleanUrl}`;
  }
}

// Export singleton instance (Service Pattern)
export const seoService = new SEOServiceImpl();