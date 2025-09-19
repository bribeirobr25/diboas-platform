/**
 * One Feature Section Configuration
 * 
 * Domain-Driven Design: One feature domain configuration
 * Service Agnostic Abstraction: Decoupled feature content from presentation
 * Configuration Management: Centralized one feature content and asset paths
 */

export interface OneFeatureLink {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly target?: '_blank' | '_self';
  readonly external?: boolean;
}

export interface OneFeatureContent {
  readonly heading: string;
  readonly subheading: string;
  readonly ctaText: string;
  readonly ctaHref: string;
  readonly ctaTarget?: '_blank' | '_self';
}

export interface OneFeatureAssets {
  readonly illustration: string;
}

export interface OneFeatureSEO {
  readonly illustrationAlt: string;
}

export interface OneFeatureConfig {
  readonly content: OneFeatureContent;
  readonly links: readonly OneFeatureLink[];
  readonly assets: OneFeatureAssets;
  readonly seo: OneFeatureSEO;
  readonly settings: {
    readonly enableAnalytics: boolean;
  };
}

// Configuration Management - Default one feature links
export const DEFAULT_ONE_FEATURE_LINKS: readonly OneFeatureLink[] = [
  {
    id: 'fraud-alerts',
    label: 'Fraud alerts',
    href: '/security/fraud-alerts',
    target: '_self',
    external: false
  },
  {
    id: 'protection-center',
    label: 'Protection center',
    href: '/security/protection-center',
    target: '_self',
    external: false
  },
  {
    id: 'support-channels',
    label: 'Support channels',
    href: '/help/support',
    target: '_self',
    external: false
  }
] as const;

// Default configuration for homepage
export const DEFAULT_ONE_FEATURE_CONFIG: OneFeatureConfig = {
  content: {
    heading: 'Security is our priority',
    subheading: "We're here to provide full support and ensure the protection of your money.",
    ctaText: 'Learn more',
    ctaHref: '/security',
    ctaTarget: '_self'
  },
  links: DEFAULT_ONE_FEATURE_LINKS,
  assets: {
    illustration: '/assets/socials/drawing/safe.avif'
  },
  seo: {
    illustrationAlt: 'Security shield protecting financial assets'
  },
  settings: {
    enableAnalytics: true
  }
} as const;

// One feature content for different pages
export const PAGE_ONE_FEATURE_CONFIGS = {
  // Homepage - Security focused
  HOME: DEFAULT_ONE_FEATURE_CONFIG,
  
  // Account page - Account security features
  ACCOUNT: {
    content: {
      heading: 'Your account is protected',
      subheading: 'Multiple layers of security ensure your financial data and transactions are always safe.',
      ctaText: 'View security settings',
      ctaHref: '/account/security',
      ctaTarget: '_self'
    },
    links: [
      {
        id: 'two-factor',
        label: 'Two-factor authentication',
        href: '/account/security/2fa',
        target: '_self',
        external: false
      },
      {
        id: 'transaction-alerts',
        label: 'Transaction alerts',
        href: '/account/security/alerts',
        target: '_self',
        external: false
      },
      {
        id: 'device-management',
        label: 'Trusted devices',
        href: '/account/security/devices',
        target: '_self',
        external: false
      }
    ],
    assets: {
      illustration: '/assets/socials/drawing/safe.avif'
    },
    seo: {
      illustrationAlt: 'Account security features illustration'
    },
    settings: {
      enableAnalytics: true
    }
  } as OneFeatureConfig,
  
  // Business page - Enterprise security
  BUSINESS: {
    content: {
      heading: 'Enterprise-grade security',
      subheading: 'Bank-level security infrastructure designed to protect your business operations and financial data.',
      ctaText: 'Security whitepaper',
      ctaHref: '/business/security-whitepaper',
      ctaTarget: '_blank'
    },
    links: [
      {
        id: 'compliance',
        label: 'Compliance certifications',
        href: '/business/compliance',
        target: '_self',
        external: false
      },
      {
        id: 'api-security',
        label: 'API security',
        href: '/business/api-security',
        target: '_self',
        external: false
      },
      {
        id: 'enterprise-support',
        label: '24/7 enterprise support',
        href: '/business/support',
        target: '_self',
        external: false
      }
    ],
    assets: {
      illustration: '/assets/socials/drawing/safe.avif'
    },
    seo: {
      illustrationAlt: 'Enterprise security infrastructure illustration'
    },
    settings: {
      enableAnalytics: true
    }
  } as OneFeatureConfig,

  // Security page - Comprehensive security
  SECURITY: {
    content: {
      heading: 'Complete security ecosystem',
      subheading: 'Advanced protection at every level, from infrastructure to your daily transactions.',
      ctaText: 'Read security guide',
      ctaHref: '/security/safety-guide',
      ctaTarget: '_self'
    },
    links: [
      {
        id: 'encryption',
        label: 'End-to-end encryption',
        href: '/security/encryption',
        target: '_self',
        external: false
      },
      {
        id: 'audit-reports',
        label: 'Security audits',
        href: '/security/audit-reports',
        target: '_self',
        external: false
      },
      {
        id: 'bug-bounty',
        label: 'Bug bounty program',
        href: 'https://security.diboas.com/bug-bounty',
        target: '_blank',
        external: true
      }
    ],
    assets: {
      illustration: '/assets/socials/drawing/safe.avif'
    },
    seo: {
      illustrationAlt: 'Comprehensive security ecosystem visualization'
    },
    settings: {
      enableAnalytics: true
    }
  } as OneFeatureConfig,

  // Help page - Support resources
  HELP: {
    content: {
      heading: 'We\'re here to help',
      subheading: 'Get support through multiple channels, available whenever you need assistance.',
      ctaText: 'Contact support',
      ctaHref: '/help/contact',
      ctaTarget: '_self'
    },
    links: [
      {
        id: 'help-center',
        label: 'Help center',
        href: '/help/faq',
        target: '_self',
        external: false
      },
      {
        id: 'live-chat',
        label: 'Live chat support',
        href: '/help/chat',
        target: '_self',
        external: false
      },
      {
        id: 'community',
        label: 'Community forum',
        href: 'https://community.diboas.com',
        target: '_blank',
        external: true
      }
    ],
    assets: {
      illustration: '/assets/socials/drawing/safe.avif'
    },
    seo: {
      illustrationAlt: 'Customer support and help resources'
    },
    settings: {
      enableAnalytics: true
    }
  } as OneFeatureConfig
} as const;