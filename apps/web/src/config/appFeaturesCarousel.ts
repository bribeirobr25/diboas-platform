/**
 * App Features Carousel Configuration
 * 
 * Domain-Driven Design: App features carousel domain configuration with variant support
 * Service Agnostic Abstraction: Decoupled carousel content from presentation
 * Configuration Management: Centralized app features content and asset paths
 * No Hardcoded Values: All values configurable through interfaces
 */

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
  autoRotateMs: 4000, // 4 seconds per documentation
  pauseOnHover: true,
  enableTouch: true,
  enableAnalytics: true,
  transitionDuration: 300,
} as const;

// Default app features carousel cards
// Note: Titles, descriptions, CTA text, and chip labels are translation keys that will be resolved at runtime
export const DEFAULT_APP_FEATURES_CARDS: readonly AppFeatureCard[] = [
  {
    id: 'organize-money',
    content: {
      title: 'marketing.appFeatures.organizeMoney.title',
      description: 'marketing.appFeatures.organizeMoney.description',
      ctaText: 'marketing.appFeatures.organizeMoney.ctaText',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank',
      chipLabel: 'marketing.appFeatures.organizeMoney.chipLabel'
    },
    assets: {
      image: '/assets/socials/real/zen-br.avif'
    },
    seo: {
      imageAlt: 'Person in peaceful meditation pose representing organized financial life'
    }
  },
  {
    id: 'instant-payments',
    content: {
      title: 'marketing.appFeatures.instantPayments.title',
      description: 'marketing.appFeatures.instantPayments.description',
      ctaText: 'marketing.appFeatures.instantPayments.ctaText',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank',
      chipLabel: 'marketing.appFeatures.instantPayments.chipLabel'
    },
    assets: {
      image: '/assets/socials/real/chilling.avif'
    },
    seo: {
      imageAlt: 'Person relaxing while using mobile payment features'
    }
  },
  {
    id: 'secure-purchases',
    content: {
      title: 'marketing.appFeatures.securePurchases.title',
      description: 'marketing.appFeatures.securePurchases.description',
      ctaText: 'marketing.appFeatures.securePurchases.ctaText',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank',
      chipLabel: 'marketing.appFeatures.securePurchases.chipLabel'
    },
    assets: {
      image: '/assets/socials/real/walking.avif'
    },
    seo: {
      imageAlt: 'Person confidently making secure purchases with mobile banking'
    }
  },
  {
    id: 'financial-goals',
    content: {
      title: 'marketing.appFeatures.financialGoals.title',
      description: 'marketing.appFeatures.financialGoals.description',
      ctaText: 'marketing.appFeatures.financialGoals.ctaText',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank',
      chipLabel: 'marketing.appFeatures.financialGoals.chipLabel'
    },
    assets: {
      image: '/assets/socials/real/trip.avif'
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
    sectionTitle: 'marketing.appFeatures.sectionTitle',
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