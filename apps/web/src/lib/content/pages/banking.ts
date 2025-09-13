import { type PageConfig } from '../types';

/**
 * Banking Page Configuration
 * 
 * Single Source of Truth for banking service page content
 * Follows DRY principles with reusable content blocks
 */
export const bankingPageConfig: PageConfig = {
  metadata: {
    title: 'Smart Banking Services | diBoaS',
    description: 'Experience next-generation banking with zero fees, instant transfers, smart budgeting, and AI-powered financial insights.',
    keywords: [
      'digital banking',
      'zero fee banking',
      'smart budgeting',
      'instant transfers',
      'AI banking',
      'modern banking',
      'financial management'
    ],
    openGraph: {
      title: 'Smart Banking Services | diBoaS',
      description: 'Experience next-generation banking with zero fees and instant everything.',
      image: '/assets/social/banking-og.jpg',
      type: 'website'
    },
    twitter: {
      title: 'Smart Banking Services | diBoaS',
      description: 'Zero fees. Instant transfers. Smart budgeting.',
      image: '/assets/social/banking-twitter.jpg',
      card: 'summary_large_image'
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FinancialProduct',
      name: 'diBoaS Banking Services',
      provider: {
        '@type': 'Organization',
        name: 'diBoaS',
        url: 'https://diboas.com'
      },
      description: 'Digital banking services with zero fees and smart features',
      feesAndCommissionsSpecification: 'Zero fees on transfers and basic banking'
    }
  },

  sections: [
    {
      id: 'banking-hero',
      type: 'hero',
      sectionConfig: {
        variant: 'split',
        background: 'gradient-banking'
      },
      sectionContent: {
        title: 'Banking Made Simple',
        subtitle: 'Smart Banking Solutions',
        description: 'Experience next-generation banking with zero fees, instant transfers, and AI-powered budgeting that adapts to your lifestyle.',
        cta: {
          primary: {
            text: 'Open Your Account',
            href: '/register',
            variant: 'primary',
            trackingEvent: 'cta_banking_hero_primary',
            utmSource: 'banking_page',
            utmMedium: 'hero_section',
            utmCampaign: 'banking_signup'
          },
          secondary: {
            text: 'See How It Works',
            href: '#banking-features',
            variant: 'outline',
            trackingEvent: 'cta_banking_hero_secondary'
          }
        },
        mascot: {
          type: 'acqua',
          variant: 'flying',
          animation: 'bounce'
        },
        trustIndicators: {
          users: 'Trusted by 50,000+ users',
          rating: '4.9/5 rating',
          security: 'Bank-level security'
        }
      },
      trackVisibility: true
    },

    {
      id: 'banking-features',
      type: 'features',
      sectionConfig: {
        variant: 'grid',
        background: 'neutral'
      },
      sectionContent: {
        title: 'Everything You Need in Modern Banking',
        subtitle: 'Powered by Acqua, your AI banking assistant',
        items: [
          {
            id: 'zero-fees',
            icon: 'money-flow',
            title: 'Zero-Fee Transfers',
            description: 'Send money instantly to anyone, anywhere, without paying a single fee. Your money, your way.',
            image: '/assets/features/zero-fees.avif'
          },
          {
            id: 'smart-budgeting', 
            icon: 'chart-growing',
            title: 'AI-Powered Budgeting',
            description: 'Let Acqua analyze your spending patterns and create personalized budgets that actually work.',
            image: '/assets/features/smart-budgeting.avif'
          },
          {
            id: 'instant-payments',
            icon: 'card',
            title: 'Instant Everything',
            description: 'Pay bills, transfer money, and manage accounts in real-time. No waiting, no delays.',
            image: '/assets/features/instant-payments.avif'
          },
          {
            id: 'multi-currency',
            icon: 'money-circle',
            title: 'Global Currency Support',
            description: 'Hold, spend, and exchange multiple currencies with real-time rates and zero hidden fees.',
            image: '/assets/features/multi-currency.avif'
          },
          {
            id: 'virtual-cards',
            icon: 'safe-money',
            title: 'Virtual Cards',
            description: 'Create unlimited virtual cards for online shopping, subscriptions, and secure transactions.',
            image: '/assets/features/virtual-cards.avif'
          },
          {
            id: 'financial-insights',
            icon: 'learn-lamp',
            title: 'Financial Insights',
            description: 'Get personalized insights and recommendations to improve your financial health.',
            image: '/assets/features/financial-insights.avif'
          }
        ],
        layout: 'grid',
        columns: 3
      },
      lazyLoad: true,
      trackVisibility: true
    },

    {
      id: 'banking-trust',
      type: 'trust',
      sectionConfig: {
        variant: 'with-stats',
        background: 'white'
      },
      sectionContent: {
        title: 'Your Money, Secured by Design',
        subtitle: 'Built with enterprise-grade security that banks trust',
        features: [
          {
            title: 'FDIC Insured',
            description: 'Your deposits are insured up to $250,000 by the Federal Deposit Insurance Corporation.',
            icon: 'safe-money'
          },
          {
            title: '256-bit Encryption',
            description: 'Military-grade encryption protects your data and transactions 24/7.',
            icon: 'safe-money'
          },
          {
            title: 'Real-time Monitoring',
            description: 'Advanced fraud detection monitors every transaction to keep your money safe.',
            icon: 'safe-money'
          },
          {
            title: 'Two-Factor Authentication',
            description: 'Multi-layer security ensures only you can access your account.',
            icon: 'safe-money'
          }
        ],
        stats: [
          {
            number: '99.9%',
            label: 'Uptime guarantee'
          },
          {
            number: '$500M+',
            label: 'Assets secured'
          },
          {
            number: '0',
            label: 'Security breaches'
          },
          {
            number: '24/7',
            label: 'Fraud monitoring'
          }
        ],
        backgroundImage: '/assets/landing/vault-security.avif'
      },
      lazyLoad: true,
      trackVisibility: true
    },

    {
      id: 'banking-cta',
      type: 'cta',
      sectionConfig: {
        variant: 'centered',
        background: 'gradient-primary'
      },
      sectionContent: {
        title: 'Ready to Experience Better Banking?',
        subtitle: 'Join thousands who\'ve already made the switch',
        description: 'Open your account in minutes and start enjoying zero-fee banking with AI-powered insights.',
        cta: {
          text: 'Get Started Today',
          href: '/register',
          variant: 'primary',
          trackingEvent: 'cta_banking_final',
          utmSource: 'banking_page',
          utmMedium: 'bottom_cta',
          utmCampaign: 'banking_conversion'
        },
        backgroundStyle: 'gradient',
        mascot: {
          type: 'acqua',
          variant: 'hello',
          animation: 'float'
        }
      },
      trackVisibility: true
    }
  ],

  analytics: {
    category: 'Banking',
    trackPageView: true,
    customEvents: {
      'page_section_view': 'banking_section_viewed',
      'cta_click': 'banking_cta_clicked',
      'feature_interaction': 'banking_feature_interacted'
    }
  },

  optimization: {
    preloadAssets: [
      '/assets/mascots/acqua/mascot-acqua-flying.avif',
      '/assets/features/zero-fees.avif',
      '/assets/landing/vault-security.avif'
    ],
    lazyLoadImages: true
  },

  accessibility: {
    skipLinks: true,
    pageHeading: 'Smart Banking Services',
    landmarks: true
  }
};