/**
 * Metadata Factory
 * Factory Pattern: Creates metadata for different page types
 * DRY Principle: Reusable metadata generation
 */

import { Metadata } from 'next';
import { seoService } from './service';
import { PageSEOConfig } from './types';
import { SEO_DEFAULTS, PAGE_SEO_CONFIG } from './constants';
import type { SupportedLocale } from '@diboas/i18n/server';

export class MetadataFactory {
  /**
   * Generate metadata for static pages
   * Code Reusability: Single function for all static pages
   */
  static async generateStaticPageMetadata(
    pageKey: keyof typeof PAGE_SEO_CONFIG,
    locale: SupportedLocale,
    customConfig?: Partial<PageSEOConfig>
  ): Promise<Metadata> {
    const pageConfig = PAGE_SEO_CONFIG[pageKey];
    const path = `/${pageKey}`;

    const config: PageSEOConfig = {
      metadata: {
        title: pageConfig.title,
        description: pageConfig.description,
        keywords: pageConfig.keywords ? [...pageConfig.keywords] : undefined,
        canonicalUrl: path
      },
      openGraph: {
        title: pageConfig.title,
        description: pageConfig.description,
        type: 'website',
        url: path,
        ...customConfig?.openGraph
      },
      twitter: {
        title: pageConfig.title,
        description: pageConfig.description,
        ...customConfig?.twitter
      },
      structuredData: {
        organization: {
          '@type': 'Organization',
          name: SEO_DEFAULTS.organization.name,
          url: SEO_DEFAULTS.siteUrl,
          logo: `${SEO_DEFAULTS.siteUrl}/assets/logos/logo-icon.avif`,
          sameAs: [...SEO_DEFAULTS.organization.sameAs],
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: SEO_DEFAULTS.organization.contactPoint.telephone,
            contactType: SEO_DEFAULTS.organization.contactPoint.contactType,
            availableLanguage: [...SEO_DEFAULTS.organization.contactPoint.availableLanguage]
          }
        },
        webpage: {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: pageConfig.title,
          description: pageConfig.description,
          url: seoService.generateCanonicalUrl(path, locale)
        },
        categorySpecific: this.generateCategoryStructuredData(pageKey, pageConfig),
        ...customConfig?.structuredData
      }
    };

    return seoService.generateMetadata(config, locale);
  }

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
        canonicalUrl: path
      },
      ...additionalConfig
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
        item: item.url ? seoService.generateCanonicalUrl(item.url, currentLocale) : undefined
      }))
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
        name: service.provider || SEO_DEFAULTS.organization.name
      },
      areaServed: 'Worldwide',
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `${service.name} Services`,
        itemListElement: [{
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: service.name
          }
        }]
      }
    };
  }

  /**
   * Generate educational content structured data
   * SEO: Course/educational content markup
   */
  static generateEducationalStructuredData(content: {
    name: string;
    description: string;
    category: string;
  }) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: content.name,
      description: content.description,
      provider: {
        '@type': 'Organization',
        name: SEO_DEFAULTS.organization.name
      },
      educationalLevel: 'Beginner to Advanced',
      teaches: content.category,
      courseMode: 'Online',
      isAccessibleForFree: true
    };
  }

  /**
   * Generate FAQ structured data
   * SEO: FAQ page markup
   */
  static generateFAQStructuredData() {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [{
        '@type': 'Question',
        name: 'What is diBoaS?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'diBoaS is a comprehensive financial platform that combines banking, investing, and DeFi services in one secure ecosystem.'
        }
      }, {
        '@type': 'Question',
        name: 'Is diBoaS secure?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, diBoaS employs enterprise-grade security measures including encryption, multi-factor authentication, and regular security audits.'
        }
      }]
    };
  }

  /**
   * Generate structured data based on page category
   * Code Reusability: Automatic structured data selection
   */
  static generateCategoryStructuredData(pageKey: string, pageConfig: any) {
    if (pageKey.startsWith('personal/')) {
      return this.generateServiceStructuredData({
        name: pageConfig.title,
        description: pageConfig.description,
        category: 'Personal Financial Services'
      });
    }

    if (pageKey.startsWith('learn/')) {
      return this.generateEducationalStructuredData({
        name: pageConfig.title,
        description: pageConfig.description,
        category: 'Financial Education'
      });
    }

    if (pageKey.startsWith('business/')) {
      return this.generateServiceStructuredData({
        name: pageConfig.title,
        description: pageConfig.description,
        category: 'Business Financial Services'
      });
    }

    if (pageKey.startsWith('rewards/')) {
      return this.generateServiceStructuredData({
        name: pageConfig.title,
        description: pageConfig.description,
        category: 'Loyalty and Rewards'
      });
    }

    if (pageKey.startsWith('security/')) {
      return this.generateServiceStructuredData({
        name: pageConfig.title,
        description: pageConfig.description,
        category: 'Security Services'
      });
    }

    if (pageKey === 'help/faq') {
      return this.generateFAQStructuredData();
    }

    // Default service structured data
    return this.generateServiceStructuredData({
      name: pageConfig.title,
      description: pageConfig.description,
      category: 'Financial Services'
    });
  }
}