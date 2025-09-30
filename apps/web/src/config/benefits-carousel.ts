/**
 * Benefits Page FeatureShowcase Configuration
 * 
 * Domain-Driven Design: Benefits-specific showcase configuration
 * Service Agnostic Abstraction: Decoupled configuration following FeatureShowcase pattern
 * No Hardcoded Values: Configurable through interfaces
 */

import type { FeatureShowcaseSlide, FeatureShowcaseVariantConfig } from './featureShowcase';

// Benefits-specific showcase slides
export const BENEFITS_SHOWCASE_SLIDES: FeatureShowcaseSlide[] = [
  {
    id: 'exclusive-rewards',
    content: {
      title: 'Exclusive Rewards',
      description: 'Earn points on every transaction and unlock premium perks',
      ctaText: 'Explore Rewards',
      ctaHref: '/rewards',
      ctaTarget: '_self'
    },
    assets: {
      primaryImage: '/assets/socials/real/rewards-with-icon.avif',
      secondaryImage: '/assets/socials/real/rewards-with-icon.avif'
    },
    seo: {
      imageAlt: {
        primary: 'Visual representation of rewards and benefits',
        secondary: 'Rewards secondary image'
      }
    },
    showSecondaryImage: false
  },
  {
    id: 'financial-freedom',
    content: {
      title: 'Financial Freedom',
      description: 'Take control with tools designed for your success',
      ctaText: 'Start Your Journey',
      ctaHref: '/account',
      ctaTarget: '_self'
    },
    assets: {
      primaryImage: '/assets/socials/real/couple.avif',
      secondaryImage: '/assets/socials/real/couple.avif'
    },
    seo: {
      imageAlt: {
        primary: 'Couple enjoying financial freedom',
        secondary: 'Financial freedom secondary image'
      }
    },
    showSecondaryImage: false
  },
  {
    id: 'smart-investing',
    content: {
      title: 'Smart Investing',
      description: 'Grow your wealth with intelligent investment options',
      ctaText: 'Learn More',
      ctaHref: '/investing',
      ctaTarget: '_self'
    },
    assets: {
      primaryImage: '/assets/socials/real/investing-with-icon.avif',
      secondaryImage: '/assets/socials/real/investing-with-icon.avif'
    },
    seo: {
      imageAlt: {
        primary: 'Investment growth visualization',
        secondary: 'Investment secondary image'
      }
    },
    showSecondaryImage: false
  },
  {
    id: 'secure-banking',
    content: {
      title: 'Secure Banking',
      description: 'Bank-grade security with complete transparency',
      ctaText: 'Security Details',
      ctaHref: '/security',
      ctaTarget: '_self'
    },
    assets: {
      primaryImage: '/assets/socials/real/secure-with-icon.avif',
      secondaryImage: '/assets/socials/real/secure-with-icon.avif'
    },
    seo: {
      imageAlt: {
        primary: 'Security shield illustration',
        secondary: 'Security secondary image'
      }
    },
    showSecondaryImage: false
  }
] as const;

// Benefits showcase configuration
export const BENEFITS_SHOWCASE_CONFIG: FeatureShowcaseVariantConfig = {
  variant: 'default',
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