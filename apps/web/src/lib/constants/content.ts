/**
 * DRY Principle: Centralized content constants
 * Configuration Management: Dynamic content with fallback to configurable business metrics
 * 
 * Single source of truth for repeated content strings
 * across the application to ensure consistency
 */

import { PLATFORM_STATS, getMetricValue } from '@/config/business-metrics';
import { PLATFORM_RATINGS } from '@/config/ratings';
import { BRAND_CONFIG } from '@/config/brand';

export const COMMON_CONTENT = {
  // Call-to-Action Labels
  CTA_LABELS: {
    GET_STARTED: 'Get Started',
    LEARN_MORE: 'Learn More',
    SIGN_UP: 'Sign Up',
    LOGIN: 'Login',
    BUSINESS_LOGIN: 'Business Login',
    TRY_FREE: 'Try Free',
    CONTACT_US: 'Contact Us',
    VIEW_DEMO: 'View Demo'
  },

  // Brand Content
  BRAND: {
    TAGLINE: BRAND_CONFIG.TAGLINE,
    MISSION: 'Your Gateway to Financial Freedom',
    PLATFORM_NAME: BRAND_CONFIG.FULL_NAME,
    COMPANY_NAME: BRAND_CONFIG.NAME
  },

  // Trust Indicators
  TRUST_INDICATORS: {
    SECURITY_FEATURES: [
      'Bank-level Security',
      'End-to-end Encryption',
      '2FA Authentication',
      'SOC 2 Compliant',
      'FDIC Insured',
      'SSL Encrypted'
    ],
    USER_STATS: {
      USERS_COUNT: `${getMetricValue(PLATFORM_STATS.users)} users trust us`,
      TRANSACTIONS_PROCESSED: `${getMetricValue(PLATFORM_STATS.volumeProcessed)} processed`,
      COUNTRIES_SERVED: `Available in ${getMetricValue(PLATFORM_STATS.countriesServed)} countries`,
      UPTIME: `${getMetricValue(PLATFORM_STATS.uptimeGuarantee)} uptime guarantee`
    },
    RATINGS: {
      APP_STORE: PLATFORM_RATINGS.APP_STORE.displayText,
      GOOGLE_PLAY: PLATFORM_RATINGS.GOOGLE_PLAY.displayText,
      TRUSTPILOT: PLATFORM_RATINGS.TRUSTPILOT.displayText
    }
  },

  // Feature Lists
  FEATURES: {
    BANKING: [
      'Instant Transfers',
      'Mobile Check Deposit',
      'Bill Pay',
      'Savings Goals',
      'Budget Tracking',
      'Expense Categories'
    ],
    INVESTING: [
      'Stock Trading',
      'ETF Portfolios',
      'Fractional Shares',
      'Auto-Investing',
      'Research Tools',
      'Tax-Loss Harvesting'
    ],
    DEFI: [
      'Yield Farming',
      'Liquidity Mining',
      'DEX Trading',
      'Staking Rewards',
      'Cross-chain Swaps',
      'Portfolio Analytics'
    ]
  },

  // Common Descriptions
  DESCRIPTIONS: {
    BANKING: 'Traditional banking made simple with modern technology and security',
    INVESTING: 'Smart investing tools for building long-term wealth',
    DEFI: 'Access decentralized finance opportunities with institutional-grade security',
    PLATFORM: `The all-in-one financial platform for banking, investing, and DeFi - ${BRAND_CONFIG.NAME}`
  },

  // Error Messages
  ERRORS: {
    GENERIC: 'Something went wrong. Please try again.',
    NETWORK: 'Network error. Check your connection.',
    VALIDATION: 'Please check your input and try again.',
    UNAUTHORIZED: 'Please log in to continue.',
    FORBIDDEN: 'You don\'t have permission to access this resource.'
  },

  // Success Messages
  SUCCESS: {
    FORM_SUBMITTED: 'Form submitted successfully!',
    ACCOUNT_CREATED: 'Account created successfully!',
    EMAIL_SENT: 'Email sent successfully!',
    SETTINGS_UPDATED: 'Settings updated successfully!'
  },

  // Navigation Labels
  NAVIGATION: {
    HOME: 'Home',
    BANKING: 'Banking',
    INVESTING: 'Investing',
    DEFI: 'DeFi',
    ABOUT: 'About',
    CONTACT: 'Contact',
    SUPPORT: 'Support',
    BLOG: 'Blog',
    RESOURCES: 'Resources'
  },

  // Footer Content
  FOOTER: {
    TAGLINE: 'Building the future of finance',
    NEWSLETTER_CTA: 'Stay updated with our latest news and features',
    COPYRIGHT: `© 2024 ${BRAND_CONFIG.NAME}. All rights reserved.`
  }
} as const;

// Domain-specific content shortcuts
export const BANKING_CONTENT = COMMON_CONTENT.DESCRIPTIONS.BANKING;
export const INVESTING_CONTENT = COMMON_CONTENT.DESCRIPTIONS.INVESTING;
export const DEFI_CONTENT = COMMON_CONTENT.DESCRIPTIONS.DEFI;

// CTA shortcuts for easy access
export const GET_STARTED = COMMON_CONTENT.CTA_LABELS.GET_STARTED;
export const LEARN_MORE = COMMON_CONTENT.CTA_LABELS.LEARN_MORE;