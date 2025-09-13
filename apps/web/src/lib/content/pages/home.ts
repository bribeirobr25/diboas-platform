import { type PageConfig } from '../types';
import { type SupportedLocale } from '@diboas/i18n/config';

/**
 * Home Page Configuration
 * 
 * Single Source of Truth for home page content across all locales
 * Follows DRY principles with shared content blocks
 */

// DRY Principle: Base configuration that can be extended per locale
const baseHomeConfig: PageConfig = {
  metadata: {
    title: 'diBoaS - Financial Freedom Made Simple',
    description: 'Manage your banking, investing, and DeFi assets all in one secure platform. The future of finance is here, powered by AI-driven insights.',
    keywords: [
      'digital banking',
      'cryptocurrency investing',
      'DeFi platform', 
      'financial freedom',
      'secure banking',
      'crypto trading',
      'investment platform',
      'AI financial advisor'
    ],
    openGraph: {
      title: 'diBoaS - Financial Freedom Made Simple',
      description: 'The future of finance is here. Banking, investing, and DeFi unified in one secure platform.',
      image: '/assets/social/home-og.jpg',
      type: 'website'
    },
    twitter: {
      title: 'diBoaS - Financial Freedom Made Simple',
      description: 'Banking, investing, and DeFi unified in one secure platform.',
      image: '/assets/social/home-twitter.jpg',
      card: 'summary_large_image'
    },
    alternates: {
      en: 'https://diboas.com/en',
      'pt-BR': 'https://diboas.com/pt-BR',
      es: 'https://diboas.com/es',
      de: 'https://diboas.com/de'
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'diBoaS',
      url: 'https://diboas.com',
      logo: 'https://diboas.com/assets/logos/logo-wordmark.avif',
      description: 'Digital financial platform combining banking, investing, and DeFi services',
      sameAs: [
        'https://twitter.com/diboas',
        'https://linkedin.com/company/diboas',
        'https://github.com/diboas'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        email: 'support@diboas.com'
      }
    }
  },

  sections: [
    {
      id: 'home-hero',
      type: 'hero',
      props: {
        variant: 'split',
        background: 'gradient'
      },
      content: {
        title: 'Financial Freedom Made Simple',
        subtitle: 'The Future of Finance is Here',
        description: 'Manage your banking, investing, and DeFi assets all in one place. Powered by AI-driven insights and secured by enterprise-grade technology.',
        cta: {
          primary: {
            text: 'Get Started Free',
            href: '/register',
            variant: 'gradient',
            trackingEvent: 'cta_home_hero_primary',
            utmSource: 'home_page',
            utmMedium: 'hero_section',
            utmCampaign: 'signup'
          },
          secondary: {
            text: 'Learn More',
            href: '#features',
            variant: 'outline',
            trackingEvent: 'cta_home_hero_secondary'
          }
        },
        mascot: {
          type: 'acqua',
          variant: 'flying',
          animation: 'bounce'
        },
        trustIndicators: {
          users: 'Trusted by 50,000+ users worldwide',
          rating: '4.9/5 rating',
          security: 'Bank-level security'
        }
      },
      trackVisibility: true
    },

    {
      id: 'home-features',
      type: 'features',
      props: {
        variant: 'grid',
        background: 'neutral'
      },
      content: {
        title: 'Your Complete Financial Ecosystem',
        subtitle: 'Three powerful domains unified in one platform, each powered by AI-driven mascots to guide your financial journey.',
        items: [
          {
            id: 'banking-domain',
            icon: 'card',
            title: 'Smart Banking',
            description: 'Zero-fee transactions, intelligent budgeting, and instant transfers powered by Acqua, your AI banking assistant.',
            image: '/assets/features/banking-card.avif',
            cta: {
              text: 'Start Banking',
              href: '/banking',
              variant: 'primary',
              trackingEvent: 'cta_home_banking',
              utmSource: 'home_page',
              utmCampaign: 'banking'
            }
          },
          {
            id: 'investing-domain',
            icon: 'chart-growing',
            title: 'Crypto Investing',
            description: 'AI-powered portfolio management with low fees and real-time analytics, guided by Mystic, your investment advisor.',
            image: '/assets/features/investing-card.avif',
            cta: {
              text: 'Start Investing',
              href: '/investing',
              variant: 'primary',
              trackingEvent: 'cta_home_investing',
              utmSource: 'home_page',
              utmCampaign: 'investing'
            }
          },
          {
            id: 'defi-domain',
            icon: 'money-flow',
            title: 'DeFi Protocols',
            description: 'Access decentralized finance with maximum security, yield farming, and staking rewards with Coral, your DeFi expert.',
            image: '/assets/features/defi-card.avif',
            cta: {
              text: 'Explore DeFi',
              href: '/defi',
              variant: 'primary',
              trackingEvent: 'cta_home_defi',
              utmSource: 'home_page',
              utmCampaign: 'defi'
            }
          }
        ],
        layout: 'grid',
        columns: 3
      },
      lazyLoad: true,
      trackVisibility: true
    },

    {
      id: 'home-trust',
      type: 'trust',
      props: {
        variant: 'with-stats',
        background: 'white'
      },
      content: {
        title: 'Your Security is Our Priority',
        subtitle: 'Built with enterprise-grade security and zero-trust architecture to protect your financial future.',
        features: [
          {
            title: 'Bank-Level Security',
            description: 'Your funds are protected by the same security standards used by traditional banks.',
            icon: 'safe-money'
          },
          {
            title: 'Regulatory Compliance',
            description: 'Fully compliant with financial regulations and data protection standards.',
            icon: 'safe-money'
          },
          {
            title: 'Zero-Trust Architecture',
            description: 'Advanced security protocols that verify every transaction and user action.',
            icon: 'safe-money'
          },
          {
            title: '24/7 Monitoring',
            description: 'Continuous monitoring and fraud detection to keep your assets safe.',
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
            number: '50K+',
            label: 'Trusted users'
          },
          {
            number: '256-bit',
            label: 'Encryption standard'
          }
        ],
        certifications: {
          title: 'Certified & Compliant',
          description: 'We maintain the highest standards of security and compliance',
          badges: [
            'SOC 2 Compliant',
            'ISO 27001',
            'GDPR Compliant',
            'PCI DSS Level 1'
          ]
        },
        backgroundImage: '/assets/landing/vault-security.avif'
      },
      lazyLoad: true,
      trackVisibility: true
    },

    {
      id: 'home-cta',
      type: 'cta',
      props: {
        variant: 'centered',
        background: 'gradient-primary'
      },
      content: {
        title: 'Ready to Experience the Future of Finance?',
        subtitle: 'Join thousands who\'ve already made the switch',
        description: 'Get started in minutes and discover how AI-powered financial services can transform your financial life.',
        cta: {
          text: 'Get Started for Free',
          href: '/register',
          variant: 'primary',
          trackingEvent: 'cta_home_final',
          utmSource: 'home_page',
          utmMedium: 'bottom_cta',
          utmCampaign: 'final_conversion'
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
    category: 'Home',
    trackPageView: true,
    customEvents: {
      'page_section_view': 'home_section_viewed',
      'cta_click': 'home_cta_clicked',
      'mascot_interaction': 'home_mascot_interacted'
    }
  },

  optimization: {
    preloadAssets: [
      '/assets/mascots/acqua/mascot-acqua-flying.avif',
      '/assets/features/banking-card.avif',
      '/assets/landing/vault-security.avif'
    ],
    lazyLoadImages: true
  },

  accessibility: {
    skipLinks: true,
    pageHeading: 'diBoaS - Financial Freedom Made Simple',
    landmarks: true
  }
};

// Locale-specific configurations (extending base config)
export const homePageConfig: Record<SupportedLocale, PageConfig> = {
  en: baseHomeConfig,
  
  'pt-BR': {
    ...baseHomeConfig,
    metadata: {
      ...baseHomeConfig.metadata,
      title: 'diBoaS - Liberdade Financeira Simplificada',
      description: 'Gerencie seus ativos bancários, de investimento e DeFi em uma plataforma segura. O futuro das finanças chegou.',
      openGraph: {
        ...baseHomeConfig.metadata.openGraph,
        title: 'diBoaS - Liberdade Financeira Simplificada',
        description: 'O futuro das finanças chegou. Banco, investimentos e DeFi unificados em uma plataforma segura.',
      },
      twitter: {
        ...baseHomeConfig.metadata.twitter,
        title: 'diBoaS - Liberdade Financeira Simplificada',
        description: 'Banco, investimentos e DeFi unificados em uma plataforma segura.',
      }
    },
    // Content would be translated using i18n system
    sections: baseHomeConfig.sections.map(section => ({
      ...section,
      content: {
        ...section.content,
        // Translation keys would be used here in real implementation
        // title: t('hero.title'), etc.
      }
    }))
  },

  es: {
    ...baseHomeConfig,
    metadata: {
      ...baseHomeConfig.metadata,
      title: 'diBoaS - Libertad Financiera Simplificada',
      description: 'Administra tus activos bancarios, de inversión y DeFi en una plataforma segura. El futuro de las finanzas está aquí.',
    }
  },

  de: {
    ...baseHomeConfig,
    metadata: {
      ...baseHomeConfig.metadata,
      title: 'diBoaS - Finanzielle Freiheit Leicht Gemacht',
      description: 'Verwalten Sie Ihre Bank-, Investitions- und DeFi-Assets auf einer sicheren Plattform. Die Zukunft der Finanzen ist da.',
    }
  }
};