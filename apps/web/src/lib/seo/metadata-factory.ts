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
import { SEO_DEFAULTS, PAGE_SEO_CONFIG } from './constants';
import type { SupportedLocale } from '@diboas/i18n/server';
import { SUPPORTED_LOCALES } from '@diboas/i18n/server';

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
   * SEO: FAQ page markup with dynamic questions
   * @param customFAQs - Optional array of custom FAQ items
   */
  static generateFAQStructuredData(customFAQs?: Array<{ question: string; answer: string }>) {
    const defaultFAQs = [
      {
        question: 'What is diBoaS?',
        answer: 'diBoaS is a comprehensive financial platform that combines banking, investing, and DeFi services in one secure ecosystem.'
      },
      {
        question: 'Is diBoaS secure?',
        answer: 'Yes, diBoaS employs enterprise-grade security measures including encryption, multi-factor authentication, and regular security audits.'
      },
      {
        question: 'How do I get started with diBoaS?',
        answer: 'Getting started is simple: download the OneFi app, create your account with email verification, complete identity verification, and start exploring our banking, investing, and DeFi features.'
      },
      {
        question: 'What services does diBoaS offer?',
        answer: 'diBoaS offers personal and business banking, investment opportunities, cryptocurrency trading, DeFi services, payment processing, and financial management tools all in one platform.'
      },
      {
        question: 'Is diBoaS available in my country?',
        answer: 'diBoaS is expanding globally. Check our website or app for current availability in your region, with support for multiple languages including English, Portuguese, Spanish, and German.'
      },
      {
        question: 'How can I contact diBoaS support?',
        answer: 'Our support team is available 24/7 through in-app chat, email, phone, and our comprehensive help center with guides and FAQs.'
      },
      {
        question: 'What are the fees for using diBoaS?',
        answer: 'diBoaS offers transparent pricing with no hidden fees. Many basic services are free, while premium features have clear, competitive pricing. Check our pricing page for detailed information.'
      }
    ];

    const faqs = customFAQs || defaultFAQs;

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
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