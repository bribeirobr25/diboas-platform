/**
 * SEO Constants
 * Semantic Naming: No hardcoding - all SEO values centralized
 * Code Reusability: Shared across all pages
 */

import { BRAND_CONFIG } from '@/config/brand';
import { ASSET_PATHS } from '@/config/assets';
import { DATE_FORMATS, CURRENCY_CONFIG } from '@/config/formats';

export const SEO_DEFAULTS = {
  // Site-wide defaults
  siteName: BRAND_CONFIG.NAME,
  siteUrl: process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.NEXT_PUBLIC_SITE_DOMAIN || 'diboas.com'}`,
  defaultImage: ASSET_PATHS.SEO.DEFAULT_OG,
  twitterHandle: BRAND_CONFIG.TWITTER_HANDLE,

  // Default metadata
  defaultTitle: `${BRAND_CONFIG.NAME} - ${BRAND_CONFIG.TAGLINE}`,
  titleTemplate: `%s | ${BRAND_CONFIG.NAME}`,
  defaultDescription: `Complete financial ecosystem with banking, investing, and DeFi in one secure platform. Join 50,000+ users managing their financial future with ${BRAND_CONFIG.NAME}.`,
  defaultKeywords: [
    'digital banking',
    'cryptocurrency',
    'DeFi',
    'investment platform',
    'financial services',
    'fintech',
    'secure banking',
    'crypto investing'
  ],

  // Technical SEO
  defaultRobots: 'index, follow',
  defaultViewport: 'width=device-width, initial-scale=1',
  defaultCharset: 'utf-8',

  // Open Graph defaults
  ogType: 'website' as const,
  ogLocale: 'en_US',

  // Structured data defaults
  organization: {
    name: BRAND_CONFIG.COMPANY_NAME,
    legalName: BRAND_CONFIG.LEGAL_NAME,
    foundingDate: BRAND_CONFIG.FOUNDING_DATE,
    address: {
      streetAddress: BRAND_CONFIG.ADDRESS.STREET,
      addressLocality: BRAND_CONFIG.ADDRESS.CITY,
      addressRegion: BRAND_CONFIG.ADDRESS.STATE,
      postalCode: BRAND_CONFIG.ADDRESS.ZIP,
      addressCountry: BRAND_CONFIG.ADDRESS.COUNTRY
    },
    contactPoint: {
      telephone: BRAND_CONFIG.SUPPORT_PHONE,
      contactType: 'customer service',
      availableLanguage: ['English', 'Portuguese', 'Spanish', 'German']
    },
    sameAs: [
      BRAND_CONFIG.TWITTER_URL,
      BRAND_CONFIG.LINKEDIN_URL,
      BRAND_CONFIG.GITHUB_URL
    ]
  }
} as const;

/**
 * Page-specific SEO configurations
 * Only includes pages that exist in the (landing) route group.
 * Marketing pages removed 2026-04-04.
 */
export const PAGE_SEO_CONFIG = {
  home: {
    title: 'Financial Freedom Made Simple',
    description: 'Complete financial ecosystem with banking, investing, and DeFi in one secure platform.',
    keywords: ['digital banking', 'crypto platform', 'DeFi services']
  },
  about: {
    title: 'About diBoaS - Our Mission and Vision',
    description: 'Learn about diBoaS mission to democratize financial services and empower global communities.',
    keywords: ['about diBoaS', 'company mission', 'financial innovation']
  },
  business: {
    title: 'diBoaS for Business - Enterprise Financial Solutions',
    description: 'Discover how diBoaS empowers businesses with comprehensive financial services and tools.',
    keywords: ['business solutions', 'enterprise finance', 'corporate banking']
  },
  'daily-market': {
    title: 'Daily Market Updates - Adelaide Market Intelligence',
    description: 'Stay informed with daily market updates and financial insights from Adelaide.',
    keywords: ['daily market', 'market updates', 'financial news']
  },
  demo: {
    title: 'Interactive Demo - Experience diBoaS',
    description: 'Try the diBoaS platform with our interactive demo and see your financial potential.',
    keywords: ['demo', 'interactive demo', 'try diBoaS']
  },
  'dream-mode': {
    title: 'Dream Mode - Visualize Your Financial Future',
    description: 'See how your savings can grow with diBoaS Dream Mode calculator.',
    keywords: ['dream mode', 'savings calculator', 'financial goals']
  },
  help: {
    title: 'Help Center - Support & Resources',
    description: 'Find answers and support resources for your diBoaS experience.',
    keywords: ['help', 'support', 'FAQ', 'customer service']
  },
  protocols: {
    title: 'Protocols - DeFi Strategy Details',
    description: 'Learn about the DeFi protocols and strategies powering diBoaS yield products.',
    keywords: ['DeFi protocols', 'yield strategies', 'blockchain']
  },
  security: {
    title: 'Security - How We Protect Your Assets',
    description: 'Learn about the security measures protecting your accounts and assets on diBoaS.',
    keywords: ['security', 'asset protection', 'secure banking']
  },
  strategies: {
    title: 'Investment Strategies - Smart Yield Optimization',
    description: 'Explore diBoaS investment strategies for optimizing your portfolio returns.',
    keywords: ['investment strategies', 'yield optimization', 'portfolio management']
  },
  share: {
    title: 'Share diBoaS - Invite Friends',
    description: 'Share diBoaS with friends and family and earn rewards together.',
    keywords: ['share', 'referral', 'invite friends']
  },
  'legal/terms': {
    title: 'Legal & Compliance - Terms and Conditions',
    description: 'Read our terms of service, privacy policy, and compliance information.',
    keywords: ['legal', 'compliance', 'terms of service', 'privacy policy']
  },
  'legal/privacy': {
    title: 'Privacy Policy - Data Protection and Privacy',
    description: 'Learn how we protect your privacy and handle your personal data.',
    keywords: ['privacy policy', 'data protection', 'privacy rights', 'data security']
  },
  'legal/cookies': {
    title: 'Cookie Policy - Cookie Usage and Preferences',
    description: 'Information about how we use cookies and how to manage your cookie preferences.',
    keywords: ['cookie policy', 'cookies', 'tracking preferences', 'privacy settings']
  }
} as const;

// Structured data templates
export const STRUCTURED_DATA_TEMPLATES = {
  breadcrumbSeparator: ' › ',
  dateFormat: DATE_FORMATS.ISO,
  priceRange: '$$',
  currencyCode: CURRENCY_CONFIG.DEFAULT
} as const;