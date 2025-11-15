/**
 * App Features Carousel Configuration
 *
 * Domain-Driven Design: App features carousel domain configuration with variant support
 * Service Agnostic Abstraction: Decoupled carousel content from presentation
 * Configuration Management: Centralized app features content and asset paths
 * No Hardcoded Values: All values configurable through interfaces
 * DRY Principles: Uses centralized ROUTES configuration for all links
 */

import { ROUTES } from './routes';
import { getSocialRealAsset } from './assets';

export type AppFeaturesCarouselVariant = 'default';

export interface AppFeatureContent {
  readonly title: string;
  readonly description: string;
  readonly ctaText: string;
  readonly ctaHref: string;
  readonly ctaTarget?: '_blank' | '_self';
  readonly chipLabel?: string;
}

export interface AppFeatureAssets {
  readonly image: string;
}

export interface AppFeatureSEO {
  readonly imageAlt: string;
}

export interface AppFeatureCard {
  readonly id: string;
  readonly content: AppFeatureContent;
  readonly assets: AppFeatureAssets;
  readonly seo: AppFeatureSEO;
}

export interface AppFeaturesCarouselSettings {
  readonly autoRotateMs: number; // 0 = no auto-rotate
  readonly pauseOnHover: boolean;
  readonly enableTouch: boolean;
  readonly enableAnalytics: boolean;
  readonly transitionDuration: number; // milliseconds
}

export interface AppFeaturesCarouselVariantConfig {
  readonly variant: AppFeaturesCarouselVariant;
  readonly sectionTitle: string;
  readonly cards: readonly AppFeatureCard[];
  readonly settings: AppFeaturesCarouselSettings;
  readonly analytics?: {
    readonly trackingPrefix: string;
    readonly enabled: boolean;
  };
}

// Configuration Management - Default app features carousel settings
export const DEFAULT_APP_FEATURES_CAROUSEL_SETTINGS: AppFeaturesCarouselSettings = {
  autoRotateMs: 7000, // 7 seconds per configuration
  pauseOnHover: true,
  enableTouch: true,
  enableAnalytics: true,
  transitionDuration: 300,
} as const;

// Default app features carousel cards
// Note: Titles, descriptions, CTA text, and chip labels are translation keys that will be resolved at runtime
// DRY Principles: All links use centralized ROUTES configuration
// No Hardcoded Values: Uses getSocialRealAsset() helper for type-safe asset paths
export const DEFAULT_APP_FEATURES_CARDS: readonly AppFeatureCard[] = [
  {
    id: 'organize-money',
    content: {
      title: 'marketing.pages.home.appFeatures.organizeMoney.title',
      description: 'marketing.pages.home.appFeatures.organizeMoney.description',
      ctaText: 'marketing.pages.home.appFeatures.organizeMoney.ctaText',
      ctaHref: ROUTES.WHY_DIBOAS,
      ctaTarget: '_self',
      chipLabel: 'marketing.pages.home.appFeatures.organizeMoney.chipLabel'
    },
    assets: {
      image: getSocialRealAsset('LIFE_VISION')
    },
    seo: {
      imageAlt: 'Person in peaceful meditation pose representing organized financial life'
    }
  },
  {
    id: 'instant-payments',
    content: {
      title: 'marketing.pages.home.appFeatures.instantPayments.title',
      description: 'marketing.pages.home.appFeatures.instantPayments.description',
      ctaText: 'marketing.pages.home.appFeatures.instantPayments.ctaText',
      ctaHref: ROUTES.LEARN.OVERVIEW,
      ctaTarget: '_self',
      chipLabel: 'marketing.pages.home.appFeatures.instantPayments.chipLabel'
    },
    assets: {
      image: getSocialRealAsset('LIFE_CHILL_MAN')
    },
    seo: {
      imageAlt: 'Person relaxing while using mobile payment features'
    }
  },
  {
    id: 'secure-purchases',
    content: {
      title: 'marketing.pages.home.appFeatures.securePurchases.title',
      description: 'marketing.pages.home.appFeatures.securePurchases.description',
      ctaText: 'marketing.pages.home.appFeatures.securePurchases.ctaText',
      ctaHref: ROUTES.PERSONAL.INVESTING,
      ctaTarget: '_self',
      chipLabel: 'marketing.pages.home.appFeatures.securePurchases.chipLabel'
    },
    assets: {
      image: getSocialRealAsset('LIFE_WALKING')
    },
    seo: {
      imageAlt: 'Person confidently making secure purchases with mobile banking'
    }
  },
  {
    id: 'financial-goals',
    content: {
      title: 'marketing.pages.home.appFeatures.financialGoals.title',
      description: 'marketing.pages.home.appFeatures.financialGoals.description',
      ctaText: 'marketing.pages.home.appFeatures.financialGoals.ctaText',
      ctaHref: ROUTES.BUSINESS.YIELD_STRATEGIES,
      ctaTarget: '_self',
      chipLabel: 'marketing.pages.home.appFeatures.financialGoals.chipLabel'
    },
    assets: {
      image: getSocialRealAsset('BUSINESS_STRATEGY_WOMAN')
    },
    seo: {
      imageAlt: 'Person planning and achieving travel dreams with financial planning tools'
    }
  }
] as const;

// Predefined app features carousel configurations
// Note: Section title is a translation key that will be resolved at runtime
export const APP_FEATURES_CAROUSEL_CONFIGS = {
  default: {
    variant: 'default' as const,
    sectionTitle: 'marketing.pages.home.appFeatures.sectionTitle',
    cards: DEFAULT_APP_FEATURES_CARDS,
    settings: DEFAULT_APP_FEATURES_CAROUSEL_SETTINGS,
    analytics: {
      trackingPrefix: 'app_features_carousel_default',
      enabled: true
    }
  }
} as const;

// Page-specific configurations
export const PAGE_APP_FEATURES_CONFIGS = {
  // Homepage - Full app features showcase
  HOME: APP_FEATURES_CAROUSEL_CONFIGS.default
} as const;

// Legacy compatibility
export const DEFAULT_APP_FEATURES_CAROUSEL_CONFIG = APP_FEATURES_CAROUSEL_CONFIGS.default;
export type AppFeaturesCarouselConfig = AppFeaturesCarouselVariantConfig;