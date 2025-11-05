/**
 * Static Asset Optimization Configuration
 * 
 * Domain-Driven Design: Asset optimization domain configuration
 * Performance & SEO Optimization: Comprehensive asset optimization
 * Service Agnostic Abstraction: Environment-agnostic asset policies
 * No Hardcoded Values: Configuration-driven asset optimization
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
  
  // Social Media Assets - Real Images (Categorized)
  SOCIALS: {
    REAL: {
      // Account Images
      ACCOUNT_BALANCE: `${ASSETS_BASE}/socials/real/account_balance.avif`,
      ACCOUNT_MAN: `${ASSETS_BASE}/socials/real/account_man.avif`,
      ACCOUNT_WOMAN: `${ASSETS_BASE}/socials/real/account_woman.avif`,

      // Business Images
      BUSINESS_ACCOUNT: `${ASSETS_BASE}/socials/real/business_account.avif`,
      BUSINESS_ACCOUNT_MAN: `${ASSETS_BASE}/socials/real/business_account_man.avif`,
      BUSINESS_ACCOUNT_WOMAN: `${ASSETS_BASE}/socials/real/business_account_woman.avif`,
      BUSINESS_AQUA: `${ASSETS_BASE}/socials/real/business_aqua.avif`,
      BUSINESS_BALANCE: `${ASSETS_BASE}/socials/real/business_balance.avif`,
      BUSINESS_CASHFLOW: `${ASSETS_BASE}/socials/real/business_cashflow.avif`,
      BUSINESS_CASHFLOW_CHARTS: `${ASSETS_BASE}/socials/real/business_cashflow_charts.avif`,
      BUSINESS_CHARTS: `${ASSETS_BASE}/socials/real/business_charts.avif`,
      BUSINESS_CONTRACT: `${ASSETS_BASE}/socials/real/business_contract.avif`,
      BUSINESS_DEAL: `${ASSETS_BASE}/socials/real/business_deal.avif`,
      BUSINESS_INVESTING: `${ASSETS_BASE}/socials/real/business_investing.avif`,
      BUSINESS_OWNER: `${ASSETS_BASE}/socials/real/business_owner.avif`,
      BUSINESS_P2P: `${ASSETS_BASE}/socials/real/business_p2p.avif`,
      BUSINESS_PAYMEN_CLIENT: `${ASSETS_BASE}/socials/real/business_paymen_client.avif`,
      BUSINESS_PAYMENT: `${ASSETS_BASE}/socials/real/business_payment.avif`,
      BUSINESS_PAYMENT_CARD: `${ASSETS_BASE}/socials/real/business_payment_card.avif`,
      BUSINESS_SENDING: `${ASSETS_BASE}/socials/real/business_sending.avif`,
      BUSINESS_STRATEGY: `${ASSETS_BASE}/socials/real/business_strategy.avif`,
      BUSINESS_STRATEGY_WOMAN: `${ASSETS_BASE}/socials/real/business_strategy_woman.avif`,

      // Lifestyle Images
      LIFE_BIKE: `${ASSETS_BASE}/socials/real/life_bike.avif`,
      LIFE_CHILL_MAN: `${ASSETS_BASE}/socials/real/life_chill_man.avif`,
      LIFE_COFEE_HOME: `${ASSETS_BASE}/socials/real/life_cofee_home.avif`,
      LIFE_COLORFUL: `${ASSETS_BASE}/socials/real/life_colorful.avif`,
      LIFE_COUPLE: `${ASSETS_BASE}/socials/real/life_couple.avif`,
      LIFE_FAMILY_BIKE: `${ASSETS_BASE}/socials/real/life_family_bike.avif`,
      LIFE_FAMILY_HOME: `${ASSETS_BASE}/socials/real/life_family_home.avif`,
      LIFE_FAMILY_PICNIC: `${ASSETS_BASE}/socials/real/life_family_picnic.avif`,
      LIFE_FATHER: `${ASSETS_BASE}/socials/real/life_father.avif`,
      LIFE_FRIENDS: `${ASSETS_BASE}/socials/real/life_friends.avif`,
      LIFE_FUN: `${ASSETS_BASE}/socials/real/life_fun.avif`,
      LIFE_GROUP: `${ASSETS_BASE}/socials/real/life_group.avif`,
      LIFE_GROUP_MYSTIC: `${ASSETS_BASE}/socials/real/life_group_mystic.avif`,
      LIFE_GROUP_OFFICE: `${ASSETS_BASE}/socials/real/life_group_office.avif`,
      LIFE_GYM: `${ASSETS_BASE}/socials/real/life_gym.avif`,
      LIFE_HAPPY_JUMPING: `${ASSETS_BASE}/socials/real/life_happy_jumping.avif`,
      LIFE_HIGHFIVE: `${ASSETS_BASE}/socials/real/life_highfive.avif`,
      LIFE_HOME_BACKYARD: `${ASSETS_BASE}/socials/real/life_home_backyard.avif`,
      LIFE_HOME_MAN: `${ASSETS_BASE}/socials/real/life_home_man.avif`,
      LIFE_HOME_MAN_OLDER: `${ASSETS_BASE}/socials/real/life_home_man_older.avif`,
      LIFE_HOTEL_BACKYARD: `${ASSETS_BASE}/socials/real/life_hotel_backyard.avif`,
      LIFE_JOIN: `${ASSETS_BASE}/socials/real/life_join.avif`,
      LIFE_MUSIC: `${ASSETS_BASE}/socials/real/life_music.avif`,
      LIFE_NATURE: `${ASSETS_BASE}/socials/real/life_nature.avif`,
      LIFE_SERIOUS: `${ASSETS_BASE}/socials/real/life_serious.avif`,
      LIFE_SHARING: `${ASSETS_BASE}/socials/real/life_sharing.avif`,
      LIFE_SHOPPING: `${ASSETS_BASE}/socials/real/life_shopping.avif`,
      LIFE_SOLO: `${ASSETS_BASE}/socials/real/life_solo.avif`,
      LIFE_STRONG_WOMAN: `${ASSETS_BASE}/socials/real/life_strong_woman.avif`,
      LIFE_THINK: `${ASSETS_BASE}/socials/real/life_think.avif`,
      LIFE_TRAVEL: `${ASSETS_BASE}/socials/real/life_travel.avif`,
      LIFE_TRAVEL_BEACH: `${ASSETS_BASE}/socials/real/life_travel_beach.avif`,
      LIFE_TRAVEL_BIKE_WOMAN: `${ASSETS_BASE}/socials/real/life_travel_bike_woman.avif`,
      LIFE_TRAVEL_BRAZIL: `${ASSETS_BASE}/socials/real/life_travel_brazil.avif`,
      LIFE_TRAVEL_WOMAN: `${ASSETS_BASE}/socials/real/life_travel_woman.avif`,
      LIFE_TRAVEL_WOMAN_LONDON: `${ASSETS_BASE}/socials/real/life_travel_woman_london.avif`,
      LIFE_TRAVEL_WOMMEN: `${ASSETS_BASE}/socials/real/life_travel_wommen.avif`,
      LIFE_VISION: `${ASSETS_BASE}/socials/real/life_vision.avif`,
      LIFE_WALKING: `${ASSETS_BASE}/socials/real/life_walking.avif`,
      LIFE_WORK_WOMAN: `${ASSETS_BASE}/socials/real/life_work_woman.avif`,
      LIFE_WORKER: `${ASSETS_BASE}/socials/real/life_worker.avif`,

      // Learning Images
      LEARN_GUIDES: `${ASSETS_BASE}/socials/real/learn_guides.avif`,
      LEARN_MAN: `${ASSETS_BASE}/socials/real/learn_man.avif`,
      LEARN_MAN2: `${ASSETS_BASE}/socials/real/learn_man2.avif`,
      LEARN_MAN3: `${ASSETS_BASE}/socials/real/learn_man3.avif`,
      LEARN_MASTERCLASS: `${ASSETS_BASE}/socials/real/learn_masterclass.avif`,
      LEARN_WOMAN: `${ASSETS_BASE}/socials/real/learn_woman.avif`,
      LEARN_WOMAN2: `${ASSETS_BASE}/socials/real/learn_woman2.avif`,
      LEARN_WOMAN3: `${ASSETS_BASE}/socials/real/learn_woman3.avif`,
      STUDY_CORAL2: `${ASSETS_BASE}/socials/real/study_coral2.avif`,
      STUDY_CORAL_WOMAN: `${ASSETS_BASE}/socials/real/study_coral_woman.avif`,

      // Investing Images
      INVESTING_MAN: `${ASSETS_BASE}/socials/real/investing_man.avif`,
      INVESTING_WOMAN: `${ASSETS_BASE}/socials/real/investing_woman.avif`,
      INVESTMENT_MAN_TATTOO: `${ASSETS_BASE}/socials/real/investment_man_tattoo.avif`,
      INVESTOR_MARKET: `${ASSETS_BASE}/socials/real/investor_market.avif`,
      INVESTOR_OPPORTUNITY: `${ASSETS_BASE}/socials/real/investor_opportunity.avif`,
      INVESTOR_WOMAN: `${ASSETS_BASE}/socials/real/investor_woman.avif`,
      INVESTORS_MAN: `${ASSETS_BASE}/socials/real/investors_man.avif`,
      INVESTORS_WOMAN2: `${ASSETS_BASE}/socials/real/investors_woman2.avif`,

      // Rewards Images
      REWARDS_ICON: `${ASSETS_BASE}/socials/real/rewards-icon.avif`,
      REWARDS_GROUP: `${ASSETS_BASE}/socials/real/rewards_group.avif`,
      REWARDS_HAPPY: `${ASSETS_BASE}/socials/real/rewards_happy.avif`,
      REWARDS_MAN: `${ASSETS_BASE}/socials/real/rewards_man.avif`,
      REWARDS_WOMAN: `${ASSETS_BASE}/socials/real/rewards_woman.avif`,

      // Security Images
      SECURITY_MODERN: `${ASSETS_BASE}/socials/real/security_modern.avif`,
      AUDITS: `${ASSETS_BASE}/socials/real/audits.avif`,

      // Cryptocurrency & DeFi
      CRYPTO: `${ASSETS_BASE}/socials/real/crypto.avif`,
      DEFI: `${ASSETS_BASE}/socials/real/defi.avif`,

      // Other Categories
      AI_GUIDES: `${ASSETS_BASE}/socials/real/ai_guides.avif`,
      COFFEE_SHOP: `${ASSETS_BASE}/socials/real/coffee_shop.avif`,
      COOKIES: `${ASSETS_BASE}/socials/real/cookies.avif`,
      LOGIN_WOMAN: `${ASSETS_BASE}/socials/real/login_woman.avif`,
      MAN_AQUA: `${ASSETS_BASE}/socials/real/man-aqua.avif`,
      MAN_MYSTIC: `${ASSETS_BASE}/socials/real/man-mystic.avif`,
      MAN_MYSTIC2: `${ASSETS_BASE}/socials/real/man-mystic2.avif`,
      MARKET_AQUA: `${ASSETS_BASE}/socials/real/market-aqua.avif`,
      OFFICE_GROUP2: `${ASSETS_BASE}/socials/real/office_group2.avif`,
      OFFICE_VIEW: `${ASSETS_BASE}/socials/real/office_view.avif`,
      OLD_MAN: `${ASSETS_BASE}/socials/real/old-man.avif`,
      PAINTING: `${ASSETS_BASE}/socials/real/painting.avif`,
      PARK: `${ASSETS_BASE}/socials/real/park.avif`,
      PORTFOLIO_ICON: `${ASSETS_BASE}/socials/real/portfolio-icon.avif`,
      REFER_FRIEND: `${ASSETS_BASE}/socials/real/refer_friend.avif`,
      REFFERRAL: `${ASSETS_BASE}/socials/real/refferral.avif`,
      SHARE: `${ASSETS_BASE}/socials/real/share.avif`,
      SHARE2: `${ASSETS_BASE}/socials/real/share2.avif`,
      SHARE_MAN_TATTOO: `${ASSETS_BASE}/socials/real/share_man_tattoo.avif`,
      SHARE_OUTSIDE: `${ASSETS_BASE}/socials/real/share_outside.avif`,
      SHARING_AGES: `${ASSETS_BASE}/socials/real/sharing_ages.avif`,
      SHARING_OFFICE_GROUP: `${ASSETS_BASE}/socials/real/sharing_office_group.avif`,
      STRATEGY: `${ASSETS_BASE}/socials/real/strategy.avif`,
      STRATEGY_MAN_OFFICE: `${ASSETS_BASE}/socials/real/strategy_man_office.avif`,
      STREETMARKET_AQUA: `${ASSETS_BASE}/socials/real/streetmarket_aqua.avif`,
      TERMS: `${ASSETS_BASE}/socials/real/terms.avif`,
      TRANSFER: `${ASSETS_BASE}/socials/real/transfer.avif`,
      WOMAN_AQUA: `${ASSETS_BASE}/socials/real/woman_aqua.avif`,
      WOMAN_CORAL: `${ASSETS_BASE}/socials/real/woman_coral.avif`,
      WOMAN_CORAL_SHOPPING: `${ASSETS_BASE}/socials/real/woman_coral_shopping.avif`,
      WOMAN_MYSTIC: `${ASSETS_BASE}/socials/real/woman_mystic.avif`
    },
    DRAWING: {
      PHONE_ACTIVITIES: `${ASSETS_BASE}/socials/drawing/phone-activities.avif`
    }
  },

  // Mascot Assets
  MASCOTS: {
    ACQUA_BASIC: `${ASSETS_BASE}/mascots/acqua-basic.avif`,
    MASCOT_ACQUA_FLYING: `${ASSETS_BASE}/mascots/mascot-acqua-flying.avif`
  }
} as const;

/**
 * Asset Optimization Interfaces
 * Domain-Driven Design: Strong typing for asset optimization
 */
export interface ImageOptimizationConfig {
  readonly formats: readonly string[];
  readonly quality: number;
  readonly sizes: string;
  readonly deviceSizes: readonly number[];
  readonly imageSizes: readonly number[];
  readonly domains: readonly string[];
  readonly dangerouslyAllowSVG: boolean;
  readonly contentSecurityPolicy: string;
}

export interface FontOptimizationConfig {
  readonly preload: readonly string[];
  readonly display: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  readonly subsets: readonly string[];
}

export interface CompressionConfig {
  readonly gzip: boolean;
  readonly brotli: boolean;
  readonly threshold: number; // bytes
  readonly compressionLevel: number;
}

export interface CachingConfig {
  readonly staticAssets: {
    readonly maxAge: number; // seconds
    readonly staleWhileRevalidate: number;
  };
  readonly images: {
    readonly maxAge: number;
    readonly staleWhileRevalidate: number;
  };
  readonly fonts: {
    readonly maxAge: number;
    readonly immutable: boolean;
  };
}

export interface AssetOptimizationConfig {
  readonly images: ImageOptimizationConfig;
  readonly fonts: FontOptimizationConfig;
  readonly compression: CompressionConfig;
  readonly caching: CachingConfig;
  readonly minification: {
    readonly html: boolean;
    readonly css: boolean;
    readonly js: boolean;
    readonly removeComments: boolean;
  };
}

/**
 * Production Image Optimization Configuration
 * Performance & SEO Optimization: Aggressive optimization for static pages
 */
const PRODUCTION_IMAGE_CONFIG: ImageOptimizationConfig = {
  formats: ['image/avif', 'image/webp'],
  quality: 85,
  sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  domains: [
    'diboas.com',
    'cdn.diboas.com',
    'assets.diboas.com'
  ],
  dangerouslyAllowSVG: false,
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
} as const;

/**
 * Development Image Configuration
 * More lenient for development speed
 */
const DEVELOPMENT_IMAGE_CONFIG: ImageOptimizationConfig = {
  ...PRODUCTION_IMAGE_CONFIG,
  quality: 75, // Lower quality for faster builds
  formats: ['image/webp'], // Fewer formats for speed
  dangerouslyAllowSVG: true // Allow SVG in dev
} as const;

/**
 * Font Optimization Configuration
 * Performance & SEO Optimization: Optimal font loading
 */
const FONT_OPTIMIZATION_CONFIG: FontOptimizationConfig = {
  preload: [
    '/fonts/inter-var.woff2',
    '/fonts/inter-latin.woff2'
  ],
  display: 'swap',
  subsets: ['latin', 'latin-ext']
} as const;

/**
 * Compression Configuration
 * Performance & SEO Optimization: Maximum compression for static assets
 */
const COMPRESSION_CONFIG: CompressionConfig = {
  gzip: true,
  brotli: true,
  threshold: 1024, // Compress files larger than 1KB
  compressionLevel: 9 // Maximum compression
} as const;

/**
 * Caching Configuration for Static Assets
 * Performance & SEO Optimization: Long-term caching strategies
 */
const CACHING_CONFIG: CachingConfig = {
  staticAssets: {
    maxAge: 31536000, // 1 year
    staleWhileRevalidate: 86400 // 24 hours
  },
  images: {
    maxAge: 31536000, // 1 year
    staleWhileRevalidate: 86400 // 24 hours
  },
  fonts: {
    maxAge: 31536000, // 1 year
    immutable: true
  }
} as const;

/**
 * Environment-specific Asset Configurations
 * Service Agnostic Abstraction: Environment-aware optimization
 */
export const ASSET_OPTIMIZATION_CONFIGS = {
  development: {
    images: DEVELOPMENT_IMAGE_CONFIG,
    fonts: FONT_OPTIMIZATION_CONFIG,
    compression: {
      ...COMPRESSION_CONFIG,
      compressionLevel: 6, // Faster compression in dev
      threshold: 10240 // Only compress larger files in dev
    },
    caching: {
      staticAssets: {
        maxAge: 0, // No caching in dev
        staleWhileRevalidate: 0
      },
      images: {
        maxAge: 3600, // 1 hour caching for images in dev
        staleWhileRevalidate: 60
      },
      fonts: {
        maxAge: 3600,
        immutable: false
      }
    },
    minification: {
      html: false,
      css: false,
      js: false,
      removeComments: false
    }
  },
  production: {
    images: PRODUCTION_IMAGE_CONFIG,
    fonts: FONT_OPTIMIZATION_CONFIG,
    compression: COMPRESSION_CONFIG,
    caching: CACHING_CONFIG,
    minification: {
      html: true,
      css: true,
      js: true,
      removeComments: true
    }
  }
} as const satisfies Record<string, AssetOptimizationConfig>;

export type AssetEnvironment = keyof typeof ASSET_OPTIMIZATION_CONFIGS;

/**
 * Generate Asset Headers for Next.js
 * Code Reusability: Reusable header generation
 */
export function generateAssetHeaders(config: AssetOptimizationConfig) {
  return [
    // Static assets (JS, CSS, etc.)
    {
      source: '/_next/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: `public, max-age=${config.caching.staticAssets.maxAge}, stale-while-revalidate=${config.caching.staticAssets.staleWhileRevalidate}, immutable`
        }
      ]
    },
    // Images
    {
      source: '/assets/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: `public, max-age=${config.caching.images.maxAge}, stale-while-revalidate=${config.caching.images.staleWhileRevalidate}`
        }
      ]
    },
    // Fonts
    {
      source: '/fonts/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: `public, max-age=${config.caching.fonts.maxAge}${config.caching.fonts.immutable ? ', immutable' : ''}`
        }
      ]
    }
  ];
}

/**
 * Get Asset Optimization Configuration
 * No Hardcoded Values: Environment-based configuration
 */
export function getAssetOptimizationConfig(): AssetOptimizationConfig {
  const environment = (process.env.NODE_ENV === 'production' ? 'production' : 'development') as AssetEnvironment;
  return ASSET_OPTIMIZATION_CONFIGS[environment];
}

/**
 * Asset Helper Functions
 * DRY Principles: Reusable type-safe asset accessors
 * No Hardcoded Values: Single source of truth for all asset paths
 * Service Agnostic Abstraction: Environment-agnostic asset access
 */

// Type-safe keys for asset categories
export type SocialRealAssetKey = keyof typeof ASSET_PATHS.SOCIALS.REAL;
export type NavigationAssetKey = keyof typeof ASSET_PATHS.NAVIGATION;
export type LogoAssetKey = keyof typeof ASSET_PATHS.LOGOS;
export type MascotAssetKey = keyof typeof ASSET_PATHS.MASCOTS;

/**
 * Get Social Real Asset Path
 * Type-safe helper to access socials/real images
 * @param key - The asset key from ASSET_PATHS.SOCIALS.REAL
 * @returns The full asset path
 */
export function getSocialRealAsset(key: SocialRealAssetKey): string {
  return ASSET_PATHS.SOCIALS.REAL[key];
}

/**
 * Get Navigation Banner Asset Path
 * Type-safe helper to access navigation banners
 * @param key - The asset key from ASSET_PATHS.NAVIGATION
 * @returns The full asset path
 */
export function getNavigationAsset(key: NavigationAssetKey): string {
  return ASSET_PATHS.NAVIGATION[key];
}

/**
 * Get Logo Asset Path
 * Type-safe helper to access logo assets
 * @param key - The asset key from ASSET_PATHS.LOGOS
 * @returns The full asset path
 */
export function getLogoAsset(key: LogoAssetKey): string {
  return ASSET_PATHS.LOGOS[key];
}

/**
 * Get Mascot Asset Path
 * Type-safe helper to access mascot assets
 * @param key - The asset key from ASSET_PATHS.MASCOTS
 * @returns The full asset path
 */
export function getMascotAsset(key: MascotAssetKey): string {
  return ASSET_PATHS.MASCOTS[key];
}

/**
 * Get Phone Drawing Asset Path
 * Helper to access phone activity drawings
 * @returns The phone activities drawing path
 */
export function getPhoneActivitiesAsset(): string {
  return ASSET_PATHS.SOCIALS.DRAWING.PHONE_ACTIVITIES;
}