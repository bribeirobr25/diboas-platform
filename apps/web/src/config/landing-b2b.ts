/**
 * B2B Landing Page Configuration
 *
 * Domain-Driven Design: B2B treasury landing page domain configuration
 * Service Agnostic Abstraction: Decoupled content from presentation
 * Configuration Management: Centralized landing page content
 */

import { getSocialRealAsset } from './assets';
import type { FAQAccordionVariantConfig, FAQItem } from './faqAccordion';
import type { HeroVariantConfig } from './hero';
import type { FeatureShowcaseVariantConfig } from './featureShowcase';
import type { AppFeaturesCarouselVariantConfig } from './appFeaturesCarousel';
import type { ProductCarouselVariantConfig } from './productCarousel';
import type { BenefitsCardsConfig } from '@/components/Sections/BenefitsCards';

/**
 * Hero Section Configuration for B2B Landing Page
 */
export const B2B_HERO_CONFIG: HeroVariantConfig = {
  variant: 'fullBackground',
  content: {
    title: 'landing-b2b.hero.headline',
    description: 'landing-b2b.hero.valueProp',
    ctaText: 'landing-b2b.hero.cta',
    ctaHref: '#final-cta',
    ctaTarget: '_self'
  },
  backgroundAssets: {
    backgroundImage: getSocialRealAsset('BUSINESS_STRATEGY_WOMAN'),
    backgroundImageMobile: getSocialRealAsset('BUSINESS_STRATEGY_WOMAN'),
    overlayOpacity: 0.5
  },
  seo: {
    titleTag: 'diBoaS Treasury - Earn 6-8% on Startup Operating Cash',
    imageAlt: {
      background: 'Business treasury management illustration'
    }
  },
  analytics: {
    trackingPrefix: 'hero_b2b_landing',
    enabled: true
  }
} as const;

/**
 * Problem Section Configuration (FeatureShowcase)
 * Maps to: Section 1 - The Problem
 */
export const B2B_PROBLEM_CONFIG: FeatureShowcaseVariantConfig = {
  variant: 'default',
  slides: [
    {
      id: 'treasury-problem',
      content: {
        title: 'landing-b2b.problem.header',
        description: 'landing-b2b.problem.body',
        ctaText: 'landing-b2b.problem.cta',
        ctaHref: '#calculator',
        ctaTarget: '_self'
      },
      assets: {
        primaryImage: getSocialRealAsset('BUSINESS_BALANCE')
      },
      seo: {
        imageAlt: 'Business treasury cash flow analysis'
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
    trackingPrefix: 'problem_b2b_landing',
    enabled: true
  }
};

/**
 * Calculator Section Configuration
 * Maps to: Section 2 - Interactive Calculator
 * Note: This requires a custom TreasuryCalculator component
 */
export const B2B_CALCULATOR_CONFIG = {
  content: {
    header: 'landing-b2b.calculator.header',
    cta: 'landing-b2b.calculator.cta',
    ctaHref: '#final-cta'
  },
  defaults: {
    cashOnHand: 500000,
    currentRate: 0.5,
    diboasRate: 7
  },
  analytics: {
    sectionId: 'calculator-b2b',
    category: 'landing-b2b'
  }
} as const;

/**
 * How It Works Section Configuration (AppFeaturesCarousel)
 * Maps to: Section 3 - How it works (4 steps)
 */
export const B2B_HOW_IT_WORKS_CONFIG: AppFeaturesCarouselVariantConfig = {
  variant: 'default',
  sectionTitle: 'landing-b2b.howItWorks.header',
  cards: [
    {
      id: 'step-connect',
      content: {
        title: 'landing-b2b.howItWorks.steps.connect.title',
        description: 'landing-b2b.howItWorks.steps.connect.description',
        ctaText: '',
        ctaHref: '#',
        ctaTarget: '_self'
      },
      assets: {
        image: getSocialRealAsset('BUSINESS_PAYMENT')
      },
      seo: {
        imageAlt: 'Connect business bank account'
      }
    },
    {
      id: 'step-allocate',
      content: {
        title: 'landing-b2b.howItWorks.steps.allocate.title',
        description: 'landing-b2b.howItWorks.steps.allocate.description',
        ctaText: '',
        ctaHref: '#',
        ctaTarget: '_self'
      },
      assets: {
        image: getSocialRealAsset('BUSINESS_BALANCE')
      },
      seo: {
        imageAlt: 'Allocate treasury funds'
      }
    },
    {
      id: 'step-earn',
      content: {
        title: 'landing-b2b.howItWorks.steps.earn.title',
        description: 'landing-b2b.howItWorks.steps.earn.description',
        ctaText: '',
        ctaHref: '#',
        ctaTarget: '_self'
      },
      assets: {
        image: getSocialRealAsset('BUSINESS_INVESTING')
      },
      seo: {
        imageAlt: 'Earn yield on treasury'
      }
    },
    {
      id: 'step-withdraw',
      content: {
        title: 'landing-b2b.howItWorks.steps.withdraw.title',
        description: 'landing-b2b.howItWorks.steps.withdraw.description',
        ctaText: '',
        ctaHref: '#',
        ctaTarget: '_self'
      },
      assets: {
        image: getSocialRealAsset('BUSINESS_SENDING')
      },
      seo: {
        imageAlt: 'Withdraw funds anytime'
      }
    }
  ],
  settings: {
    autoRotateMs: 0,
    pauseOnHover: true,
    enableTouch: true,
    enableAnalytics: true,
    transitionDuration: 300
  },
  analytics: {
    trackingPrefix: 'how_it_works_b2b',
    enabled: true
  }
};

/**
 * Trust & Compliance Section Configuration (BenefitsCards)
 * Maps to: Section 4 - Trust and Compliance (5 trust points)
 */
export const B2B_TRUST_CONFIG: BenefitsCardsConfig = {
  section: {
    title: 'landing-b2b.trust.header',
    description: '',
    backgroundColor: 'light-purple'
  },
  cards: [
    {
      id: 'eu-regulated',
      icon: '/assets/icons/safe-money.avif',
      title: 'landing-b2b.trust.points.euRegulated.title',
      description: 'landing-b2b.trust.points.euRegulated.description',
      iconAlt: 'EU regulated icon'
    },
    {
      id: 'non-custodial',
      icon: '/assets/icons/money-circle.avif',
      title: 'landing-b2b.trust.points.nonCustodial.title',
      description: 'landing-b2b.trust.points.nonCustodial.description',
      iconAlt: 'Non-custodial icon'
    },
    {
      id: 'audited',
      icon: '/assets/icons/learn-certificate.avif',
      title: 'landing-b2b.trust.points.audited.title',
      description: 'landing-b2b.trust.points.audited.description',
      iconAlt: 'Audited protocols icon'
    },
    {
      id: 'transparent',
      icon: '/assets/icons/chart-growing.avif',
      title: 'landing-b2b.trust.points.transparent.title',
      description: 'landing-b2b.trust.points.transparent.description',
      iconAlt: 'Transparent reporting icon'
    },
    {
      id: 'board-ready',
      icon: '/assets/icons/learn-read.avif',
      title: 'landing-b2b.trust.points.boardReady.title',
      description: 'landing-b2b.trust.points.boardReady.description',
      iconAlt: 'Board-ready documentation icon'
    }
  ],
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'Trust and compliance features'
  },
  analytics: {
    sectionId: 'trust-compliance-b2b',
    category: 'landing-b2b'
  }
};

/**
 * Use Cases Section Configuration (ProductCarousel)
 * Maps to: Section 5 - Use Cases (3 cases)
 */
export const B2B_USE_CASES_CONFIG: ProductCarouselVariantConfig = {
  variant: 'default',
  content: {
    heading: 'landing-b2b.useCases.header',
    slides: [
      {
        id: 'post-fundraise',
        title: 'landing-b2b.useCases.cases.postFundraise.title',
        subtitle: 'landing-b2b.useCases.cases.postFundraise.description',
        image: getSocialRealAsset('BUSINESS_DEAL'),
        imageAlt: 'Post-fundraise treasury management'
      },
      {
        id: 'between-rounds',
        title: 'landing-b2b.useCases.cases.betweenRounds.title',
        subtitle: 'landing-b2b.useCases.cases.betweenRounds.description',
        image: getSocialRealAsset('BUSINESS_STRATEGY_WOMAN'),
        imageAlt: 'Between funding rounds'
      },
      {
        id: 'operating-reserves',
        title: 'landing-b2b.useCases.cases.operatingReserves.title',
        subtitle: 'landing-b2b.useCases.cases.operatingReserves.description',
        image: getSocialRealAsset('BUSINESS_BALANCE'),
        imageAlt: 'Operating reserves management'
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
    ariaLabel: 'Treasury use cases'
  },
  analytics: {
    trackingPrefix: 'use_cases_b2b',
    enabled: true
  }
};

/**
 * Social Proof Section Configuration (BenefitsCards)
 * Maps to: Section 6 - Social Proof (metrics)
 */
export const B2B_SOCIAL_PROOF_CONFIG: BenefitsCardsConfig = {
  section: {
    title: 'landing-b2b.socialProof.header',
    description: '',
    backgroundColor: 'white'
  },
  cards: [
    {
      id: 'treasury-managed',
      icon: '/assets/icons/money-flow.avif',
      title: 'landing-b2b.socialProof.metrics.treasury.value',
      description: 'landing-b2b.socialProof.metrics.treasury.label',
      iconAlt: 'Treasury icon'
    },
    {
      id: 'avg-yield',
      icon: '/assets/icons/chart-growing.avif',
      title: 'landing-b2b.socialProof.metrics.yield.value',
      description: 'landing-b2b.socialProof.metrics.yield.label',
      iconAlt: 'Yield icon'
    },
    {
      id: 'onboarding-time',
      icon: '/assets/icons/rewards-trophy.avif',
      title: 'landing-b2b.socialProof.metrics.onboarding.value',
      description: 'landing-b2b.socialProof.metrics.onboarding.label',
      iconAlt: 'Onboarding icon'
    }
  ],
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'Social proof and metrics'
  },
  analytics: {
    sectionId: 'social-proof-b2b',
    category: 'landing-b2b'
  }
};

/**
 * FAQ Items for B2B Landing Page
 */
export const B2B_FAQ_ITEMS: FAQItem[] = [
  {
    id: 'catch',
    question: 'landing-b2b.faq.items.catch.question',
    answer: 'landing-b2b.faq.items.catch.answer',
    category: 'general'
  },
  {
    id: 'liquidity',
    question: 'landing-b2b.faq.items.liquidity.question',
    answer: 'landing-b2b.faq.items.liquidity.answer',
    category: 'operations'
  },
  {
    id: 'risk',
    question: 'landing-b2b.faq.items.risk.question',
    answer: 'landing-b2b.faq.items.risk.answer',
    category: 'security'
  },
  {
    id: 'cfo',
    question: 'landing-b2b.faq.items.cfo.question',
    answer: 'landing-b2b.faq.items.cfo.answer',
    category: 'general'
  },
  {
    id: 'revenue',
    question: 'landing-b2b.faq.items.revenue.question',
    answer: 'landing-b2b.faq.items.revenue.answer',
    category: 'fees'
  },
  {
    id: 'minimum',
    question: 'landing-b2b.faq.items.minimum.question',
    answer: 'landing-b2b.faq.items.minimum.answer',
    category: 'getting-started'
  },
  {
    id: 'onboarding',
    question: 'landing-b2b.faq.items.onboarding.question',
    answer: 'landing-b2b.faq.items.onboarding.answer',
    category: 'getting-started'
  },
  {
    id: 'regulated',
    question: 'landing-b2b.faq.items.regulated.question',
    answer: 'landing-b2b.faq.items.regulated.answer',
    category: 'compliance'
  },
  {
    id: 'investors',
    question: 'landing-b2b.faq.items.investors.question',
    answer: 'landing-b2b.faq.items.investors.answer',
    category: 'general'
  },
  {
    id: 'compliance',
    question: 'landing-b2b.faq.items.compliance.question',
    answer: 'landing-b2b.faq.items.compliance.answer',
    category: 'compliance'
  }
];

/**
 * FAQ Section Configuration
 * Maps to: Section 7 - FAQ
 */
export const B2B_FAQ_CONFIG: FAQAccordionVariantConfig = {
  variant: 'default',
  content: {
    title: 'landing-b2b.faq.header',
    description: 'landing-b2b.faq.description',
    ctaText: 'landing-b2b.faq.ctaText',
    ctaHref: '#final-cta',
    items: B2B_FAQ_ITEMS
  },
  settings: {
    enableAnimations: true,
    animationDuration: 400,
    autoClose: true,
    enableKeyboardNav: true,
    scrollIntoView: true
  },
  seo: {
    ariaLabel: 'Frequently asked questions for founders',
    region: 'faq'
  },
  analytics: {
    trackingPrefix: 'faq_b2b_landing',
    enabled: true
  }
};

/**
 * Process Section Configuration (AppFeaturesCarousel)
 * Maps to: Section 8 - The Process (4 steps)
 */
export const B2B_PROCESS_CONFIG: AppFeaturesCarouselVariantConfig = {
  variant: 'default',
  sectionTitle: 'landing-b2b.process.header',
  cards: [
    {
      id: 'process-book',
      content: {
        title: 'landing-b2b.process.steps.book.title',
        description: 'landing-b2b.process.steps.book.description',
        ctaText: '',
        ctaHref: '#',
        ctaTarget: '_self'
      },
      assets: {
        image: getSocialRealAsset('BUSINESS_DEAL')
      },
      seo: {
        imageAlt: 'Book a call'
      }
    },
    {
      id: 'process-review',
      content: {
        title: 'landing-b2b.process.steps.review.title',
        description: 'landing-b2b.process.steps.review.description',
        ctaText: '',
        ctaHref: '#',
        ctaTarget: '_self'
      },
      assets: {
        image: getSocialRealAsset('BUSINESS_PAYMENT')
      },
      seo: {
        imageAlt: 'Review the numbers'
      }
    },
    {
      id: 'process-decide',
      content: {
        title: 'landing-b2b.process.steps.decide.title',
        description: 'landing-b2b.process.steps.decide.description',
        ctaText: '',
        ctaHref: '#',
        ctaTarget: '_self'
      },
      assets: {
        image: getSocialRealAsset('BUSINESS_DEAL')
      },
      seo: {
        imageAlt: 'Make a decision'
      }
    },
    {
      id: 'process-golive',
      content: {
        title: 'landing-b2b.process.steps.goLive.title',
        description: 'landing-b2b.process.steps.goLive.description',
        ctaText: '',
        ctaHref: '#',
        ctaTarget: '_self'
      },
      assets: {
        image: getSocialRealAsset('BUSINESS_INVESTING')
      },
      seo: {
        imageAlt: 'Go live'
      }
    }
  ],
  settings: {
    autoRotateMs: 0,
    pauseOnHover: true,
    enableTouch: true,
    enableAnalytics: true,
    transitionDuration: 300
  },
  analytics: {
    trackingPrefix: 'process_b2b',
    enabled: true
  }
};

/**
 * Final CTA Section Configuration (FeatureShowcase)
 * Maps to: Section 9 - Final CTA
 */
export const B2B_FINAL_CTA_CONFIG: FeatureShowcaseVariantConfig = {
  variant: 'default',
  slides: [
    {
      id: 'final-cta',
      content: {
        title: 'landing-b2b.finalCta.header',
        description: 'landing-b2b.finalCta.body',
        ctaText: 'landing-b2b.finalCta.cta',
        ctaHref: 'https://cal.com/diboas/treasury-conversation',
        ctaTarget: '_blank'
      },
      assets: {
        primaryImage: getSocialRealAsset('BUSINESS_INVESTING')
      },
      seo: {
        imageAlt: 'Book a treasury conversation'
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
    trackingPrefix: 'final_cta_b2b',
    enabled: true
  }
};

/**
 * Why We Built This Section Configuration (FeatureShowcase)
 * Maps to: Section 2 - Why We Built This (Mission Story)
 */
export const B2B_WHY_WE_BUILT_THIS_CONFIG: FeatureShowcaseVariantConfig = {
  variant: 'default',
  slides: [
    {
      id: 'why-we-built-this',
      content: {
        title: 'landing-b2b.whyWeBuiltThis.header',
        description: 'landing-b2b.whyWeBuiltThis.story',
        ctaText: '',
        ctaHref: '#',
        ctaTarget: '_self'
      },
      assets: {
        primaryImage: getSocialRealAsset('BUSINESS_OWNER')
      },
      seo: {
        imageAlt: 'diBoaS founder story'
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
    trackingPrefix: 'why_we_built_this_b2b',
    enabled: true
  }
};

/**
 * Who Is This For Section Configuration (BenefitsCards)
 * Maps to: Section 6 - Who Is This For (Good Fit / Not a Fit)
 */
export const B2B_WHO_IS_THIS_FOR_CONFIG: BenefitsCardsConfig = {
  section: {
    title: 'landing-b2b.whoIsThisFor.header',
    description: 'landing-b2b.whoIsThisFor.honestNote',
    backgroundColor: 'light-purple'
  },
  cards: [
    {
      id: 'good-fit-1',
      icon: '/assets/icons/money-circle.avif',
      title: 'landing-b2b.whoIsThisFor.goodFit.title',
      description: 'landing-b2b.whoIsThisFor.goodFit.description',
      iconAlt: 'Good fit checkmark'
    },
    {
      id: 'not-a-fit-1',
      icon: '/assets/icons/safe-money.avif',
      title: 'landing-b2b.whoIsThisFor.notAFit.title',
      description: 'landing-b2b.whoIsThisFor.notAFit.description',
      iconAlt: 'Not a fit icon'
    }
  ],
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'Who is diBoaS Treasury right for'
  },
  analytics: {
    sectionId: 'who-is-this-for-b2b',
    category: 'landing-b2b'
  }
};

/**
 * Mission Footer Section Configuration (FeatureShowcase)
 * Maps to: Section 10 - Mission Footer
 */
export const B2B_MISSION_FOOTER_CONFIG: FeatureShowcaseVariantConfig = {
  variant: 'default',
  slides: [
    {
      id: 'mission-footer',
      content: {
        title: 'landing-b2b.missionFooter.header',
        description: 'landing-b2b.missionFooter.body',
        ctaText: '',
        ctaHref: '#',
        ctaTarget: '_self'
      },
      assets: {
        primaryImage: getSocialRealAsset('BUSINESS_STRATEGY_WOMAN')
      },
      seo: {
        imageAlt: 'diBoaS mission'
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
    trackingPrefix: 'mission_footer_b2b',
    enabled: true
  }
};

/**
 * Risk Disclaimer Configuration
 */
export const B2B_DISCLAIMER_KEY = 'landing-b2b.disclaimer.text';
