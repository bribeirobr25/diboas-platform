/**
 * Feature Showcase Configuration
 * 
 * Domain-Driven Design: Feature showcase domain configuration
 * Service Agnostic Abstraction: Decoupled showcase content from presentation
 * Configuration Management: Centralized feature showcase content and asset paths
 */

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
}

export interface FeatureShowcaseConfig {
  readonly slides: readonly FeatureShowcaseSlide[];
  readonly settings: {
    readonly showNavigation: boolean;
    readonly showDots: boolean;
    readonly enableAnalytics: boolean;
  };
}

// Configuration Management - Default feature showcase slides
export const DEFAULT_FEATURE_SHOWCASE_SLIDES: readonly FeatureShowcaseSlide[] = [
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
      secondaryImage: '/assets/socials/drawing/phone-rewards.avif'
    },
    seo: {
      imageAlt: {
        primary: 'diBoaS mobile app showing financial activities tracking interface',
        secondary: 'diBoaS mobile app showing rewards and benefits interface'
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
      secondaryImage: '/assets/socials/drawing/phone-activities.avif'
    },
    seo: {
      imageAlt: {
        primary: 'diBoaS mobile app showing rewards and loyalty program interface',
        secondary: 'diBoaS mobile app showing financial activities overview interface'
      }
    }
  }
] as const;

// Default configuration for feature showcase
export const DEFAULT_FEATURE_SHOWCASE_CONFIG: FeatureShowcaseConfig = {
  slides: DEFAULT_FEATURE_SHOWCASE_SLIDES,
  settings: {
    showNavigation: true,
    showDots: false,
    enableAnalytics: true
  }
} as const;

// Feature showcase content for different pages
export const PAGE_FEATURE_SHOWCASE_CONFIGS = {
  // Homepage - Activities & Rewards
  HOME: DEFAULT_FEATURE_SHOWCASE_CONFIG,
  
  // Learn page - Educational content
  LEARN: {
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
      enableAnalytics: true
    }
  } as FeatureShowcaseConfig,
  
  // Business page - B2B features
  BUSINESS: {
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
      enableAnalytics: true
    }
  } as FeatureShowcaseConfig
} as const;