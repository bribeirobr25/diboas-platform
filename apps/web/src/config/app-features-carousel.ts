/**
 * App Features Carousel Configuration
 * 
 * Domain-Driven Design: App features carousel domain configuration
 * Service Agnostic Abstraction: Decoupled carousel content from presentation
 * Configuration Management: Centralized app features content and asset paths
 */

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

export interface AppFeaturesCarouselConfig {
  readonly sectionTitle: string;
  readonly cards: readonly AppFeatureCard[];
  readonly settings: {
    readonly autoRotateMs: number; // 0 = no auto-rotate
    readonly pauseOnHover: boolean;
    readonly enableTouch: boolean;
    readonly enableAnalytics: boolean;
  };
}

// Configuration Management - Default app features carousel cards
export const DEFAULT_APP_FEATURES_CARDS: readonly AppFeatureCard[] = [
  {
    id: 'organize-money',
    content: {
      title: 'Organize Your Money',
      description: 'Keep your money organized and aligned with your goals.',
      ctaText: 'Learn about diBoaS',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank',
      chipLabel: 'Descubra Casamentos'
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
      title: 'Instant Payments',
      description: 'Pay and receive with speed and convenience anytime, anywhere.',
      ctaText: 'Learn about diBoaS',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank',
      chipLabel: 'Pix realizado'
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
      title: 'Secure Purchases',
      description: 'Shop with debit or credit safely and receive real-time notifications in the app.',
      ctaText: 'Learn about diBoaS',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank',
      chipLabel: 'Compra no débito'
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
      title: 'Achieve Financial Goals',
      description: 'Get financial help to resolve an emergency or fulfill a dream.',
      ctaText: 'Learn about our loans',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank',
      chipLabel: 'Empréstimo efetuado'
    },
    assets: {
      image: '/assets/socials/real/trip.avif'
    },
    seo: {
      imageAlt: 'Person planning and achieving travel dreams with financial planning tools'
    }
  }
] as const;

// Default configuration for homepage
export const DEFAULT_APP_FEATURES_CAROUSEL_CONFIG: AppFeaturesCarouselConfig = {
  sectionTitle: 'An app for everything. And everything in the app',
  cards: DEFAULT_APP_FEATURES_CARDS,
  settings: {
    autoRotateMs: 4000, // 4 seconds
    pauseOnHover: true,
    enableTouch: true,
    enableAnalytics: true
  }
} as const;

// App features carousel content for different pages
export const PAGE_APP_FEATURES_CONFIGS = {
  // Homepage - Full app features showcase
  HOME: DEFAULT_APP_FEATURES_CAROUSEL_CONFIG,
  
  // Account page - Account-focused features
  ACCOUNT: {
    sectionTitle: 'Everything you need in your account',
    cards: [
      {
        id: 'account-management',
        content: {
          title: 'Complete Account Management',
          description: 'Manage all your accounts, transactions, and financial data in one place.',
          ctaText: 'Open Account',
          ctaHref: '/account',
          ctaTarget: '_self',
          chipLabel: 'Conta Digital'
        },
        assets: {
          image: '/assets/socials/real/zen-br.avif'
        },
        seo: {
          imageAlt: 'Person managing digital banking account with ease'
        }
      },
      {
        id: 'real-time-notifications',
        content: {
          title: 'Real-time Notifications',
          description: 'Stay updated with instant notifications for all your financial activities.',
          ctaText: 'Enable Notifications',
          ctaHref: '/account',
          ctaTarget: '_self',
          chipLabel: 'Notificações'
        },
        assets: {
          image: '/assets/socials/real/chilling.avif'
        },
        seo: {
          imageAlt: 'Person receiving real-time banking notifications'
        }
      },
      {
        id: 'secure-transactions',
        content: {
          title: 'Secure Transactions',
          description: 'All transactions are protected with bank-level security and encryption.',
          ctaText: 'Learn More',
          ctaHref: '/security',
          ctaTarget: '_self',
          chipLabel: 'Segurança'
        },
        assets: {
          image: '/assets/socials/real/walking.avif'
        },
        seo: {
          imageAlt: 'Secure banking transactions with advanced protection'
        }
      },
      {
        id: 'financial-insights',
        content: {
          title: 'Financial Insights',
          description: 'Get personalized insights and recommendations to improve your financial health.',
          ctaText: 'View Insights',
          ctaHref: '/account',
          ctaTarget: '_self',
          chipLabel: 'Insights'
        },
        assets: {
          image: '/assets/socials/real/trip.avif'
        },
        seo: {
          imageAlt: 'Person analyzing financial insights and planning future goals'
        }
      }
    ],
    settings: {
      autoRotateMs: 5000,
      pauseOnHover: true,
      enableTouch: true,
      enableAnalytics: true
    }
  } as AppFeaturesCarouselConfig,
  
  // Business page - B2B features
  BUSINESS: {
    sectionTitle: 'Business solutions for every need',
    cards: [
      {
        id: 'business-banking',
        content: {
          title: 'Complete Business Banking',
          description: 'Comprehensive banking solutions designed for businesses of all sizes.',
          ctaText: 'Explore Business',
          ctaHref: '/business',
          ctaTarget: '_self',
          chipLabel: 'Business Banking'
        },
        assets: {
          image: '/assets/socials/real/zen-br.avif'
        },
        seo: {
          imageAlt: 'Business professional managing corporate banking solutions'
        }
      },
      {
        id: 'payroll-management',
        content: {
          title: 'Streamlined Payroll',
          description: 'Automate payroll processing with integrated HR and accounting tools.',
          ctaText: 'Learn More',
          ctaHref: '/business/payments',
          ctaTarget: '_self',
          chipLabel: 'Payroll'
        },
        assets: {
          image: '/assets/socials/real/chilling.avif'
        },
        seo: {
          imageAlt: 'HR professional processing payroll with automated tools'
        }
      },
      {
        id: 'treasury-management',
        content: {
          title: 'Treasury Management',
          description: 'Optimize cash flow and manage corporate finances with advanced tools.',
          ctaText: 'Discover Treasury',
          ctaHref: '/business/treasury',
          ctaTarget: '_self',
          chipLabel: 'Treasury'
        },
        assets: {
          image: '/assets/socials/real/walking.avif'
        },
        seo: {
          imageAlt: 'Financial manager optimizing corporate treasury operations'
        }
      },
      {
        id: 'business-analytics',
        content: {
          title: 'Business Analytics',
          description: 'Make informed decisions with comprehensive business intelligence and reporting.',
          ctaText: 'View Analytics',
          ctaHref: '/business/analytics',
          ctaTarget: '_self',
          chipLabel: 'Analytics'
        },
        assets: {
          image: '/assets/socials/real/trip.avif'
        },
        seo: {
          imageAlt: 'Business analyst reviewing comprehensive financial reports and metrics'
        }
      }
    ],
    settings: {
      autoRotateMs: 6000,
      pauseOnHover: true,
      enableTouch: true,
      enableAnalytics: true
    }
  } as AppFeaturesCarouselConfig
} as const;