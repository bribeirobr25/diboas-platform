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
  siteUrl: process.env.NEXT_PUBLIC_BASE_URL || `https://www.${process.env.NEXT_PUBLIC_SITE_DOMAIN || 'diboas.com'}`,
  defaultImage: ASSET_PATHS.SEO.DEFAULT_OG,
  twitterHandle: BRAND_CONFIG.TWITTER_HANDLE,

  // Default metadata
  defaultTitle: `${BRAND_CONFIG.NAME} - ${BRAND_CONFIG.TAGLINE}`,
  titleTemplate: `%s | ${BRAND_CONFIG.NAME}`,
  defaultDescription: `Open access and fair opportunities for everyone. Goal-driven wealth building starting at $5. Your money, your wallet, your control.`,
  defaultKeywords: [
    'goal-driven investing',
    'wealth building',
    'digital dollar savings',
    'free money transfers',
    'non-custodial wallet',
    'financial platform',
    'earn more than bank',
    'side-pocket savings',
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
      ...(BRAND_CONFIG.SUPPORT_PHONE ? { telephone: BRAND_CONFIG.SUPPORT_PHONE } : {}),
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
    description: 'See what $1,000 becomes in a year when you have access to fair opportunities. Start from $5.',
    keywords: ['goal-driven investing', 'wealth building', 'earn interest on savings']
  },
  about: {
    title: 'About diBoaS - Our Mission and Vision',
    description: 'Built because one grandmother deserved better. Now everyone does. Free transfers, real growth, starting at $5.',
    keywords: ['about diBoaS', 'financial inclusion', 'fair access wealth building']
  },
  business: {
    title: 'diBoaS for Business - Enterprise Financial Solutions',
    description: 'Stop losing 2-3% on every card payment. Put idle cash to work. Free payments, instant transfers.',
    keywords: ['business treasury', 'reduce card fees', 'idle cash yield']
  },
  'daily-market': {
    title: 'Daily Market Updates - Adelaide Market Intelligence',
    description: 'Stay informed with daily market updates and financial insights from Adelaide.',
    keywords: ['daily market', 'market updates', 'financial insights']
  },
  demo: {
    title: 'Interactive Demo - Experience diBoaS',
    description: 'Try the diBoaS platform with our interactive demo and see your financial potential.',
    keywords: ['demo', 'interactive demo', 'try diBoaS']
  },
  'dream-mode': {
    title: 'Dream Mode - Visualize Your Financial Future',
    description: 'See how your savings can grow with diBoaS Dream Mode calculator.',
    keywords: ['savings calculator', 'financial goals', 'goal planning']
  },
  help: {
    title: 'Help Center - Support & Resources',
    description: 'Everything you need to know about diBoaS — how it works, fees, safety, and getting started. Clear answers, no jargon.',
    keywords: ['help', 'support', 'FAQ', 'getting started']
  },
  protocols: {
    title: 'Protocols - Strategy Details',
    description: 'See exactly where your money works. Full transparency about every system we use and why we trust them.',
    keywords: ['protocol transparency', 'where money works', 'audited financial systems']
  },
  security: {
    title: 'Security - How We Protect Your Assets',
    description: 'Your money stays in your wallet, not ours. Non-custodial architecture, advanced key security, and 24/7 monitoring.',
    keywords: ['non-custodial security', 'your keys your money', 'wallet protection']
  },
  strategies: {
    title: 'Investment Strategies - Smart Yield Optimization',
    description: 'Different goals. Different risk levels. Find the approach that matches where you are and where you want to be.',
    keywords: ['goal-based investing', 'savings strategies', 'emergency fund plan']
  },
  share: {
    title: 'Share diBoaS - Invite Friends',
    description: 'Share diBoaS with friends and family and earn rewards together.',
    keywords: ['share', 'referral', 'invite friends']
  },
  'legal/terms': {
    title: 'Legal & Compliance - Terms and Conditions',
    description: 'Read our terms of service, privacy policy, and compliance information.',
    keywords: ['terms of use', 'user agreement', 'legal terms']
  },
  'legal/privacy': {
    title: 'Privacy Policy - Data Protection and Privacy',
    description: 'Learn how we protect your privacy and handle your personal data.',
    keywords: ['privacy policy', 'data protection', 'privacy rights']
  },
  'legal/cookies': {
    title: 'Cookie Policy - Cookie Usage and Preferences',
    description: 'Information about how we use cookies and how to manage your cookie preferences.',
    keywords: ['cookie policy', 'cookies', 'tracking preferences']
  }
} as const;

// Structured data templates
export const STRUCTURED_DATA_TEMPLATES = {
  breadcrumbSeparator: ' › ',
  dateFormat: DATE_FORMATS.ISO,
  priceRange: '$$',
  currencyCode: CURRENCY_CONFIG.DEFAULT
} as const;