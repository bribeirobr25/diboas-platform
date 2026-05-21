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
  // 2026-05-13: renamed from 'daily-market' to 'market' (route + key parity).
  // Title is intentionally bare (no `| diBoaS` suffix) — see V4 comment around
  // line 143 below: the `titleTemplate` at line 20 already appends the brand,
  // so including it here would render `... | diBoaS | diBoaS`. Per-locale
  // override happens via the `market.seo.*` translation namespace; this
  // English string is the fallback when generateMetadata cannot resolve the
  // translation (e.g., SSR boundary or missing namespace).
  market: {
    title: 'Adelaide Daily',
    description: 'Calm macro intelligence for Bitcoin. Understand the environment, not the next candle.',
    keywords: ['adelaide daily', 'bitcoin macro', 'macro regime', 'btc environment', 'calm finance']
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
  },
  // V4 (audit/2026-05-08 visual review): titles intentionally omit
  // `| diBoaS` — the `titleTemplate: \`%s | ${BRAND_CONFIG.NAME}\`` at
  // line 20 already appends it. Including it here produced
  // `... | diBoaS | diBoaS` in the rendered <title>. These English
  // strings act as the fallback only — V2 wires per-locale lookups in
  // `lib/learn/lessonMetadata.ts` that take precedence.
  learn: {
    title: 'Learn how money actually works',
    description: "Short, honest lessons on the financial system — written for people the system wasn't built for.",
    keywords: ['compound interest', 'financial literacy', 'how money grows', 'learn investing']
  },
  'learn/compound-interest': {
    title: 'How Money Really Grows — Compound Interest Explained',
    description: "Learn how compound interest works — the math banks and Wall Street have used for decades. Plug in your own numbers and see what 12 years looks like.",
    keywords: ['compound interest calculator', 'how money grows', 'compound interest explained', 'savings vs investing']
  },
  // Phase 6C — Money Tools (Tier 1): purpose-grouped landing + 4 calculators.
  // Per-locale titles/descriptions resolve via each route's `generateMetadata`
  // (tools-shared.json + tools-{slug}.json); these English strings are fallback only.
  tools: {
    title: 'Money Tools — calculators by diBoaS',
    description: 'Free money calculators to plan your retirement, emergency fund, and savings goals. Built by diBoaS.',
    keywords: ['money tools', 'financial calculators', 'savings calculator']
  },
  'tools/compound-interest': {
    title: 'Compound Interest Calculator',
    description: 'Free compound interest calculator. Pick an amount, a cadence, and a timeframe. See bank vs diBoaS side-by-side.',
    keywords: ['compound interest calculator', 'savings calculator', 'investment growth']
  },
  'tools/retirement': {
    title: 'Retirement Calculator',
    description: 'See what your monthly savings could become at 65. Free retirement calculator from diBoaS.',
    keywords: ['retirement calculator', 'retirement savings', 'retirement planning']
  },
  'tools/emergency-fund': {
    title: 'Emergency Fund Calculator',
    description: 'See how fast you can save 6 months of expenses. Free emergency fund calculator from diBoaS.',
    keywords: ['emergency fund calculator', 'savings goal', 'rainy day fund']
  },
  'tools/goal-savings': {
    title: 'Goal-Based Savings Calculator',
    description: 'Plan toward any number. Pick a goal and timeframe; see bank vs diBoaS side-by-side.',
    keywords: ['savings goal calculator', 'goal-based savings', 'savings planner']
  },
  // Phase 6D — Money Tools (Tier 2)
  'tools/inflation-impact': {
    title: 'Inflation Impact Calculator',
    description: 'See what your cash loses to inflation each year — and what it could become if it worked instead. Free calculator from diBoaS.',
    keywords: ['inflation calculator', 'purchasing power calculator', 'inflation impact']
  },
  'tools/time-to-target': {
    title: 'Time-to-Target Calculator',
    description: 'When will you reach your savings goal? See years to target across bank, conservative, historical, and optimistic yields.',
    keywords: ['time to target calculator', 'savings goal calculator', 'when will I reach']
  },
  'tools/currency-depreciation': {
    title: 'Currency Depreciation Calculator',
    description: 'See what your local currency really earns. Compare cash, bank, and digital dollar at historical rate (10%).',
    keywords: ['currency depreciation calculator', 'inflation hedge', 'local currency vs digital dollar']
  },
  // Phase 6E — Money Tools (Tier 3 B2B)
  'tools/card-fees': {
    title: 'Card Fee Savings Calculator',
    description: 'Free B2B card fee savings calculator. See how much your business pays processors per year.',
    keywords: ['card processing fee calculator', 'business card fees', 'merchant fee calculator']
  },
  'tools/idle-cash': {
    title: 'Idle Cash Yield Calculator',
    description: 'Free B2B idle cash yield calculator. Compare what your business cash earns at the bank vs at diBoaS.',
    keywords: ['idle cash calculator', 'business cash yield', 'corporate treasury yield']
  },
  // Phase E (2026-05-16) — Asset history retrospective tool
  'tools/asset-history': {
    title: 'Asset History Calculator',
    description: 'See how Bitcoin, stocks, gold, and bonds actually performed since 2010 or 2016 — lump sum and monthly DCA.',
    keywords: ['asset history calculator', 'BTC vs stocks', 'historical performance calculator', 'retrospective DCA']
  }
} as const;

// Structured data templates
export const STRUCTURED_DATA_TEMPLATES = {
  breadcrumbSeparator: ' › ',
  dateFormat: DATE_FORMATS.ISO,
  priceRange: '$$',
  currencyCode: CURRENCY_CONFIG.DEFAULT
} as const;