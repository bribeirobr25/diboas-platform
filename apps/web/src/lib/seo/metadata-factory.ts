/**
 * Metadata Factory
 * Factory Pattern: Creates metadata for different page types
 * DRY Principle: Reusable metadata generation
 *
 * This is the canonical metadata factory. All metadata generation should use this factory.
 * Previously there was a simpler factory at /lib/metadata-factory.ts which is now deprecated.
 */

import { seoService } from './service';
import { SEO_DEFAULTS } from './constants';
import type { SupportedLocale } from '@diboas/i18n/server';

export class SEOMetadataFactory {
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
}
