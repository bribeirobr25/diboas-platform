/**
 * Asset Configuration
 * Configuration Management: Centralized asset paths
 * CDN Support: Environment-based asset URLs
 */

const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_URL || '';
const ASSETS_BASE = CDN_BASE_URL || '/assets';

export const ASSET_PATHS = {
  // Navigation Banners
  NAVIGATION: {
    DIBOAS_BANNER: `${ASSETS_BASE}/navigation/diboas-banner.avif`,
    LEARN_BANNER: `${ASSETS_BASE}/navigation/learn-banner.avif`,
    BUSINESS_BANNER: `${ASSETS_BASE}/navigation/business-banner.avif`,
    REWARDS_BANNER: `${ASSETS_BASE}/navigation/rewards-banner.avif`,
    SECURITY_BANNER: `${ASSETS_BASE}/navigation/security-banner.avif`,
    ABOUT_BANNER: `${ASSETS_BASE}/navigation/about-banner.avif`
  },
  
  // Logo Assets
  LOGOS: {
    ICON: `${ASSETS_BASE}/logos/logo-icon.avif`,
    FULL: `${ASSETS_BASE}/logos/logo-full.avif`,
    ICON_DARK: `${ASSETS_BASE}/logos/logo-icon-dark.avif`,
    FULL_DARK: `${ASSETS_BASE}/logos/logo-full-dark.avif`,
    WORDMARK: `${ASSETS_BASE}/logos/logo-wordmark.avif`
  },
  
  // SEO Assets
  SEO: {
    DEFAULT_OG: `${ASSETS_BASE}/seo/og-default.png`,
    FAVICON: `${ASSETS_BASE}/favicon.ico`,
    APPLE_TOUCH_ICON: `${ASSETS_BASE}/apple-touch-icon.png`
  },
  
  // Social Media Assets
  SOCIALS: {
    REAL: `${ASSETS_BASE}/socials/real`
  }
} as const;