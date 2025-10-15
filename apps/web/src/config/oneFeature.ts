/**
 * One Feature Configuration
 * 
 * Domain-Driven Design: Single feature showcase domain configuration with variant support
 * Service Agnostic Abstraction: Decoupled feature content from presentation
 * Configuration Management: Centralized feature content and settings
 * No Hardcoded Values: All values configurable through interfaces
 */

export type OneFeatureVariant = 'default';

export interface FeatureItem {
  readonly id: string;
  readonly title: string;
  readonly isPrimary?: boolean;
  readonly href: string;
  readonly target?: '_blank' | '_self';
}

export interface OneFeatureContent {
  readonly title: string;
  readonly subtitle: string;
  readonly features: readonly FeatureItem[];
  readonly cta: {
    readonly text: string;
    readonly href: string;
    readonly target?: '_blank' | '_self';
  };
}

export interface OneFeatureAssets {
  readonly heroImage: string;
  readonly heroImageAlt: string;
}

export interface OneFeatureSettings {
  readonly enableAnimations: boolean;
  readonly animationDelay: number; // milliseconds per card
  readonly imageLoadPriority: boolean;
}

export interface OneFeatureSEO {
  readonly ariaLabel: string;
  readonly region: string;
}

export interface OneFeatureVariantConfig {
  readonly variant: OneFeatureVariant;
  readonly content: OneFeatureContent;
  readonly assets: OneFeatureAssets;
  readonly settings: OneFeatureSettings;
  readonly seo: OneFeatureSEO;
  readonly analytics?: {
    readonly trackingPrefix: string;
    readonly enabled: boolean;
  };
}

// Default features
// Note: Feature titles are translation keys that will be resolved at runtime
export const DEFAULT_FEATURES: FeatureItem[] = [
  {
    id: 'me-roubaram',
    title: 'marketing.oneFeature.features.fraudReport',
    isPrimary: true,
    href: '/security/fraud-report',
    target: '_self'
  },
  {
    id: 'canal-denuncias',
    title: 'marketing.oneFeature.features.reports',
    href: '/security/reports',
    target: '_self'
  },
  {
    id: 'central-protecao',
    title: 'marketing.oneFeature.features.protection',
    href: '/security/protection',
    target: '_self'
  },
  {
    id: 'canais-atendimento',
    title: 'marketing.oneFeature.features.support',
    href: '/security/support',
    target: '_self'
  }
];

// Default content configuration
// Note: Title, subtitle, and CTA text are translation keys that will be resolved at runtime
export const DEFAULT_ONE_FEATURE_CONTENT: OneFeatureContent = {
  title: 'marketing.oneFeature.title',
  subtitle: 'marketing.oneFeature.subtitle',
  features: DEFAULT_FEATURES,
  cta: {
    text: 'marketing.oneFeature.ctaText',
    href: '/security',
    target: '_self'
  }
} as const;

// Default settings
export const DEFAULT_ONE_FEATURE_SETTINGS: OneFeatureSettings = {
  enableAnimations: true,
  animationDelay: 100,
  imageLoadPriority: true
} as const;

// Default assets
export const DEFAULT_ONE_FEATURE_ASSETS: OneFeatureAssets = {
  heroImage: '/assets/socials/drawing/safe.avif',
  heroImageAlt: '3D security vault illustration'
} as const;

// Predefined variant configurations
export const ONE_FEATURE_CONFIGS = {
  default: {
    variant: 'default' as const,
    content: DEFAULT_ONE_FEATURE_CONTENT,
    assets: DEFAULT_ONE_FEATURE_ASSETS,
    settings: DEFAULT_ONE_FEATURE_SETTINGS,
    seo: {
      ariaLabel: 'Security features section',
      region: 'security'
    },
    analytics: {
      trackingPrefix: 'one_feature_default',
      enabled: true
    }
  }
} as const;

// Legacy compatibility
export const DEFAULT_ONE_FEATURE_CONFIG = ONE_FEATURE_CONFIGS.default;
export type OneFeatureConfig = OneFeatureVariantConfig;