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
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.NEXT_PUBLIC_SITE_DOMAIN || 'diboas.com'}`,
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

// Page-specific SEO configurations
export const PAGE_SEO_CONFIG = {
  home: {
    title: 'Financial Freedom Made Simple',
    description: 'Complete financial ecosystem with banking, investing, and DeFi in one secure platform.',
    keywords: ['digital banking', 'crypto platform', 'DeFi services']
  },
  // Main Pages
  benefits: {
    title: 'Benefits - Why Choose diBoaS',
    description: 'Discover the advantages of managing your finances with diBoaS. Zero fees, instant transfers, and AI-powered insights.',
    keywords: ['banking benefits', 'financial advantages', 'zero fees']
  },
  account: {
    title: 'diBoaS Account - Your Financial Hub',
    description: 'Open your diBoaS account and access banking, investing, and DeFi services in one platform.',
    keywords: ['digital account', 'financial account', 'online banking account']
  },
  'banking-services': {
    title: 'Banking Services - Modern Banking Solutions',
    description: 'Experience next-generation banking with zero fees, instant transfers, and smart budgeting tools.',
    keywords: ['digital banking', 'online banking', 'smart banking']
  },
  investing: {
    title: 'Investment Platform - Smart Crypto Investing',
    description: 'Access cryptocurrencies and traditional assets with AI-powered portfolio management.',
    keywords: ['crypto investing', 'investment platform', 'portfolio management']
  },
  cryptocurrency: {
    title: 'Cryptocurrency Trading - Secure Crypto Platform',
    description: 'Trade cryptocurrencies with advanced security, low fees, and institutional-grade infrastructure.',
    keywords: ['cryptocurrency', 'crypto trading', 'bitcoin', 'ethereum']
  },
  'defi-strategies': {
    title: 'DeFi Strategies - Decentralized Finance',
    description: 'Earn yields and access DeFi protocols with enterprise-grade security and expert strategies.',
    keywords: ['DeFi', 'yield farming', 'decentralized finance', 'liquidity mining']
  },
  credit: {
    title: 'Credit Solutions - Smart Lending Platform',
    description: 'Access credit and lending solutions with competitive rates and flexible terms.',
    keywords: ['credit', 'lending', 'loans', 'financing']
  },
  // Learn Center
  'learn/benefits': {
    title: 'Learn Center - Financial Education Hub',
    description: 'Comprehensive financial education resources to master banking, investing, and DeFi.',
    keywords: ['financial education', 'learn finance', 'money management']
  },
  'learn/financial-basics': {
    title: 'Financial Basics - Foundation Course',
    description: 'Master the fundamentals of personal finance, budgeting, and money management.',
    keywords: ['financial basics', 'personal finance', 'budgeting', 'money management']
  },
  'learn/money-management': {
    title: 'Money Management - Advanced Strategies',
    description: 'Learn advanced money management techniques and build lasting wealth.',
    keywords: ['money management', 'wealth building', 'financial planning']
  },
  'learn/investment-guide': {
    title: 'Investment Guide - Smart Investing',
    description: 'Complete guide to investing in traditional and digital assets with proven strategies.',
    keywords: ['investment guide', 'investing basics', 'portfolio management']
  },
  'learn/cryptocurrency-guide': {
    title: 'Crypto A-Z - Complete Cryptocurrency Guide',
    description: 'Everything you need to know about cryptocurrency, blockchain, and digital assets.',
    keywords: ['cryptocurrency guide', 'blockchain education', 'crypto basics']
  },
  'learn/defi-explained': {
    title: 'DeFi Explained - Decentralized Finance Guide',
    description: 'Understanding DeFi protocols, yield farming, and decentralized finance opportunities.',
    keywords: ['DeFi guide', 'decentralized finance', 'yield farming', 'liquidity pools']
  },
  'learn/special-content': {
    title: 'Special Content - Expert Insights',
    description: 'Exclusive financial content, market analysis, and expert insights for advanced users.',
    keywords: ['financial insights', 'market analysis', 'expert content']
  },
  // Business Pages
  'business/benefits': {
    title: 'Business Benefits - Enterprise Financial Solutions',
    description: 'Discover how diBoaS empowers businesses with comprehensive financial services and tools.',
    keywords: ['business banking', 'enterprise finance', 'business solutions']
  },
  'business/account': {
    title: 'Business Account - Corporate Banking',
    description: 'Open a business account with advanced features for modern enterprises and startups.',
    keywords: ['business account', 'corporate banking', 'business banking']
  },
  'business/banking': {
    title: 'Business Banking - Enterprise Financial Services',
    description: 'Full-service business banking with multi-currency support and global reach.',
    keywords: ['business banking', 'corporate finance', 'enterprise banking']
  },
  'business/payments': {
    title: 'Business Payments - Global Payment Solutions',
    description: 'Streamline business payments with fast, secure, and cost-effective solutions.',
    keywords: ['business payments', 'corporate payments', 'payment processing']
  },
  'business/treasury': {
    title: 'Treasury Management - Corporate Treasury',
    description: 'Advanced treasury management tools for cash flow optimization and risk management.',
    keywords: ['treasury management', 'cash management', 'corporate treasury']
  },
  'business/yield-strategies': {
    title: 'Cash Flow Yield - Business Investment Strategies',
    description: 'Maximize business cash flow with institutional-grade yield strategies and investments.',
    keywords: ['cash flow yield', 'business investments', 'corporate yield']
  },
  'business/credit-solutions': {
    title: 'P2P Credit - Business Lending Solutions',
    description: 'Access peer-to-peer credit and alternative financing for business growth.',
    keywords: ['business credit', 'P2P lending', 'business financing']
  },
  // Rewards Pages
  'rewards/benefits': {
    title: 'diBoaS Rewards - Loyalty Program Benefits',
    description: 'Earn rewards for every transaction and unlock exclusive benefits with diBoaS Rewards.',
    keywords: ['rewards program', 'loyalty benefits', 'cashback rewards']
  },
  'rewards/ai-guides': {
    title: 'AI Mascot Guides - Personalized Financial Assistant',
    description: 'Meet your AI financial assistant that provides personalized guidance and insights.',
    keywords: ['AI financial assistant', 'AI guides', 'financial AI']
  },
  'rewards/referral-program': {
    title: 'Referral Program - Earn by Sharing',
    description: 'Refer friends and earn rewards when they join the diBoaS financial ecosystem.',
    keywords: ['referral program', 'earn rewards', 'invite friends']
  },
  'rewards/points-system': {
    title: 'Points System - Earn and Redeem Points',
    description: 'Earn points for every action and redeem them for exclusive rewards and benefits.',
    keywords: ['points system', 'loyalty points', 'rewards points']
  },
  'rewards/badges-leaderboard': {
    title: 'Badges & Leaderboard - Community Recognition',
    description: 'Earn badges for achievements and compete on leaderboards with the diBoaS community.',
    keywords: ['badges', 'leaderboard', 'community rewards']
  },
  'rewards/campaigns': {
    title: 'Campaigns - Special Reward Events',
    description: 'Participate in special campaigns and limited-time events for bonus rewards.',
    keywords: ['reward campaigns', 'special events', 'bonus rewards']
  },
  'rewards/token-airdrop': {
    title: 'Token & Airdrop - Crypto Rewards',
    description: 'Participate in token airdrops and earn cryptocurrency rewards for platform usage.',
    keywords: ['token airdrop', 'crypto rewards', 'cryptocurrency earnings']
  },
  // Security Pages
  'security/benefits': {
    title: 'diBoaS Protection - Security Benefits',
    description: 'Learn about our comprehensive security measures and protection benefits.',
    keywords: ['financial security', 'protection benefits', 'secure banking']
  },
  'security/audit-reports': {
    title: 'Audit & Reports - Security Transparency',
    description: 'Access our security audit reports and transparency documentation.',
    keywords: ['security audit', 'audit reports', 'security transparency']
  },
  'security/safety-guide': {
    title: 'Stay Safe - Security Best Practices',
    description: 'Essential security tips and best practices to protect your financial accounts.',
    keywords: ['security guide', 'safety tips', 'financial security']
  },
  // Help & Company Pages
  'help/faq': {
    title: 'FAQ - Frequently Asked Questions',
    description: 'Find answers to common questions about diBoaS services and features.',
    keywords: ['FAQ', 'help', 'support', 'questions']
  },
  about: {
    title: 'About diBoaS - Our Mission and Vision',
    description: 'Learn about diBoaS mission to democratize financial services and empower global communities.',
    keywords: ['about diBoaS', 'company mission', 'financial innovation']
  },
  careers: {
    title: 'Careers - Join Our Team',
    description: 'Join the diBoaS team and help build the future of financial services.',
    keywords: ['careers', 'jobs', 'join team', 'fintech careers']
  },
  docs: {
    title: 'Documentation - Developer Resources',
    description: 'Comprehensive API documentation and developer resources for building with diBoaS.',
    keywords: ['documentation', 'API docs', 'developer resources']
  },
  investors: {
    title: 'Investors - Investment Opportunities',
    description: 'Learn about investment opportunities and our vision for the future of finance.',
    keywords: ['investors', 'investment opportunities', 'fintech investment']
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