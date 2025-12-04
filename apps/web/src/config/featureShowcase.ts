/**
 * Feature Showcase Configuration
 *
 * Domain-Driven Design: Feature showcase domain configuration with variant support
 * Service Agnostic Abstraction: Decoupled showcase content from presentation
 * Configuration Management: Centralized feature showcase content and asset paths
 * No Hardcoded Values: All values configurable through interfaces
 * DRY Principles: Uses centralized ROUTES configuration for all links
 */

import { ROUTES } from './routes';

export type FeatureShowcaseVariant = 'default' | 'benefits';

export interface FeatureShowcaseContent {
  readonly title: string;
  readonly description: string;
  readonly ctaText: string;
  readonly ctaHref: string;
  readonly ctaTarget?: '_blank' | '_self';
}

export interface FeatureShowcaseAssets {
  readonly primaryImage: string;
}

export interface FeatureShowcaseSEO {
  readonly imageAlt: string;
}

export interface FeatureShowcaseSlide {
  readonly id: string;
  readonly content: FeatureShowcaseContent;
  readonly assets: FeatureShowcaseAssets;
  readonly seo: FeatureShowcaseSEO;
}

export interface FeatureShowcaseSettings {
  readonly showNavigation: boolean;
  readonly showDots: boolean;
  readonly enableAnalytics: boolean;
  readonly transitionDuration: number; // milliseconds
  readonly performance?: {
    readonly preloadSlideCount: number;
    readonly imageLoadingTimeout: number;
    readonly navigationThrottleMs: number;
  };
  readonly images?: {
    readonly dimensions: {
      readonly width: number;
      readonly height: number;
    };
    readonly responsiveSizes: string;
    readonly fallbackEmoji: string;
  };
}

export interface FeatureShowcaseVariantConfig {
  readonly variant: FeatureShowcaseVariant;
  readonly slides: readonly FeatureShowcaseSlide[];
  readonly settings: FeatureShowcaseSettings;
  readonly analytics?: {
    readonly trackingPrefix: string;
    readonly enabled: boolean;
    readonly eventSuffixes?: {
      readonly navigation: string;
      readonly ctaClick: string;
    };
  };
}

// Configuration Management - Default feature showcase settings
export const DEFAULT_FEATURE_SHOWCASE_SETTINGS: FeatureShowcaseSettings = {
  showNavigation: true,
  showDots: false,
  enableAnalytics: true,
  transitionDuration: 250, // Faster transitions for better responsiveness
  performance: {
    preloadSlideCount: 2,
    imageLoadingTimeout: 2000,
    navigationThrottleMs: 150,
  },
  images: {
    dimensions: {
      width: 280,
      height: 360,
    },
    responsiveSizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw',
    fallbackEmoji: '📱',
  },
} as const;

// Default feature showcase slides
// Note: Titles, descriptions, and CTA text are translation keys that will be resolved at runtime
export const DEFAULT_FEATURE_SHOWCASE_SLIDES: readonly FeatureShowcaseSlide[] = [
  {
    id: 'activity-and-rewards',
    content: {
      title: 'marketing.pages.home.featureShowcase.overview.title',
      description: 'marketing.pages.home.featureShowcase.overview.description',
      ctaText: 'common.buttons.getStarted',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    assets: {
      primaryImage: '/assets/socials/drawing/phone-dashboard.avif'
    },
    seo: {
      imageAlt: 'diBoaS mobile app showing dashboard overview interface'
    }
  },
  {
    id: 'activities',
    content: {
      title: 'marketing.pages.home.featureShowcase.activities.title',
      description: 'marketing.pages.home.featureShowcase.activities.description',
      ctaText: 'common.buttons.getStarted',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    assets: {
      primaryImage: '/assets/socials/drawing/phone-transaction-history.avif'
    },
    seo: {
      imageAlt: 'diBoaS mobile app showing financial activities tracking interface'
    }
  },
  {
    id: 'rewards',
    content: {
      title: 'marketing.pages.home.featureShowcase.rewards.title',
      description: 'marketing.pages.home.featureShowcase.rewards.description',
      ctaText: 'common.buttons.getStarted',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    assets: {
      primaryImage: '/assets/socials/drawing/phone-aqua-dashboard.avif'
    },
    seo: {
      imageAlt: 'diBoaS mobile app showing rewards and loyalty program interface'
    }
  }
] as const;

// Predefined feature showcase configurations
export const FEATURE_SHOWCASE_CONFIGS = {
  default: {
    variant: 'default' as const,
    slides: DEFAULT_FEATURE_SHOWCASE_SLIDES,
    settings: DEFAULT_FEATURE_SHOWCASE_SETTINGS,
    analytics: {
      trackingPrefix: 'feature_showcase_default',
      enabled: true,
      eventSuffixes: {
        navigation: '_navigation',
        ctaClick: '_cta_click'
      }
    }
  },
  benefits: {
    variant: 'benefits' as const,
    slides: DEFAULT_FEATURE_SHOWCASE_SLIDES,
    settings: {
      ...DEFAULT_FEATURE_SHOWCASE_SETTINGS,
      showNavigation: true,
      showDots: true,
      transitionDuration: 500,
    },
    analytics: {
      trackingPrefix: 'feature_showcase_benefits',
      enabled: true,
      eventSuffixes: {
        navigation: '_navigation',
        ctaClick: '_cta_click'
      }
    }
  }
} as const;

// Page-specific configurations
export const PAGE_FEATURE_SHOWCASE_CONFIGS = {
  // Homepage - Activities & Rewards
  HOME: FEATURE_SHOWCASE_CONFIGS.default,
  
  // Learn page - Educational content
  LEARN: {
    variant: 'default' as const,
    slides: [
      {
        id: 'learn-courses',
        content: {
          title: 'marketing.pages.home.featureShowcase.learn.title',
          description: 'marketing.pages.home.featureShowcase.learn.description',
          ctaText: 'marketing.pages.home.featureShowcase.learn.ctaText',
          ctaHref: ROUTES.LEARN.OVERVIEW,
          ctaTarget: '_self'
        },
        assets: {
          primaryImage: '/assets/socials/drawing/phone-learn.avif'
        },
        seo: {
          imageAlt: 'diBoaS learning platform showing educational courses interface'
        }
      }
    ],
    settings: {
      showNavigation: false,
      showDots: false,
      enableAnalytics: true,
      transitionDuration: 200,
    },
    analytics: {
      trackingPrefix: 'feature_showcase_learn',
      enabled: true,
      eventSuffixes: {
        navigation: '_navigation',
        ctaClick: '_cta_click'
      }
    }
  } as FeatureShowcaseVariantConfig,
  
  // Business page - B2B features
  BUSINESS: {
    variant: 'default' as const,
    slides: [
      {
        id: 'business-solutions',
        content: {
          title: 'marketing.pages.home.featureShowcase.business.title',
          description: 'marketing.pages.home.featureShowcase.business.description',
          ctaText: 'marketing.pages.home.featureShowcase.business.ctaText',
          ctaHref: ROUTES.BUSINESS.ADVANTAGES,
          ctaTarget: '_self'
        },
        assets: {
          primaryImage: '/assets/socials/drawing/phone-invest-overview.avif'
        },
        seo: {
          imageAlt: 'diBoaS business platform showing enterprise financial tools'
        }
      }
    ],
    settings: {
      showNavigation: false,
      showDots: false,
      enableAnalytics: true,
      transitionDuration: 250,
    },
    analytics: {
      trackingPrefix: 'feature_showcase_business',
      enabled: true,
      eventSuffixes: {
        navigation: '_navigation',
        ctaClick: '_cta_click'
      }
    }
  } as FeatureShowcaseVariantConfig
} as const;

// Legacy compatibility
export const DEFAULT_FEATURE_SHOWCASE_CONFIG = FEATURE_SHOWCASE_CONFIGS.default;
export type FeatureShowcaseConfig = FeatureShowcaseVariantConfig;