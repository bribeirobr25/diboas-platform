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
 * The Math Section Configuration (FeatureShowcase)
 * Maps to: Section 2 - The Math (comparison table)
 */
export const B2B_THE_MATH_CONFIG: FeatureShowcaseVariantConfig = {
  variant: 'default',
  slides: [
    {
      id: 'the-math',
      content: {
        title: 'landing-b2b.theMath.header',
        description: 'landing-b2b.theMath.intro',
        ctaText: 'landing-b2b.theMath.cta',
        ctaHref: '#calculator',
        ctaTarget: '_self'
      },
      assets: {
        primaryImage: getSocialRealAsset('BUSINESS_CHARTS')
      },
      seo: {
        imageAlt: 'Business treasury comparison analysis'
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
    trackingPrefix: 'the_math_b2b_landing',
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
        description: 'landing-b2b.howItWorks.steps.connect.description'
      },
      assets: {
        image: getSocialRealAsset('BUSINESS_PAYMENT')
      },
      seo: {
        imageAlt: 'Connect business bank account'
      }
    },
    {
      id: 'step-set-floor',
      content: {
        title: 'landing-b2b.howItWorks.steps.setFloor.title',
        description: 'landing-b2b.howItWorks.steps.setFloor.description'
      },
      assets: {
        image: getSocialRealAsset('BUSINESS_BALANCE')
      },
      seo: {
        imageAlt: 'Set liquidity threshold'
      }
    },
    {
      id: 'step-earn',
      content: {
        title: 'landing-b2b.howItWorks.steps.earn.title',
        description: 'landing-b2b.howItWorks.steps.earn.description'
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
        description: 'landing-b2b.howItWorks.steps.withdraw.description'
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
 * More Than Yield Section Configuration (BenefitsCards)
 * Maps to: Section 6 - More Than Yield (4 features)
 */
export const B2B_FEATURES_CONFIG: BenefitsCardsConfig = {
  section: {
    title: 'landing-b2b.features.header',
    description: 'landing-b2b.features.intro',
    backgroundColor: 'light-purple'
  },
  cards: [
    {
      id: 'feature-instant-payments',
      icon: '/assets/icons/money-flow.avif',
      title: 'landing-b2b.features.instantPayments.headline',
      description: 'landing-b2b.features.instantPayments.body',
      iconAlt: 'Instant payments icon'
    },
    {
      id: 'feature-receive-payments',
      icon: '/assets/icons/money-circle.avif',
      title: 'landing-b2b.features.receivePayments.headline',
      description: 'landing-b2b.features.receivePayments.body',
      iconAlt: 'Receive payments icon'
    },
    {
      id: 'feature-cashflow',
      icon: '/assets/icons/chart-growing.avif',
      title: 'landing-b2b.features.cashflowOptimization.headline',
      description: 'landing-b2b.features.cashflowOptimization.body',
      iconAlt: 'Cashflow optimization icon'
    },
    {
      id: 'feature-overnight-sweep',
      icon: '/assets/icons/safe-money.avif',
      title: 'landing-b2b.features.overnightSweep.headline',
      description: 'landing-b2b.features.overnightSweep.body',
      iconAlt: 'Overnight sweep icon'
    }
  ],
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'Treasury features beyond yield'
  },
  analytics: {
    sectionId: 'features-b2b',
    category: 'landing-b2b'
  }
};

/**
 * Trust & Compliance Section Configuration (BenefitsCards)
 * Maps to: Section 7 - Trust and Compliance
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
      title: 'landing-b2b.trust.euRegulated.title',
      description: 'landing-b2b.trust.euRegulated.description',
      iconAlt: 'EU regulated icon'
    },
    {
      id: 'non-custodial',
      icon: '/assets/icons/money-circle.avif',
      title: 'landing-b2b.trust.nonCustodial.title',
      description: 'landing-b2b.trust.nonCustodial.description',
      iconAlt: 'Non-custodial icon'
    },
    {
      id: 'audited',
      icon: '/assets/icons/learn-certificate.avif',
      title: 'landing-b2b.trust.audited.title',
      description: 'landing-b2b.trust.audited.description',
      iconAlt: 'Audited protocols icon'
    },
    {
      id: 'reporting',
      icon: '/assets/icons/chart-growing.avif',
      title: 'landing-b2b.trust.reporting.title',
      description: 'landing-b2b.trust.reporting.description',
      iconAlt: 'Transparent reporting icon'
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
 * Maps to: Section 10 - Social Proof (pre-launch)
 */
export const B2B_SOCIAL_PROOF_CONFIG: BenefitsCardsConfig = {
  section: {
    title: 'landing-b2b.socialProof.header',
    description: 'landing-b2b.socialProof.preLaunch',
    backgroundColor: 'white'
  },
  cards: [],
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'Early adopters'
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
    id: 'payments',
    question: 'landing-b2b.faq.items.payments.question',
    answer: 'landing-b2b.faq.items.payments.answer',
    category: 'operations'
  },
  {
    id: 'compliance',
    question: 'landing-b2b.faq.items.compliance.question',
    answer: 'landing-b2b.faq.items.compliance.answer',
    category: 'compliance'
  },
  {
    id: 'whereMoneyGoes',
    question: 'landing-b2b.faq.items.whereMoneyGoes.question',
    answer: 'landing-b2b.faq.items.whereMoneyGoes.answer',
    category: 'security'
  },
  {
    id: 'whyCantTouch',
    question: 'landing-b2b.faq.items.whyCantTouch.question',
    answer: 'landing-b2b.faq.items.whyCantTouch.answer',
    category: 'security'
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
        description: 'landing-b2b.process.steps.book.description'
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
        description: 'landing-b2b.process.steps.review.description'
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
        description: 'landing-b2b.process.steps.decide.description'
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
        description: 'landing-b2b.process.steps.goLive.description'
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
 * Origin Story Section Configuration (FeatureShowcase)
 * Maps to: Section 3 - Why I'm Building This (Grandmother Story)
 */
export const B2B_ORIGIN_STORY_CONFIG: FeatureShowcaseVariantConfig = {
  variant: 'default',
  slides: [
    {
      id: 'origin-story',
      content: {
        title: 'landing-b2b.origin.header',
        description: 'landing-b2b.origin.body',
        ctaText: 'landing-b2b.origin.signature',
        ctaHref: '#calculator',
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
    trackingPrefix: 'origin_story_b2b',
    enabled: true
  }
};

/**
 * Fit Assessment Section Configuration (BenefitsCards)
 * Maps to: Section 8 - Is This Right For You (Good Fit / Not a Fit)
 */
export const B2B_FIT_ASSESSMENT_CONFIG: BenefitsCardsConfig = {
  section: {
    title: 'landing-b2b.fitAssessment.header',
    description: 'landing-b2b.fitAssessment.honestNote',
    backgroundColor: 'light-purple'
  },
  cards: [
    {
      id: 'good-fit',
      icon: '/assets/icons/rewards-trophy.avif',
      title: 'landing-b2b.fitAssessment.goodFit.title',
      description: '',
      iconAlt: 'Good fit checkmark'
    },
    {
      id: 'not-a-fit',
      icon: '/assets/icons/safe-money.avif',
      title: 'landing-b2b.fitAssessment.notAFit.title',
      description: '',
      iconAlt: 'Not a fit icon'
    }
  ],
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'Is diBoaS Treasury right for you'
  },
  analytics: {
    sectionId: 'fit-assessment-b2b',
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
