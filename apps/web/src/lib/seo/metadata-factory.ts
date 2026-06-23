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
import { SUPPORTED_LOCALES, type SupportedLocale } from '@diboas/i18n/server';

export class SEOMetadataFactory {
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
        canonicalUrl: path,
      },
      openGraph: {
        title: pageConfig.title,
        description: pageConfig.description,
        type: 'website',
        url: path,
        ...customConfig?.openGraph,
      },
      twitter: {
        title: pageConfig.title,
        description: pageConfig.description,
        ...customConfig?.twitter,
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
            ...(SEO_DEFAULTS.organization.contactPoint.telephone
              ? { telephone: SEO_DEFAULTS.organization.contactPoint.telephone }
              : {}),
            contactType: SEO_DEFAULTS.organization.contactPoint.contactType,
            availableLanguage: [...SEO_DEFAULTS.organization.contactPoint.availableLanguage],
          },
        },
        webpage: {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: pageConfig.title,
          description: pageConfig.description,
          url: seoService.generateCanonicalUrl(path, locale),
        },
        categorySpecific: this.generateCategoryStructuredData(pageKey, pageConfig),
        ...customConfig?.structuredData,
      },
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
      areaServed: 'Worldwide',
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `${service.name} Services`,
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: service.name,
            },
          },
        ],
      },
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
        name: SEO_DEFAULTS.organization.name,
      },
      educationalLevel: 'Beginner to Advanced',
      teaches: content.category,
      courseMode: 'Online',
      isAccessibleForFree: true,
    };
  }

  /**
   * Generate FAQ structured data
   * SEO: FAQ page markup with dynamic questions
   * @param customFAQs - Optional array of custom FAQ items
   */
  static generateFAQStructuredData(customFAQs?: Array<{ question: string; answer: string }>) {
    // A17 (2026-06-11): brand-compliant FAQ copy — non-custodial voice, current
    // fees, no banned terms (no "DeFi"/"OneFi"/"banking"-as-identity, no fabricated
    // premium tiers / 24-7 phone / MFA / identity verification). Approved copy per
    // FIX_EXECUTION_TRACKER A17.
    const defaultFAQs = [
      {
        question: 'What is diBoaS?',
        answer:
          'diBoaS is a non-custodial financial side pocket — a place where your idle money can work harder, move freely, and stay yours. You hold the keys; diBoaS never holds your money.',
      },
      {
        question: 'Is diBoaS secure?',
        answer:
          "You hold your own keys, so diBoaS can't freeze or move your money. Your money works through established, independently audited systems, and every transaction needs your approval.",
      },
      {
        question: 'How do I get started with diBoaS?',
        answer:
          'Start with a goal — an emergency fund, a Christmas bonus, dollar savings — from as little as $5. You add money through trusted partners and get your own wallet that only you control.',
      },
      {
        question: 'What services does diBoaS offer?',
        answer:
          'Goal-based strategies for idle money, digital dollars, buying and holding assets like Bitcoin and gold, and free transfers to other diBoaS users — all in one place, with you keeping control of every dollar.',
      },
      {
        question: 'Is diBoaS available in my country?',
        answer:
          'diBoaS is launching across the US, EU, and Brazil, in English, Portuguese, Spanish, and German. Check the site for current availability in your region.',
      },
      {
        question: 'How can I contact diBoaS support?',
        answer:
          "Email us — we read every message. As we grow, we'll add more support channels and a full help center.",
      },
      {
        question: 'What are the fees for using diBoaS?',
        answer:
          'Every fee is shown up front: investing is free, selling or closing is 0.39%, adding or cashing out is 0.48%. No monthly fees, no minimums beyond $5, no surprises.',
      },
    ];

    const faqs = customFAQs || defaultFAQs;

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }

  /**
   * Generate structured data based on page category
   * Code Reusability: Automatic structured data selection
   */
  static generateCategoryStructuredData(
    pageKey: string,
    pageConfig: { title: string; description: string }
  ) {
    if (pageKey.startsWith('personal/')) {
      return this.generateServiceStructuredData({
        name: pageConfig.title,
        description: pageConfig.description,
        category: 'Personal Financial Services',
      });
    }

    if (pageKey.startsWith('learn/')) {
      return this.generateEducationalStructuredData({
        name: pageConfig.title,
        description: pageConfig.description,
        category: 'Financial Education',
      });
    }

    if (pageKey.startsWith('business/')) {
      return this.generateServiceStructuredData({
        name: pageConfig.title,
        description: pageConfig.description,
        category: 'Business Financial Services',
      });
    }

    if (pageKey.startsWith('rewards/')) {
      return this.generateServiceStructuredData({
        name: pageConfig.title,
        description: pageConfig.description,
        category: 'Loyalty and Rewards',
      });
    }

    if (pageKey.startsWith('security/')) {
      return this.generateServiceStructuredData({
        name: pageConfig.title,
        description: pageConfig.description,
        category: 'Security Services',
      });
    }

    if (pageKey === 'help/faq') {
      return this.generateFAQStructuredData();
    }

    // Default service structured data
    return this.generateServiceStructuredData({
      name: pageConfig.title,
      description: pageConfig.description,
      category: 'Financial Services',
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
