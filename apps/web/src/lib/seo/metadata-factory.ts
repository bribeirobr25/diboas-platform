/**
 * Metadata Factory
 * Factory Pattern: Creates metadata for different page types
 * DRY Principle: Reusable metadata generation
 *
 * This is the canonical metadata factory. All metadata generation should use this factory.
 * Previously there was a simpler factory at /lib/metadata-factory.ts which is now deprecated.
 */

import { Metadata } from 'next';
import { seoService } from './service';
import { PageSEOConfig } from './types';
import { SEO_DEFAULTS } from './constants';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@diboas/i18n/server';

export class SEOMetadataFactory {
  /**
   * Generate metadata for dynamic pages
   * Flexibility: Allows custom metadata per page
   */
  static async generateDynamicPageMetadata(
    title: string,
    description: string,
    path: string,
    locale: SupportedLocale,
    additionalConfig?: Partial<PageSEOConfig>
  ): Promise<Metadata> {
    const config: PageSEOConfig = {
      metadata: {
        title,
        description,
        canonicalUrl: path,
      },
      ...additionalConfig,
    };

    return seoService.generateMetadata(config, locale);
  }

  /**
   * Generate breadcrumb structured data
   * SEO: Improves site navigation in search results
   */
  static generateBreadcrumbs(
    items: Array<{ name: string; url?: string }>,
    currentLocale: SupportedLocale
  ) {
    const breadcrumbs = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url ? seoService.generateCanonicalUrl(item.url, currentLocale) : undefined,
      })),
    };

    return breadcrumbs;
  }

  /**
   * Generate service structured data for pages
   * SEO: Service-specific structured data
   */
  static generateServiceStructuredData(service: {
    name: string;
    description: string;
    category: string;
    provider?: string;
  }) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.name,
      description: service.description,
      category: service.category,
      provider: {
        '@type': 'Organization',
        name: service.provider || SEO_DEFAULTS.organization.name,
      },
      // No `areaServed: 'Worldwide'` (the Practice app is geofenced) and no `Offer` catalogue
      // (no financial product is offered on this site): step 2, register 5.643.
    };
  }

  /**
   * Generate static params for Next.js locale-based routing
   * DRY Principle: Single source for generateStaticParams across pages
   */
  static generateLocaleStaticParams() {
    return SUPPORTED_LOCALES.map((locale) => ({
      locale,
    }));
  }
}
