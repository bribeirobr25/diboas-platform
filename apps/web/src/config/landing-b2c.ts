/**
 * B2C Landing Page Configuration
 *
 * Domain-Driven Design: B2C landing page domain configuration
 * Service Agnostic Abstraction: Decoupled content from presentation
 * Configuration Management: Centralized landing page content
 */

import { getSocialRealAsset, getPhoneDepositAsset, getPhoneGrowAsset, getPhoneWithdrawAsset } from './assets';
import { ROUTES } from './routes';
import { InteractiveDemo } from '@/components/InteractiveDemo';
import type { FAQAccordionVariantConfig, FAQItem } from './faqAccordion';
import type { HeroVariantConfig } from './hero';
import type { FeatureShowcaseVariantConfig } from './featureShowcase';
import type { ProductCarouselVariantConfig } from './productCarousel';
import type { BgHighlightConfig } from '@/components/Sections/BgHighlight';
import type { DemoEmbedConfig } from '@/components/Sections/DemoEmbed';
import type { BenefitsCardsConfig } from '@/components/Sections/BenefitsCards';

/**
 * Hero Section Configuration for B2C Landing Page
 */
export const B2C_HERO_CONFIG: HeroVariantConfig = {
  variant: 'fullBackground',
  content: {
    title: 'landing-b2c.hero.headline',
    description: 'landing-b2c.hero.subheadline',
    ctaText: 'landing-b2c.hero.cta',
    ctaHref: '#waitlist',
    ctaTarget: '_self'
  },
  backgroundAssets: {
    backgroundImage: getSocialRealAsset('LIFE_NATURE'),
    backgroundImageMobile: getSocialRealAsset('LIFE_NATURE'),
    overlayOpacity: 0.4
  },
  seo: {
    titleTag: 'diBoaS - Make Your Money Work',
    imageAlt: {
      background: 'Financial growth background illustration'
    }
  },
  analytics: {
    trackingPrefix: 'hero_b2c_landing',
    enabled: true
  }
} as const;

/**
 * Problem Section Configuration (FeatureShowcase)
 * Maps to: Section 1 - The Problem
 */
export const B2C_PROBLEM_CONFIG: FeatureShowcaseVariantConfig = {
  variant: 'default',
  slides: [
    {
      id: 'problem-savings',
      content: {
        title: 'landing-b2c.problem.header',
        description: 'landing-b2c.problem.body',
        ctaText: 'landing-b2c.problem.cta',
        ctaHref: '#how-it-works',
        ctaTarget: '_self'
      },
      assets: {
        primaryImage: getSocialRealAsset('INVESTMENT_MAN_TATTOO')
      },
      seo: {
        imageAlt: 'The problem with traditional savings'
      }
    }
  ],
  settings: {
    showNavigation: false,
    showDots: false,
    enableAnalytics: true,
    transitionDuration: 250
  },
  analytics: {
    trackingPrefix: 'problem_b2c_landing',
    enabled: true
  }
};

/**
 * How It Works Section Configuration (ProductCarousel)
 * Maps to: Section 2 - How it works
 */
export const B2C_HOW_IT_WORKS_CONFIG: ProductCarouselVariantConfig = {
  variant: 'default',
  content: {
    heading: 'landing-b2c.howItWorks.header',
    slides: [
      {
        id: 'step-1-deposit',
        title: 'landing-b2c.howItWorks.step1.title',
        subtitle: 'landing-b2c.howItWorks.step1.description',
        image: getPhoneDepositAsset(),
        imageAlt: 'Step 1: Deposit funds'
      },
      {
        id: 'step-2-earn',
        title: 'landing-b2c.howItWorks.step2.title',
        subtitle: 'landing-b2c.howItWorks.step2.description',
        image: getPhoneGrowAsset(),
        imageAlt: 'Step 2: Earn yield'
      },
      {
        id: 'step-3-withdraw',
        title: 'landing-b2c.howItWorks.step3.title',
        subtitle: 'landing-b2c.howItWorks.step3.description',
        image: getPhoneWithdrawAsset(),
        imageAlt: 'Step 3: Withdraw anytime'
      }
    ]
  },
  settings: {
    autoPlay: false,
    autoPlayInterval: 5000,
    transitionDuration: 500,
    pauseOnHover: true,
    enableKeyboard: true,
    enableTouch: true,
    enableDots: true,
    enablePlayPause: false
  },
  seo: {
    headingTag: 'h2',
    ariaLabel: 'How diBoaS works'
  },
  analytics: {
    trackingPrefix: 'how_it_works_b2c',
    enabled: true
  }
};

/**
 * Feature Showcase Section Configuration (BenefitsCards)
 * Maps to: Section 5 - Feature Showcase (EARN, SEND, INVEST, GOALS)
 */
export const B2C_FEATURES_CONFIG: BenefitsCardsConfig = {
  section: {
    title: 'landing-b2c.features.header',
    description: 'landing-b2c.features.intro',
    backgroundColor: 'light-purple'
  },
  cards: [
    {
      id: 'feature-earn',
      icon: '/assets/icons/chart-growing.avif',
      title: 'landing-b2c.features.earn.headline',
      description: 'landing-b2c.features.earn.body',
      iconAlt: 'Earnings growth chart'
    },
    {
      id: 'feature-send',
      icon: '/assets/icons/rewards-medal.avif',
      title: 'landing-b2c.features.send.headline',
      description: 'landing-b2c.features.send.body',
      iconAlt: 'Send money instantly'
    },
    {
      id: 'feature-invest',
      icon: '/assets/icons/chart-growing.avif',
      title: 'landing-b2c.features.invest.headline',
      description: 'landing-b2c.features.invest.body',
      iconAlt: 'Global investments'
    },
    {
      id: 'feature-goals',
      icon: '/assets/icons/rewards-medal.avif',
      title: 'landing-b2c.features.goals.headline',
      description: 'landing-b2c.features.goals.body',
      iconAlt: 'Savings goals'
    }
  ],
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'diBoaS features overview'
  },
  analytics: {
    sectionId: 'features-b2c',
    category: 'landing-b2c'
  }
};

/**
 * Why We Built This Section Configuration (FeatureShowcase)
 * Maps to: Section 3 - Origin Story
 */
export const B2C_ORIGIN_STORY_CONFIG: FeatureShowcaseVariantConfig = {
  variant: 'default',
  slides: [
    {
      id: 'origin-story',
      content: {
        title: 'landing-b2c.whyWeBuiltThis.header',
        description: 'landing-b2c.whyWeBuiltThis.story',
        ctaText: 'landing-b2c.whyWeBuiltThis.signature',
        ctaHref: '#waitlist',
        ctaTarget: '_self'
      },
      assets: {
        primaryImage: getSocialRealAsset('LIFE_FAMILY_BIKE')
      },
      seo: {
        imageAlt: 'Founder story - Building for ordinary people'
      }
    }
  ],
  settings: {
    showNavigation: false,
    showDots: false,
    enableAnalytics: true,
    transitionDuration: 250
  },
  analytics: {
    trackingPrefix: 'origin_story_b2c_landing',
    enabled: true
  }
};

/**
 * Social Proof Section Configuration (BenefitsCards)
 * Maps to: Section 4 - Social Proof
 */
export const B2C_SOCIAL_PROOF_CONFIG: BenefitsCardsConfig = {
  section: {
    title: 'landing-b2c.socialProof.header',
    description: '',
    backgroundColor: 'light-purple'
  },
  cards: [
    {
      id: 'waitlist-count',
      icon: '/assets/icons/chart-growing.avif',
      title: 'landing-b2c.socialProof.stats.waitlist',
      description: '',
      iconAlt: 'Growth chart icon'
    },
    {
      id: 'countries-count',
      icon: '/assets/icons/rewards-medal.avif',
      title: 'landing-b2c.socialProof.stats.countries',
      description: '',
      iconAlt: 'Medal icon'
    }
  ],
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'Social proof and waitlist statistics'
  },
  analytics: {
    sectionId: 'social-proof-b2c',
    category: 'landing-b2c'
  }
};

/**
 * Demo Section Configuration
 * Maps to: Section 4 - Demo Embed
 */
export const B2C_DEMO_CONFIG: DemoEmbedConfig = {
  content: {
    header: 'landing-b2c.demo.header',
    subtext: 'landing-b2c.demo.subtext'
  },
  demo: {
    component: InteractiveDemo
  },
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'Interactive demo section'
  },
  analytics: {
    sectionId: 'demo-section-b2c',
    category: 'landing-b2c'
  }
};

/**
 * FAQ Items for B2C Landing Page
 */
export const B2C_FAQ_ITEMS: FAQItem[] = [
  {
    id: 'safety',
    question: 'landing-b2c.faq.items.safety.question',
    answer: 'landing-b2c.faq.items.safety.answer',
    category: 'security'
  },
  {
    id: 'risks',
    question: 'landing-b2c.faq.items.risks.question',
    answer: 'landing-b2c.faq.items.risks.answer',
    category: 'security'
  },
  {
    id: 'withdraw',
    question: 'landing-b2c.faq.items.withdraw.question',
    answer: 'landing-b2c.faq.items.withdraw.answer',
    category: 'getting-started'
  },
  {
    id: 'revenue',
    question: 'landing-b2c.faq.items.revenue.question',
    answer: 'landing-b2c.faq.items.revenue.answer',
    category: 'fees'
  },
  {
    id: 'trust',
    question: 'landing-b2c.faq.items.trust.question',
    answer: 'landing-b2c.faq.items.trust.answer',
    category: 'security'
  },
  {
    id: 'strategies',
    question: 'landing-b2c.faq.items.strategies.question',
    answer: 'landing-b2c.faq.items.strategies.answer',
    category: 'getting-started'
  }
];

/**
 * FAQ Section Configuration
 * Maps to: Section 5 - FAQ
 */
export const B2C_FAQ_CONFIG: FAQAccordionVariantConfig = {
  variant: 'default',
  content: {
    title: 'landing-b2c.faq.header',
    description: 'landing-b2c.faq.description',
    ctaText: 'landing-b2c.faq.ctaText',
    ctaHref: '#waitlist',
    items: B2C_FAQ_ITEMS
  },
  settings: {
    enableAnimations: true,
    animationDuration: 400,
    autoClose: true,
    enableKeyboardNav: true,
    scrollIntoView: true
  },
  seo: {
    ariaLabel: 'Frequently asked questions',
    region: 'faq'
  },
  analytics: {
    trackingPrefix: 'faq_b2c_landing',
    enabled: true
  }
};

/**
 * Final CTA Section Configuration (BgHighlight)
 * Maps to: Section 6 - Final CTA
 */
export const B2C_FINAL_CTA_CONFIG: BgHighlightConfig = {
  backgroundImage: {
    src: getSocialRealAsset('LIFE_NATURE'),
    alt: 'landing-b2c.finalCta.header'
  },
  content: {
    title: 'landing-b2c.finalCta.header',
    description: 'landing-b2c.finalCta.body',
    ctaText: 'landing-b2c.finalCta.button',
    ctaHref: '#waitlist'
  },
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'Final call to action'
  },
  analytics: {
    sectionId: 'final-cta-b2c',
    category: 'landing-b2c'
  }
} as const;

/**
 * Risk Disclaimer Configuration
 */
export const B2C_DISCLAIMER_KEY = 'landing-b2c.footer.riskDisclaimer';
