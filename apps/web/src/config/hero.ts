/**
 * Hero Section Configuration
 * 
 * Domain-Driven Design: Hero domain configuration with clear data structures
 * Service Agnostic Abstraction: Decoupled hero content from presentation
 * Configuration Management: Centralized hero content and asset paths
 */

export interface HeroContent {
  readonly title: string;
  readonly description?: string;
  readonly ctaText: string;
  readonly ctaHref: string;
  readonly ctaTarget?: '_blank' | '_self';
}

export interface HeroAssets {
  readonly backgroundCircle: string;
  readonly phoneImage: string;
  readonly mascotImage: string;
}

export interface HeroSEO {
  readonly titleTag: string;
  readonly imageAlt: {
    readonly phone: string;
    readonly mascot: string;
    readonly background: string;
  };
}

export interface HeroConfig {
  readonly content: HeroContent;
  readonly assets: HeroAssets;
  readonly seo: HeroSEO;
}

// Configuration Management - Default hero assets
export const DEFAULT_HERO_ASSETS: HeroAssets = {
  backgroundCircle: '/assets/landing/bg-circle-acqua.avif',
  phoneImage: '/assets/landing/phone-account.avif',
  mascotImage: '/assets/mascots/acqua/mascot-acqua-flying.avif',
} as const;

// Default configuration for homepage
export const DEFAULT_HERO_CONFIG: HeroConfig = {
  content: {
    title: 'Your Complete Financial Ecosystem',
    description: 'Manage your banking, investing, and DeFi assets all in one secure platform. Experience financial freedom with diBoaS.',
    ctaText: 'Get Started',
    ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    ctaTarget: '_blank'
  },
  assets: DEFAULT_HERO_ASSETS,
  seo: {
    titleTag: 'diBoaS - Complete Financial Ecosystem',
    imageAlt: {
      phone: 'diBoaS mobile application interface showing account dashboard',
      mascot: 'Acqua, the diBoaS financial assistant mascot',
      background: 'Decorative teal circle background'
    }
  }
} as const;