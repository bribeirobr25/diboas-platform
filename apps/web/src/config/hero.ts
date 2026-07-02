/**
 * Hero Section Configuration
 *
 * Domain-Driven Design: Hero domain configuration with clear data structures
 * Service Agnostic Abstraction: Decoupled hero content from presentation
 * Configuration Management: Centralized hero content and asset paths
 * No Hardcoded Values: All values configurable through interfaces
 * DRY Principles: Uses centralized asset helpers for type-safe paths
 */

import { getSocialRealAsset, getMascotAsset, getPhoneActivitiesAsset } from './assets';
import type { SceneKind, HeroTheme } from '@/components/Sections/CinematicHero';

export type HeroVariant = 'default' | 'fullBackground' | 'cinematic';

export interface HeroContent {
  readonly title: string;
  readonly description?: string;
  readonly ctaText: string;
  readonly ctaHref: string;
  readonly ctaTarget?: '_blank' | '_self';
  /** Mono eyebrow/kicker — used by the `cinematic` variant (i18n key). */
  readonly eyebrow?: string;
  /** Optional secondary CTA — used by the `cinematic` variant (i18n keys/href). */
  readonly secondaryCtaText?: string;
  readonly secondaryCtaHref?: string;
  readonly secondaryCtaTarget?: '_blank' | '_self';
}

/** Config for the `cinematic` (GSAP + Three.js) hero variant. */
export interface HeroCinematicConfig {
  readonly scene: SceneKind;
  readonly theme: HeroTheme;
  readonly align?: 'center' | 'left';
  /** Accent the trailing word(s) of the headline (liquid-capital style). */
  readonly accentHeadline?: boolean;
  readonly posterImage?: string;
  readonly posterAlt?: string;
  readonly posterDuotone?: boolean;
  readonly sectionId?: string;
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
  /** Optional: only the `default`/`cinematic` variants surface a per-hero title;
   *  `fullBackground` heroes take their <title> from the page's generateMetadata. */
  readonly titleTag?: string;
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
  readonly cinematic?: HeroCinematicConfig;
  readonly seo: HeroSEO;
  readonly analytics?: {
    readonly trackingPrefix: string;
    readonly enabled: boolean;
  };
  /** Optional per-variant layout tweaks (opt-in; defaults preserve base layout). */
  readonly layout?: {
    /**
     * Lift the (vertically centered) hero content block up by ~90px at every
     * breakpoint. Opt-in per page; other fullBackground heroes unaffected.
     */
    readonly contentLift?: boolean;
  };
}

// Configuration Management - Default visual assets
// No Hardcoded Values: Uses helper functions for type-safe asset paths
export const DEFAULT_VISUAL_ASSETS: HeroVisualAssets = {
  backgroundCircle: getMascotAsset('ACQUA_BASIC'),
  phoneImage: getPhoneActivitiesAsset(),
  mascotImage: getMascotAsset('MASCOT_ACQUA_FLYING'),
} as const;

// Configuration Management - Default background assets
// No Hardcoded Values: Uses getSocialRealAsset() helper for type-safe asset paths
export const DEFAULT_BACKGROUND_ASSETS: HeroBackgroundAssets = {
  backgroundImage: getSocialRealAsset('LIFE_NATURE'),
  backgroundImageMobile: getSocialRealAsset('LIFE_NATURE'),
  overlayOpacity: 0.3,
} as const;

// Default content configuration
// Note: These are translation keys that will be resolved at runtime
// Description property omitted - not needed for home page hero
export const DEFAULT_HERO_CONTENT: HeroContent = {
  title: 'marketing.pages.home.hero.title',
  ctaText: 'common.buttons.getStarted',
  ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
  ctaTarget: '_blank',
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
        background: 'Decorative teal circle background',
      },
    },
    analytics: {
      trackingPrefix: 'hero_default',
      enabled: true,
    },
  },
  fullBackground: {
    variant: 'fullBackground' as const,
    content: DEFAULT_HERO_CONTENT,
    backgroundAssets: DEFAULT_BACKGROUND_ASSETS,
    seo: {
      titleTag: 'diBoaS - Complete Financial Ecosystem',
      imageAlt: {
        background: 'Abstract diBoaS brand background illustration',
      },
    },
    analytics: {
      trackingPrefix: 'hero_fullbg',
      enabled: true,
    },
  },
  // Base config for the cinematic (GSAP + Three.js) hero. Per-page configs
  // (B2C/B2B/About) override `content`, `cinematic` and `analytics` via customConfig.
  cinematic: {
    variant: 'cinematic' as const,
    content: DEFAULT_HERO_CONTENT,
    cinematic: {
      scene: 'fluid',
      theme: 'dark',
      align: 'left',
    },
    seo: {
      titleTag: 'diBoaS - Complete Financial Ecosystem',
      imageAlt: {
        background: 'Abstract diBoaS animated brand background',
      },
    },
    analytics: {
      trackingPrefix: 'hero_cinematic',
      enabled: true,
    },
  },
} as const;

// Legacy compatibility
export const DEFAULT_HERO_CONFIG = HERO_CONFIGS.default;
export type HeroConfig = HeroVariantConfig;
