/**
 * Hero Section Configuration
 * 
 * Domain-Driven Design: Hero domain configuration with clear data structures
 * Service Agnostic Abstraction: Decoupled hero content from presentation
 * Configuration Management: Centralized hero content and asset paths
 * No Hardcoded Values: All values configurable through interfaces
 */

export type HeroVariant = 'default' | 'fullBackground';

export interface HeroContent {
  readonly title: string;
  readonly description?: string;
  readonly ctaText: string;
  readonly ctaHref: string;
  readonly ctaTarget?: '_blank' | '_self';
}

export interface HeroVisualAssets {
  readonly backgroundCircle: string;
  readonly phoneImage: string;
  readonly mascotImage: string;
}

export interface HeroBackgroundAssets {
  readonly backgroundImage: string;
  readonly backgroundImageMobile?: string;
  readonly overlayOpacity?: number;
}

export interface HeroSEO {
  readonly titleTag: string;
  readonly imageAlt: {
    readonly phone?: string;
    readonly mascot?: string;
    readonly background: string;
  };
}

export interface HeroVariantConfig {
  readonly variant: HeroVariant;
  readonly content: HeroContent;
  readonly visualAssets?: HeroVisualAssets;
  readonly backgroundAssets?: HeroBackgroundAssets;
  readonly seo: HeroSEO;
  readonly analytics?: {
    readonly trackingPrefix: string;
    readonly enabled: boolean;
  };
}

// Configuration Management - Default visual assets
export const DEFAULT_VISUAL_ASSETS: HeroVisualAssets = {
  backgroundCircle: '/assets/mascots/acqua-basic.avif',
  phoneImage: '/assets/socials/drawing/phone-activities.avif',
  mascotImage: '/assets/mascots/mascot-acqua-flying.avif',
} as const;

// Configuration Management - Default background assets
export const DEFAULT_BACKGROUND_ASSETS: HeroBackgroundAssets = {
  backgroundImage: '/assets/socials/real/life_nature.avif',
  backgroundImageMobile: '/assets/socials/real/life_nature.avif',
  overlayOpacity: 0.3,
} as const;

// Default content configuration
// Note: These are translation keys that will be resolved at runtime
// Description property omitted - not needed for home page hero
export const DEFAULT_HERO_CONTENT: HeroContent = {
  title: 'marketing.pages.home.hero.title',
  ctaText: 'common.buttons.getStarted',
  ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
  ctaTarget: '_blank'
} as const;

// Predefined hero configurations
export const HERO_CONFIGS = {
  default: {
    variant: 'default' as const,
    content: DEFAULT_HERO_CONTENT,
    visualAssets: DEFAULT_VISUAL_ASSETS,
    seo: {
      titleTag: 'diBoaS - Complete Financial Ecosystem',
      imageAlt: {
        phone: 'diBoaS mobile application interface showing account dashboard',
        mascot: 'Acqua, the diBoaS financial assistant mascot',
        background: 'Decorative teal circle background'
      }
    },
    analytics: {
      trackingPrefix: 'hero_default',
      enabled: true
    }
  },
  fullBackground: {
    variant: 'fullBackground' as const,
    content: DEFAULT_HERO_CONTENT,
    backgroundAssets: DEFAULT_BACKGROUND_ASSETS,
    seo: {
      titleTag: 'diBoaS - Complete Financial Ecosystem',
      imageAlt: {
        background: 'Abstract diBoaS brand background illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_fullbg',
      enabled: true
    }
  }
} as const;

// Legacy compatibility
export const DEFAULT_HERO_CONFIG = HERO_CONFIGS.default;
export type HeroConfig = HeroVariantConfig;