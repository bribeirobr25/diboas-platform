/**
 * Benefits Page FeatureShowcase Configuration
 *
 * Domain-Driven Design: Benefits-specific showcase configuration
 * Service Agnostic Abstraction: Decoupled configuration following FeatureShowcase pattern
 * No Hardcoded Values: Configurable through interfaces
 * DRY Principles: Uses centralized ROUTES configuration for all links
 */

import type { FeatureShowcaseSlide, FeatureShowcaseVariantConfig } from './featureShowcase';
import { ROUTES } from './routes';

// Benefits-specific showcase slides
// Note: Titles, descriptions, and CTA text are translation keys that will be resolved at runtime
// DRY Principles: All links use centralized ROUTES configuration
export const BENEFITS_SHOWCASE_SLIDES: FeatureShowcaseSlide[] = [
  {
    id: 'exclusive-rewards',
    content: {
      title: 'marketing.benefits.exclusiveRewards.title',
      description: 'marketing.benefits.exclusiveRewards.description',
      ctaText: 'marketing.benefits.exclusiveRewards.ctaText',
      ctaHref: ROUTES.REWARDS.BENEFITS,
      ctaTarget: '_self'
    },
    assets: {
      primaryImage: '/assets/socials/real/rewards-with-icon.avif'
    },
    seo: {
      imageAlt: 'Visual representation of rewards and benefits'
    }
  },
  {
    id: 'financial-freedom',
    content: {
      title: 'marketing.benefits.financialFreedom.title',
      description: 'marketing.benefits.financialFreedom.description',
      ctaText: 'marketing.benefits.financialFreedom.ctaText',
      ctaHref: ROUTES.ACCOUNT,
      ctaTarget: '_self'
    },
    assets: {
      primaryImage: '/assets/socials/real/couple.avif'
    },
    seo: {
      imageAlt: 'Couple enjoying financial freedom'
    }
  },
  {
    id: 'smart-investing',
    content: {
      title: 'marketing.benefits.smartInvesting.title',
      description: 'marketing.benefits.smartInvesting.description',
      ctaText: 'common.buttons.learnMore',
      ctaHref: ROUTES.INVESTING,
      ctaTarget: '_self'
    },
    assets: {
      primaryImage: '/assets/socials/real/investing-with-icon.avif'
    },
    seo: {
      imageAlt: 'Investment growth visualization'
    }
  },
  {
    id: 'secure-banking',
    content: {
      title: 'marketing.benefits.secureBanking.title',
      description: 'marketing.benefits.secureBanking.description',
      ctaText: 'marketing.benefits.secureBanking.ctaText',
      ctaHref: ROUTES.SECURITY.BENEFITS,
      ctaTarget: '_self'
    },
    assets: {
      primaryImage: '/assets/socials/real/secure-with-icon.avif'
    },
    seo: {
      imageAlt: 'Security shield illustration'
    }
  }
] as const;

// Benefits showcase configuration
export const BENEFITS_SHOWCASE_CONFIG: FeatureShowcaseVariantConfig = {
  variant: 'benefits',
  slides: BENEFITS_SHOWCASE_SLIDES,
  settings: {
    showNavigation: true,
    showDots: true,
    enableAnalytics: true,
    transitionDuration: 500,
    performance: {
      preloadSlideCount: 2,
      imageLoadingTimeout: 3000,
      navigationThrottleMs: 150
    }
  },
  analytics: {
    enabled: true,
    trackingPrefix: 'feature_showcase_benefits',
    eventSuffixes: {
      navigation: 'navigation_used',
      ctaClick: 'cta_clicked'
    }
  }
} as const;