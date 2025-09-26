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
  
  // Social Media Assets
  SOCIALS: {
    REAL: `${ASSETS_BASE}/socials/real`
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