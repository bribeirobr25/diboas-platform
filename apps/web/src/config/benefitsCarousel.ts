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
import { getSocialRealAsset } from './assets';

// Benefits-specific showcase slides
// Note: Titles, descriptions, and CTA text are translation keys that will be resolved at runtime
// DRY Principles: All links use centralized ROUTES configuration
// No Hardcoded Values: Uses getSocialRealAsset() helper for type-safe asset paths
export const BENEFITS_SHOWCASE_SLIDES: FeatureShowcaseSlide[] = [
  {
    id: 'exclusive-rewards',
    content: {
      title: 'marketing.pages.whyDiboas.carousel.exclusiveRewards.title',
      description: 'marketing.pages.whyDiboas.carousel.exclusiveRewards.description',
      ctaText: 'marketing.pages.whyDiboas.carousel.exclusiveRewards.ctaText',
      ctaHref: ROUTES.REWARDS.OVERVIEW,
      ctaTarget: '_self'
    },
    assets: {
      primaryImage: getSocialRealAsset('REWARDS_ICON')
    },
    seo: {
      imageAlt: 'Visual representation of rewards and benefits'
    }
  },
  {
    id: 'financial-freedom',
    content: {
      title: 'marketing.pages.whyDiboas.carousel.financialFreedom.title',
      description: 'marketing.pages.whyDiboas.carousel.financialFreedom.description',
      ctaText: 'marketing.pages.whyDiboas.carousel.financialFreedom.ctaText',
      ctaHref: ROUTES.PERSONAL.ACCOUNT,
      ctaTarget: '_self'
    },
    assets: {
      primaryImage: getSocialRealAsset('LIFE_COUPLE')
    },
    seo: {
      imageAlt: 'Couple enjoying financial freedom'
    }
  },
  {
    id: 'smart-investing',
    content: {
      title: 'marketing.pages.whyDiboas.carousel.smartInvesting.title',
      description: 'marketing.pages.whyDiboas.carousel.smartInvesting.description',
      ctaText: 'common.buttons.learnMore',
      ctaHref: ROUTES.PERSONAL.INVESTING,
      ctaTarget: '_self'
    },
    assets: {
      primaryImage: getSocialRealAsset('INVESTING_WOMAN')
    },
    seo: {
      imageAlt: 'Investment growth visualization'
    }
  },
  {
    id: 'secure-banking',
    content: {
      title: 'marketing.pages.whyDiboas.carousel.secureBanking.title',
      description: 'marketing.pages.whyDiboas.carousel.secureBanking.description',
      ctaText: 'marketing.pages.whyDiboas.carousel.secureBanking.ctaText',
      ctaHref: ROUTES.SECURITY.PROTECTION,
      ctaTarget: '_self'
    },
    assets: {
      primaryImage: getSocialRealAsset('SECURITY_MODERN')
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