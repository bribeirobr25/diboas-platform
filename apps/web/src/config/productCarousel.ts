/**
 * Product Carousel Configuration
 * 
 * Domain-Driven Design: Product carousel domain configuration with variant support
 * Service Agnostic Abstraction: Decoupled carousel content from presentation
 * Configuration Management: Centralized carousel content and settings
 * No Hardcoded Values: All values configurable through interfaces
 */

export type ProductCarouselVariant = 'default' | 'compact' | 'fullWidth';

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

// Default carousel slides
export const DEFAULT_PRODUCT_CAROUSEL_SLIDES: ProductCarouselSlide[] = [
  {
    id: 'benefits',
    title: 'diBoaS Benefits',
    subtitle: 'Take control of your Financial life',
    image: '/assets/socials/real/couple.avif',
    imageAlt: 'Dancing couple enjoying financial freedom',
  },
  {
    id: 'rewards',
    title: 'diBoaS Rewards', 
    subtitle: 'Share what is good and grow with your friends',
    image: '/assets/socials/real/group.avif',
    imageAlt: 'Friends celebrating together',
  },
  {
    id: 'business',
    title: 'diBoaS Business',
    subtitle: 'Make your business cash flow generate passive income',
    image: '/assets/socials/real/share.avif',
    imageAlt: 'Business group collaborating',
  }
] as const;

// Default content configuration
export const DEFAULT_PRODUCT_CAROUSEL_CONTENT: ProductCarouselContent = {
  heading: 'OneFi - One App for Everything',
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
  },
  compact: {
    variant: 'compact' as const,
    content: DEFAULT_PRODUCT_CAROUSEL_CONTENT,
    settings: {
      ...DEFAULT_PRODUCT_CAROUSEL_SETTINGS,
      autoPlayInterval: 2500,
      transitionDuration: 600,
    },
    seo: {
      headingTag: 'OneFi - Financial Solutions',
      ariaLabel: 'Compact product carousel'
    },
    analytics: {
      trackingPrefix: 'product_carousel_compact',
      enabled: true
    }
  },
  fullWidth: {
    variant: 'fullWidth' as const,
    content: DEFAULT_PRODUCT_CAROUSEL_CONTENT,
    settings: {
      ...DEFAULT_PRODUCT_CAROUSEL_SETTINGS,
      autoPlayInterval: 4000,
      transitionDuration: 1000,
    },
    seo: {
      headingTag: 'OneFi - Complete Financial Ecosystem',
      ariaLabel: 'Full-width product carousel'
    },
    analytics: {
      trackingPrefix: 'product_carousel_fullwidth',
      enabled: true
    }
  }
} as const;

// Legacy compatibility
export const DEFAULT_PRODUCT_CAROUSEL_CONFIG = PRODUCT_CAROUSEL_CONFIGS.default;
export type ProductCarouselConfig = ProductCarouselVariantConfig;