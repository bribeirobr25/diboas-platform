/**
 * Brand Configuration
 * Configuration Management: Centralized brand constants
 * Environment Agnostic: Works across all environments
 */

export const BRAND_CONFIG = {
  // Core Brand Identity
  NAME: process.env.NEXT_PUBLIC_BRAND_NAME || 'diBoaS',
  FULL_NAME: process.env.NEXT_PUBLIC_BRAND_FULL_NAME || 'diBoaS Platform',
  TAGLINE: process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'Financial Freedom Made Simple',

  // Company Information
  LEGAL_NAME: process.env.NEXT_PUBLIC_COMPANY_LEGAL_NAME || 'diBoaS',
  COMPANY_NAME: process.env.NEXT_PUBLIC_COMPANY_NAME || 'diBoaS Financial Technologies',
  FOUNDING_DATE: process.env.NEXT_PUBLIC_FOUNDING_DATE || '2025',

  // Contact Information
  SUPPORT_PHONE: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+1-800-DIBOAS',
  SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@diboas.com',

  // Social Media
  TWITTER_HANDLE: process.env.NEXT_PUBLIC_TWITTER_HANDLE || '@diboasfi',
  TWITTER_URL: process.env.NEXT_PUBLIC_TWITTER_URL || 'https://twitter.com/diboasfi',
  LINKEDIN_URL: process.env.NEXT_PUBLIC_LINKEDIN_URL || 'https://linkedin.com/company/diboasfi',
  YOUTUBE_URL: process.env.NEXT_PUBLIC_YOUTUBE_URL || 'https://youtube.com/@diboasfi/featured',
  GITHUB_URL: process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/diboasfi',

  // Address Information
  ADDRESS: {
    STREET: process.env.NEXT_PUBLIC_COMPANY_STREET || 'Alexander Platz',
    CITY: process.env.NEXT_PUBLIC_COMPANY_CITY || 'Berlin',
    STATE: process.env.NEXT_PUBLIC_COMPANY_STATE || 'BE',
    ZIP: process.env.NEXT_PUBLIC_COMPANY_ZIP || '10243',
    COUNTRY: process.env.NEXT_PUBLIC_COMPANY_COUNTRY || 'DE'
  }
} as const;