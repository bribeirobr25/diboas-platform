/**
 * DRY Principle: Centralized content constants
 * 
 * Single source of truth for repeated content strings
 * across the application to ensure consistency
 */

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
    TAGLINE: 'Financial Freedom',
    MISSION: 'Your Gateway to Financial Freedom',
    PLATFORM_NAME: 'diBoaS Platform',
    COMPANY_NAME: 'diBoaS'
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
      USERS_COUNT: '500,000+ users trust us',
      TRANSACTIONS_PROCESSED: '$2B+ processed',
      COUNTRIES_SERVED: 'Available in 50+ countries',
      UPTIME: '99.9% uptime guarantee'
    },
    RATINGS: {
      APP_STORE: '4.8/5 stars on App Store',
      GOOGLE_PLAY: '4.7/5 stars on Google Play',
      TRUSTPILOT: '4.6/5 stars on Trustpilot'
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
    PLATFORM: 'The all-in-one financial platform for banking, investing, and DeFi'
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
    COPYRIGHT: '© 2024 diBoaS. All rights reserved.'
  }
} as const;

// Domain-specific content shortcuts
export const BANKING_CONTENT = COMMON_CONTENT.DESCRIPTIONS.BANKING;
export const INVESTING_CONTENT = COMMON_CONTENT.DESCRIPTIONS.INVESTING;
export const DEFI_CONTENT = COMMON_CONTENT.DESCRIPTIONS.DEFI;

// CTA shortcuts for easy access
export const GET_STARTED = COMMON_CONTENT.CTA_LABELS.GET_STARTED;
export const LEARN_MORE = COMMON_CONTENT.CTA_LABELS.LEARN_MORE;