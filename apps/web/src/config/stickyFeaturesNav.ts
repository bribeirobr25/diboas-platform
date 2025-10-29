/**
 * Sticky Features Nav Configuration
 *
 * Domain-Driven Design: Sticky features navigation domain configuration with variant support
 * Service Agnostic Abstraction: Decoupled navigation content from presentation
 * Configuration Management: Centralized sticky features content and asset paths
 * No Hardcoded Values: All values configurable through interfaces
 * DRY Principles: Uses centralized ROUTES configuration for all links
 */

import { ROUTES } from './routes';

export type StickyFeaturesNavVariant = 'default';

export interface FeatureItem {
  readonly id: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly heading: string;
  readonly description: string;
  readonly ctaText: string;
  readonly ctaLink: string;
  readonly ctaTarget?: '_blank' | '_self';
}

export interface FeatureCategory {
  readonly id: string;
  readonly name: string;
  readonly items: readonly FeatureItem[];
}

export interface StickyFeaturesNavSettings {
  readonly stickyOffset: number; // Offset for fixed headers
  readonly condenseScrollThreshold: number; // Pixels to scroll before condensing
  readonly intersectionThreshold: number; // Threshold for active category detection (0-1)
  readonly enableSmoothScroll: boolean;
  readonly scrollBehavior: 'smooth' | 'auto';
  readonly scrollDuration: number; // milliseconds
  readonly enableAnalytics: boolean;
}

export interface StickyFeaturesNavVariantConfig {
  readonly variant: StickyFeaturesNavVariant;
  readonly mainTitle: string;
  readonly categories: readonly FeatureCategory[];
  readonly settings: StickyFeaturesNavSettings;
  readonly analytics?: {
    readonly trackingPrefix: string;
    readonly enabled: boolean;
  };
}

// Configuration Management - Default sticky features nav settings
export const DEFAULT_STICKY_FEATURES_NAV_SETTINGS: StickyFeaturesNavSettings = {
  stickyOffset: 0,
  condenseScrollThreshold: 200,
  intersectionThreshold: 0.5,
  enableSmoothScroll: true,
  scrollBehavior: 'smooth',
  scrollDuration: 800,
  enableAnalytics: true,
} as const;

// Default feature categories - Note: All text content uses translation keys
// DRY Principles: All links use centralized ROUTES configuration
export const DEFAULT_FEATURE_CATEGORIES: readonly FeatureCategory[] = [
  {
    id: 'banking',
    name: 'marketing.stickyFeaturesNav.categories.banking.name',
    items: [
      {
        id: 'banking-realtime-borderless',
        image: '/assets/socials/real/family-trip.avif',
        imageAlt: 'Family enjoying a trip together representing real-time borderless banking',
        heading: 'marketing.stickyFeaturesNav.banking.heading',
        description: 'marketing.stickyFeaturesNav.banking.description',
        ctaText: 'marketing.stickyFeaturesNav.ctaText',
        ctaLink: ROUTES.BENEFITS,
        ctaTarget: '_self',
      },
    ],
  },
  {
    id: 'investing',
    name: 'marketing.stickyFeaturesNav.categories.investing.name',
    items: [
      {
        id: 'investing-prepare-future',
        image: '/assets/socials/real/music.avif',
        imageAlt: 'Person enjoying music while planning their financial future',
        heading: 'marketing.stickyFeaturesNav.investing.heading',
        description: 'marketing.stickyFeaturesNav.investing.description',
        ctaText: 'marketing.stickyFeaturesNav.ctaText',
        ctaLink: ROUTES.INVESTING,
        ctaTarget: '_self',
      },
    ],
  },
  {
    id: 'strategies',
    name: 'marketing.stickyFeaturesNav.categories.strategies.name',
    items: [
      {
        id: 'strategies-relax-grow',
        image: '/assets/socials/real/nature.avif',
        imageAlt: 'Person relaxing in nature while their investments grow',
        heading: 'marketing.stickyFeaturesNav.strategies.heading',
        description: 'marketing.stickyFeaturesNav.strategies.description',
        ctaText: 'marketing.stickyFeaturesNav.ctaText',
        ctaLink: ROUTES.DEFI_STRATEGIES,
        ctaTarget: '_self',
      },
    ],
  },
  {
    id: 'business',
    name: 'marketing.stickyFeaturesNav.categories.business.name',
    items: [
      {
        id: 'business-day-to-day',
        image: '/assets/socials/real/money-with-icon.avif',
        imageAlt: 'Business professional managing day-to-day financial tasks',
        heading: 'marketing.stickyFeaturesNav.business.heading',
        description: 'marketing.stickyFeaturesNav.business.description',
        ctaText: 'marketing.stickyFeaturesNav.ctaText',
        ctaLink: ROUTES.BUSINESS.BENEFITS,
        ctaTarget: '_self',
      },
    ],
  },
] as const;

// Predefined sticky features nav configurations
export const STICKY_FEATURES_NAV_CONFIGS = {
  default: {
    variant: 'default' as const,
    mainTitle: 'marketing.stickyFeaturesNav.mainTitle',
    categories: DEFAULT_FEATURE_CATEGORIES,
    settings: DEFAULT_STICKY_FEATURES_NAV_SETTINGS,
    analytics: {
      trackingPrefix: 'sticky_features_nav_default',
      enabled: true,
    },
  },
} as const;

// Legacy compatibility
export const DEFAULT_STICKY_FEATURES_NAV_CONFIG = STICKY_FEATURES_NAV_CONFIGS.default;
export type StickyFeaturesNavConfig = StickyFeaturesNavVariantConfig;
