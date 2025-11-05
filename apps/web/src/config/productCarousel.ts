/**
 * Product Carousel Configuration
 *
 * Domain-Driven Design: Product carousel domain configuration with variant support
 * Service Agnostic Abstraction: Decoupled carousel content from presentation
 * Configuration Management: Centralized carousel content and settings
 * No Hardcoded Values: All values configurable through interfaces
 * DRY Principles: Uses centralized ROUTES configuration for all links
 */

import { APP_URL } from '@/config/environment';
import { ROUTES } from './routes';
import { getSocialRealAsset } from './assets';

export type ProductCarouselVariant = 'default';

export interface ProductCarouselSlide {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly ctaText?: string;
  readonly ctaHref?: string;
}

export interface ProductCarouselSettings {
  readonly autoPlay: boolean;
  readonly autoPlayInterval: number; // milliseconds
  readonly transitionDuration: number; // milliseconds
  readonly pauseOnHover: boolean;
  readonly enableKeyboard: boolean;
  readonly enableTouch: boolean;
  readonly enableDots: boolean;
  readonly enablePlayPause: boolean;
}

export interface ProductCarouselContent {
  readonly heading: string;
  readonly slides: ProductCarouselSlide[];
}

export interface ProductCarouselSEO {
  readonly headingTag: string;
  readonly ariaLabel: string;
}

export interface ProductCarouselVariantConfig {
  readonly variant: ProductCarouselVariant;
  readonly content: ProductCarouselContent;
  readonly settings: ProductCarouselSettings;
  readonly seo: ProductCarouselSEO;
  readonly analytics?: {
    readonly trackingPrefix: string;
    readonly enabled: boolean;
  };
}

// Configuration Management - Default carousel settings
export const DEFAULT_PRODUCT_CAROUSEL_SETTINGS: ProductCarouselSettings = {
  autoPlay: true,
  autoPlayInterval: 3000,
  transitionDuration: 800,
  pauseOnHover: true,
  enableKeyboard: true,
  enableTouch: true,
  enableDots: true,
  enablePlayPause: true,
} as const;

// Default carousel slides (matches documentation specifications)
// Note: Titles and subtitles are translation keys that will be resolved at runtime
// DRY Principles: All links use centralized ROUTES configuration
// No Hardcoded Values: Uses getSocialRealAsset() helper for type-safe asset paths
export const DEFAULT_PRODUCT_CAROUSEL_SLIDES: ProductCarouselSlide[] = [
  {
    id: 'benefits',
    title: 'marketing.productCarousel.slides.benefits.title',
    subtitle: 'marketing.productCarousel.slides.benefits.subtitle',
    image: getSocialRealAsset('INVESTMENT_MAN_TATTOO'),
    imageAlt: 'Couple',
    ctaText: 'common.buttons.getStarted',
    ctaHref: APP_URL
  },
  {
    id: 'rewards',
    title: 'marketing.productCarousel.slides.rewards.title',
    subtitle: 'marketing.productCarousel.slides.rewards.subtitle',
    image: getSocialRealAsset('LOGIN_WOMAN'),
    imageAlt: 'friends',
    ctaText: 'common.buttons.learnMore',
    ctaHref: ROUTES.INVESTING
  },
  {
    id: 'business',
    title: 'marketing.productCarousel.slides.business.title',
    subtitle: 'marketing.productCarousel.slides.business.subtitle',
    image: getSocialRealAsset('BUSINESS_PAYMENT_CARD'),
    imageAlt: 'Business group',
    ctaText: 'common.buttons.learnMore',
    ctaHref: ROUTES.BUSINESS.BENEFITS
  }
] as const;

// Default content configuration
// Note: Heading is a translation key that will be resolved at runtime
export const DEFAULT_PRODUCT_CAROUSEL_CONTENT: ProductCarouselContent = {
  heading: 'marketing.productCarousel.heading',
  slides: DEFAULT_PRODUCT_CAROUSEL_SLIDES,
} as const;

// Predefined carousel configurations
export const PRODUCT_CAROUSEL_CONFIGS = {
  default: {
    variant: 'default' as const,
    content: DEFAULT_PRODUCT_CAROUSEL_CONTENT,
    settings: DEFAULT_PRODUCT_CAROUSEL_SETTINGS,
    seo: {
      headingTag: 'OneFi - Complete Financial Ecosystem',
      ariaLabel: 'Product carousel showcasing financial solutions'
    },
    analytics: {
      trackingPrefix: 'product_carousel_default',
      enabled: true
    }
  }
} as const;

// Legacy compatibility
export const DEFAULT_PRODUCT_CAROUSEL_CONFIG = PRODUCT_CAROUSEL_CONFIGS.default;
export type ProductCarouselConfig = ProductCarouselVariantConfig;