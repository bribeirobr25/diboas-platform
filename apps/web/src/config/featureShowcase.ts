/**
 * Feature Showcase Configuration
 * 
 * Domain-Driven Design: Feature showcase domain configuration with variant support
 * Service Agnostic Abstraction: Decoupled showcase content from presentation
 * Configuration Management: Centralized feature showcase content and asset paths
 * No Hardcoded Values: All values configurable through interfaces
 */

export type FeatureShowcaseVariant = 'default' | 'minimal' | 'fullscreen';

export interface FeatureShowcaseContent {
  readonly title: string;
  readonly description: string;
  readonly ctaText: string;
  readonly ctaHref: string;
  readonly ctaTarget?: '_blank' | '_self';
}

export interface FeatureShowcaseAssets {
  readonly primaryImage: string;
  readonly secondaryImage: string;
}

export interface FeatureShowcaseSEO {
  readonly imageAlt: {
    readonly primary: string;
    readonly secondary: string;
  };
}

export interface FeatureShowcaseSlide {
  readonly id: string;
  readonly content: FeatureShowcaseContent;
  readonly assets: FeatureShowcaseAssets;
  readonly seo: FeatureShowcaseSEO;
  readonly showSecondaryImage?: boolean;
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
export const DEFAULT_FEATURE_SHOWCASE_SLIDES: readonly FeatureShowcaseSlide[] = [
  {
    id: 'overview',
    content: {
      title: 'Track Activities & Earn Rewards',
      description: 'Monitor your financial activities and earn rewards all in one place. Get a complete view of your financial health with exclusive benefits.',
      ctaText: 'Get Started',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    assets: {
      primaryImage: '/assets/socials/drawing/phone-activities.avif',
      secondaryImage: '/assets/socials/drawing/phone-rewards.avif'
    },
    seo: {
      imageAlt: {
        primary: 'diBoaS mobile app showing activities overview interface',
        secondary: 'diBoaS mobile app showing rewards overview interface'
      }
    },
    showSecondaryImage: true
  },
  {
    id: 'activities',
    content: {
      title: 'Track Your Financial Activities',
      description: 'Monitor all your financial activities in one place. From spending insights to investment tracking, get a complete view of your financial health.',
      ctaText: 'Explore Activities',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    assets: {
      primaryImage: '/assets/socials/drawing/phone-activities.avif',
      secondaryImage: '/assets/socials/drawing/phone-activities.avif'
    },
    seo: {
      imageAlt: {
        primary: 'diBoaS mobile app showing financial activities tracking interface',
        secondary: 'diBoaS mobile app showing financial activities tracking interface'
      }
    }
  },
  {
    id: 'rewards',
    content: {
      title: 'Earn Rewards & Benefits',
      description: 'Get rewarded for your financial activities. Earn points, unlock benefits, and access exclusive features as you grow your financial portfolio.',
      ctaText: 'Discover Rewards',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    assets: {
      primaryImage: '/assets/socials/drawing/phone-rewards.avif',
      secondaryImage: '/assets/socials/drawing/phone-rewards.avif'
    },
    seo: {
      imageAlt: {
        primary: 'diBoaS mobile app showing rewards and loyalty program interface',
        secondary: 'diBoaS mobile app showing rewards and loyalty program interface'
      }
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
  minimal: {
    variant: 'minimal' as const,
    slides: DEFAULT_FEATURE_SHOWCASE_SLIDES,
    settings: {
      ...DEFAULT_FEATURE_SHOWCASE_SETTINGS,
      showNavigation: false,
      showDots: false,
      transitionDuration: 200,
    },
    analytics: {
      trackingPrefix: 'feature_showcase_minimal',
      enabled: true,
      eventSuffixes: {
        navigation: '_navigation',
        ctaClick: '_cta_click'
      }
    }
  },
  fullscreen: {
    variant: 'fullscreen' as const,
    slides: DEFAULT_FEATURE_SHOWCASE_SLIDES,
    settings: {
      ...DEFAULT_FEATURE_SHOWCASE_SETTINGS,
      showNavigation: true,
      showDots: true,
      transitionDuration: 250,
    },
    analytics: {
      trackingPrefix: 'feature_showcase_fullscreen',
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
    variant: 'minimal' as const,
    slides: [
      {
        id: 'learn-courses',
        content: {
          title: 'Learn Financial Strategies',
          description: 'Access comprehensive courses on personal finance, investing, and DeFi strategies. Build your knowledge with expert-curated content.',
          ctaText: 'Start Learning',
          ctaHref: '/learn',
          ctaTarget: '_self'
        },
        assets: {
          primaryImage: '/assets/socials/drawing/phone-activities.avif',
          secondaryImage: '/assets/socials/drawing/phone-rewards.avif'
        },
        seo: {
          imageAlt: {
            primary: 'diBoaS learning platform showing educational courses interface',
            secondary: 'diBoaS mobile app showing progress tracking interface'
          }
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
    variant: 'fullscreen' as const,
    slides: [
      {
        id: 'business-solutions',
        content: {
          title: 'Enterprise Financial Solutions',
          description: 'Streamline your business financial operations with our comprehensive suite of tools. From payroll to treasury management.',
          ctaText: 'Explore Business',
          ctaHref: '/business',
          ctaTarget: '_self'
        },
        assets: {
          primaryImage: '/assets/socials/drawing/phone-activities.avif',
          secondaryImage: '/assets/socials/drawing/phone-rewards.avif'
        },
        seo: {
          imageAlt: {
            primary: 'diBoaS business platform showing enterprise financial tools',
            secondary: 'diBoaS business dashboard showing analytics and reporting'
          }
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