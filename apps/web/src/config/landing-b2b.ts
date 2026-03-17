/**
 * B2B Landing Page Configuration
 *
 * 14-section layout: Hero → Two Worlds → Cashflow Calculator → Treasury Calculator
 * → Origin Story → How It Works → Features → Cashflow Investing → Fees
 * → Fit Assessment → Founder → Waitlist → FAQ → Footer
 *
 * Domain-Driven Design: B2B landing page domain configuration
 * Service Agnostic Abstraction: Decoupled content from presentation
 */

import type { FAQAccordionVariantConfig, FAQItem } from './faqAccordion';
import type { HeroVariantConfig } from './hero';
import type { AppFeaturesCarouselVariantConfig } from './appFeaturesCarousel';
import type { BenefitsCardsConfig } from '@/components/Sections/BenefitsCards';
import type { ProseSectionConfig } from './proseSection';
import type { FeeTableConfig } from './feeTable';
import type { FounderSectionConfig } from './founderSection';
import type { CalculatorFactoryConfig } from './calculatorFactory';
import type { TwoWorldsSectionConfig } from './twoWorldsSection';
import type { CashflowExplainerSectionConfig } from './cashflowExplainerSection';
import type { ScenarioCardsConfig } from './scenarioCards';

/**
 * B2B Landing Page Image Paths
 */
const B2B_IMAGES = {
  hero: '/assets/images/card-dark2.avif',
  twoWorldsPayments: '/assets/images/payment-dark.avif',
  twoWorldsTreasury: '/assets/images/phone-features3.avif',
  originStory: '/assets/images/table-sunlight.avif',
  featureGetPaid: '/assets/images/phone-transfer.avif',
  featurePayAnyone: '/assets/images/global-jp-canada.avif',
  featureAdelaide: '/assets/images/phone-features2.avif',
  carouselConnect: '/assets/images/phone-account.avif',
  carouselRules: '/assets/images/phone-balance.avif',
  carouselWorks: '/assets/images/phone-grow.avif',
  carouselAccess: '/assets/images/global.avif',
  founderPhoto: '/assets/images/hand-bright.avif',
} as const;

// ─── Section 1: Hero ─────────────────────────────────────────

export const B2B_HERO_CONFIG: HeroVariantConfig = {
  variant: 'fullBackground',
  content: {
    title: 'landing-b2b.hero.headline',
    description: 'landing-b2b.hero.subheadline',
    ctaText: 'landing-b2b.hero.cta',
    ctaHref: '#two-worlds',
    ctaTarget: '_self'
  },
  backgroundAssets: {
    backgroundImage: B2B_IMAGES.hero,
    backgroundImageMobile: B2B_IMAGES.hero,
    overlayOpacity: 0.1
  },
  seo: {
    titleTag: 'diBoaS for Business | Stop Overpaying on Fees and Idle Cash',
    imageAlt: {
      background: 'Business treasury management illustration'
    }
  },
  analytics: {
    trackingPrefix: 'hero_b2b_landing',
    enabled: true
  }
} as const;

// ─── Section 2: Two Worlds (NEW) ─────────────────────────────

export const B2B_TWO_WORLDS_CONFIG: TwoWorldsSectionConfig = {
  content: {
    header: 'landing-b2b.twoWorlds.header',
    cardA: {
      headline: 'landing-b2b.twoWorlds.cardA.headline',
      body: 'landing-b2b.twoWorlds.cardA.body',
      cta: 'landing-b2b.twoWorlds.cardA.cta',
      ctaHref: '#cashflow-calculator',
      image: B2B_IMAGES.twoWorldsPayments,
      imageAlt: 'Business payment processing'
    },
    cardB: {
      headline: 'landing-b2b.twoWorlds.cardB.headline',
      body: 'landing-b2b.twoWorlds.cardB.body',
      cta: 'landing-b2b.twoWorlds.cardB.cta',
      ctaHref: '#treasury-calculator',
      image: B2B_IMAGES.twoWorldsTreasury,
      imageAlt: 'Treasury management on phone'
    }
  },
  seo: {
    ariaLabel: 'landing-b2b.sections.systemCosts.ariaLabel'
  },
  analytics: {
    sectionId: 'two-worlds-b2b',
    category: 'landing-b2b'
  }
};

// ─── Section 3: Cashflow Calculator (NEW) ─────────────────────

export const B2B_CASHFLOW_CALCULATOR_CONFIG: CalculatorFactoryConfig = {
  variant: 'cashflow',
  content: {
    header: 'landing-b2b.cashflowCalculator.header',
    todayTitle: 'landing-b2b.cashflowCalculator.todayTitle',
    tomorrowTitle: 'landing-b2b.cashflowCalculator.tomorrowTitle',
    fields: {
      field1: 'landing-b2b.cashflowCalculator.fields.dailyRevenue',
      field2: 'landing-b2b.cashflowCalculator.fields.currentFee'
    },
    periodToggle: {
      month: 'landing-b2b.cashflowCalculator.periodToggle.month',
      sixMonths: 'landing-b2b.cashflowCalculator.periodToggle.sixMonths',
      year: 'landing-b2b.cashflowCalculator.periodToggle.year'
    },
    disclaimer: 'landing-b2b.cashflowCalculator.disclaimer',
    results: {
      step1Label: 'landing-b2b.cashflowCalculator.results.step1Label',
      step2Label: 'landing-b2b.cashflowCalculator.results.step2Label',
      savingsLabel: 'landing-b2b.cashflowCalculator.results.savingsLabel',
      scenarios: {
        conservative: 'landing-b2b.cashflowCalculator.results.scenarios.conservative',
        historical: 'landing-b2b.cashflowCalculator.results.scenarios.historical',
        optimistic: 'landing-b2b.cashflowCalculator.results.scenarios.optimistic'
      },
      likelyBadge: 'landing-b2b.cashflowCalculator.results.likelyBadge'
    },
    sliderLabel: 'landing-b2b.cashflowCalculator.sliderLabel',
    belowResults: 'landing-b2b.cashflowCalculator.belowResults',
    customRateTemplate: 'landing-b2b.cashflowCalculator.customRateTemplate',
    cta: 'landing-b2b.cashflowCalculator.cta',
    ctaHref: '#waitlist',
    transitionHook: 'landing-b2b.cashflowCalculator.transitionHook'
  },
  defaults: {
    en: { field1: 1000, field2: 3 },
    de: { field1: 1000, field2: 2.5 },
    es: { field1: 1000, field2: 2.5 },
    'pt-BR': { field1: 5000, field2: 4 }
  },
  seo: {
    ariaLabel: 'landing-b2b.sections.feeSavings.ariaLabel'
  },
  analytics: {
    sectionId: 'cashflow-calculator-b2b',
    category: 'landing-b2b'
  }
};

// ─── Section 4: Treasury Calculator ───────────────────────────

export const B2B_CALCULATOR_CONFIG: CalculatorFactoryConfig = {
  variant: 'treasury',
  content: {
    header: 'landing-b2b.calculator.header',
    todayTitle: 'landing-b2b.calculator.todayTitle',
    tomorrowTitle: 'landing-b2b.calculator.tomorrowTitle',
    fields: {
      field1: 'landing-b2b.calculator.fields.cashOnHand',
      field2: 'landing-b2b.calculator.fields.currentRate'
    },
    periodToggle: {
      month: 'landing-b2b.calculator.periodToggle.month',
      sixMonths: 'landing-b2b.calculator.periodToggle.sixMonths',
      year: 'landing-b2b.calculator.periodToggle.year'
    },
    disclaimer: 'landing-b2b.calculator.disclaimer',
    results: {
      step1Label: 'landing-b2b.calculator.results.step1Label',
      step2Label: 'landing-b2b.calculator.results.step2Label',
      savingsLabel: 'landing-b2b.calculator.results.savingsLabel',
      scenarios: {
        conservative: 'landing-b2b.calculator.results.scenarios.conservative',
        historical: 'landing-b2b.calculator.results.scenarios.historical',
        optimistic: 'landing-b2b.calculator.results.scenarios.optimistic'
      },
      likelyBadge: 'landing-b2b.calculator.results.likelyBadge'
    },
    sliderLabel: 'landing-b2b.calculator.sliderLabel',
    belowResults: 'landing-b2b.calculator.belowResults',
    customRateTemplate: 'landing-b2b.calculator.customRateTemplate',
    cta: 'landing-b2b.calculator.cta',
    ctaHref: '#waitlist',
    transitionHook: 'landing-b2b.calculator.transitionHook'
  },
  defaults: {
    en: { field1: 500000, field2: 0.5 },
    de: { field1: 500000, field2: 0.5 },
    es: { field1: 500000, field2: 0.5 },
    'pt-BR': { field1: 2500000, field2: 1 }
  },
  seo: {
    ariaLabel: 'landing-b2b.sections.treasuryCalculator.ariaLabel'
  },
  analytics: {
    sectionId: 'treasury-calculator-b2b',
    category: 'landing-b2b'
  }
};

// ─── Section 5: Origin Story (ProseSection) ───────────────────

export const B2B_ORIGIN_STORY_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2b.origin.header',
    paragraphs: [
      'landing-b2b.origin.paragraphs.0',
      'landing-b2b.origin.paragraphs.1',
      'landing-b2b.origin.paragraphs.2',
      'landing-b2b.origin.paragraphs.3',
      'landing-b2b.origin.paragraphs.4',
      'landing-b2b.origin.paragraphs.5',
      'landing-b2b.origin.paragraphs.6'
    ],
    signatureLine: 'landing-b2b.origin.signature',
    transitionHook: 'landing-b2b.origin.transitionHook'
  },
  image: {
    src: B2B_IMAGES.originStory,
    alt: 'diBoaS founder',
    position: 'right',
    aspectRatio: 'portrait'
  },
  style: {
    backgroundColor: 'var(--section-bg-warm)',
    headerStyle: 'inline'
  },
  seo: {
    ariaLabel: 'landing-b2b.sections.originStory.ariaLabel'
  },
  analytics: {
    sectionId: 'origin-story-b2b',
    category: 'landing-b2b'
  }
};

// ─── Section 6: How It Works (AppFeaturesCarousel) ────────────

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
        image: B2B_IMAGES.carouselConnect
      },
      seo: {
        imageAlt: 'Connect your business account'
      }
    },
    {
      id: 'step-rules',
      content: {
        title: 'landing-b2b.howItWorks.steps.rules.title',
        description: 'landing-b2b.howItWorks.steps.rules.description'
      },
      assets: {
        image: B2B_IMAGES.carouselRules
      },
      seo: {
        imageAlt: 'Set your rules and limits'
      }
    },
    {
      id: 'step-works',
      content: {
        title: 'landing-b2b.howItWorks.steps.works.title',
        description: 'landing-b2b.howItWorks.steps.works.description'
      },
      assets: {
        image: B2B_IMAGES.carouselWorks
      },
      seo: {
        imageAlt: 'Your money works for you'
      }
    },
    {
      id: 'step-access',
      content: {
        title: 'landing-b2b.howItWorks.steps.access.title',
        description: 'landing-b2b.howItWorks.steps.access.description'
      },
      assets: {
        image: B2B_IMAGES.carouselAccess
      },
      seo: {
        imageAlt: 'Access your money anytime'
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

// ─── Section 7: Three Features (ScenarioCards, 3 cards) ───────

export const B2B_FEATURES_CONFIG: ScenarioCardsConfig = {
  section: {
    title: 'landing-b2b.features.header',
  },
  cards: [
    {
      id: 'feature-get-paid',
      title: 'landing-b2b.features.cards.getPaid.headline',
      description: 'landing-b2b.features.cards.getPaid.body',
      backgroundImage: B2B_IMAGES.featureGetPaid,
      imageAlt: 'Get paid without the cut',
    },
    {
      id: 'feature-pay-anyone',
      title: 'landing-b2b.features.cards.payAnyone.headline',
      description: 'landing-b2b.features.cards.payAnyone.body',
      backgroundImage: B2B_IMAGES.featurePayAnyone,
      imageAlt: 'Pay anyone anywhere instantly',
    },
    {
      id: 'feature-adelaide',
      title: 'landing-b2b.features.cards.adelaide.headline',
      description: 'landing-b2b.features.cards.adelaide.body',
      backgroundImage: B2B_IMAGES.featureAdelaide,
      imageAlt: 'Adelaide market intelligence',
    },
  ],
  style: {
    backgroundColor: 'var(--section-bg-enterprise)',
  },
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'landing-b2b.sections.businessBenefits.ariaLabel',
  },
  analytics: {
    sectionId: 'features-b2b',
    category: 'landing-b2b',
  },
};

// ─── Section 8: Cashflow Investing (NEW) ──────────────────────

export const B2B_CASHFLOW_INVESTING_CONFIG: CashflowExplainerSectionConfig = {
  content: {
    header: 'landing-b2b.cashflowInvesting.header',
    subheader: 'landing-b2b.cashflowInvesting.subheader',
    partA: {
      title: 'landing-b2b.cashflowInvesting.saveIt.title',
      body: 'landing-b2b.cashflowInvesting.saveIt.body'
    },
    partB: {
      title: 'landing-b2b.cashflowInvesting.growIt.title',
      body: 'landing-b2b.cashflowInvesting.growIt.body'
    },
    microExample: 'landing-b2b.cashflowInvesting.microExample',
    limitation: 'landing-b2b.cashflowInvesting.limitation',
    brandPromise: 'landing-b2b.cashflowInvesting.brandPromise',
    cta: 'landing-b2b.cashflowInvesting.cta',
    ctaHref: '#cashflow-calculator',
    microDisclosure: 'landing-b2b.cashflowInvesting.microDisclosure'
  },
  seo: {
    ariaLabel: 'landing-b2b.sections.cashflowInvesting.ariaLabel'
  },
  analytics: {
    sectionId: 'cashflow-investing-b2b',
    category: 'landing-b2b'
  }
};

// ─── Section 9: Fee Transparency (FeeTable) ──────────────────

export const B2B_FEES_CONFIG: FeeTableConfig = {
  content: {
    title: 'landing-b2b.fees.header',
    subtitle: 'landing-b2b.fees.subtitle',
    disclaimer: 'landing-b2b.fees.disclaimer',
    example: 'landing-b2b.fees.example',
    footerLine: 'landing-b2b.fees.footerLine',
    transitionHook: 'landing-b2b.fees.transitionHook',
    headers: {
      action: 'landing-b2b.fees.headers.action',
      diboas: 'landing-b2b.fees.headers.diboas',
      competitors: 'landing-b2b.fees.headers.competitors',
      difference: 'landing-b2b.fees.headers.difference',
      example: 'landing-b2b.fees.headers.example'
    },
    rows: [
      {
        id: 'account',
        action: 'landing-b2b.fees.rows.account.action',
        diboas: 'landing-b2b.fees.rows.account.diboas',
        competitors: 'landing-b2b.fees.rows.account.competitors',
        difference: 'landing-b2b.fees.rows.account.difference',
        example: 'landing-b2b.fees.rows.account.example',
        isFree: true
      },
      {
        id: 'receive',
        action: 'landing-b2b.fees.rows.receive.action',
        diboas: 'landing-b2b.fees.rows.receive.diboas',
        competitors: 'landing-b2b.fees.rows.receive.competitors',
        difference: 'landing-b2b.fees.rows.receive.difference',
        example: 'landing-b2b.fees.rows.receive.example',
        isFree: true
      },
      {
        id: 'send',
        action: 'landing-b2b.fees.rows.send.action',
        diboas: 'landing-b2b.fees.rows.send.diboas',
        competitors: 'landing-b2b.fees.rows.send.competitors',
        difference: 'landing-b2b.fees.rows.send.difference',
        example: 'landing-b2b.fees.rows.send.example',
        isFree: true
      },
      {
        id: 'add',
        action: 'landing-b2b.fees.rows.add.action',
        diboas: 'landing-b2b.fees.rows.add.diboas',
        competitors: 'landing-b2b.fees.rows.add.competitors',
        difference: 'landing-b2b.fees.rows.add.difference',
        example: 'landing-b2b.fees.rows.add.example'
      },
      {
        id: 'invest',
        action: 'landing-b2b.fees.rows.invest.action',
        diboas: 'landing-b2b.fees.rows.invest.diboas',
        competitors: 'landing-b2b.fees.rows.invest.competitors',
        difference: 'landing-b2b.fees.rows.invest.difference',
        example: 'landing-b2b.fees.rows.invest.example',
        isFree: true
      },
      {
        id: 'sell',
        action: 'landing-b2b.fees.rows.sell.action',
        diboas: 'landing-b2b.fees.rows.sell.diboas',
        competitors: 'landing-b2b.fees.rows.sell.competitors',
        difference: 'landing-b2b.fees.rows.sell.difference',
        example: 'landing-b2b.fees.rows.sell.example'
      },
      {
        id: 'swap',
        action: 'landing-b2b.fees.rows.swap.action',
        diboas: 'landing-b2b.fees.rows.swap.diboas',
        competitors: 'landing-b2b.fees.rows.swap.competitors',
        difference: 'landing-b2b.fees.rows.swap.difference',
        example: 'landing-b2b.fees.rows.swap.example',
        isFree: true
      },
      {
        id: 'cashOut',
        action: 'landing-b2b.fees.rows.cashOut.action',
        diboas: 'landing-b2b.fees.rows.cashOut.diboas',
        competitors: 'landing-b2b.fees.rows.cashOut.competitors',
        difference: 'landing-b2b.fees.rows.cashOut.difference',
        example: 'landing-b2b.fees.rows.cashOut.example'
      }
    ]
  },
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'landing-b2b.sections.feeTable.ariaLabel'
  },
  analytics: {
    sectionId: 'fees-b2b',
    category: 'landing-b2b'
  }
};


// ─── Section 10: Fit Assessment (BenefitsCards) ──────────────

export const B2B_FIT_ASSESSMENT_CONFIG: BenefitsCardsConfig = {
  section: {
    title: 'landing-b2b.fitAssessment.header',
    backgroundColor: 'enterprise'
  },
  cards: [
    {
      id: 'good-fit',
      icon: 'check-circle',
      title: 'landing-b2b.fitAssessment.goodFit.title',
      description: 'landing-b2b.fitAssessment.goodFit.description',
      iconAlt: 'Good fit checkmark'
    },
    {
      id: 'not-a-fit',
      icon: 'x-circle',
      title: 'landing-b2b.fitAssessment.notAFit.title',
      description: 'landing-b2b.fitAssessment.notAFit.description',
      iconAlt: 'Not a fit indicator'
    }
  ],
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'landing-b2b.sections.rightForYou.ariaLabel'
  },
  analytics: {
    sectionId: 'fit-assessment-b2b',
    category: 'landing-b2b'
  }
};

// ─── Section 11: About the Founder (FounderSection) ──────────

export const B2B_FOUNDER_CONFIG: FounderSectionConfig = {
  content: {
    header: 'landing-b2b.founder.header',
    paragraphs: [
      'landing-b2b.founder.paragraphs.versionB.0',
      'landing-b2b.founder.paragraphs.versionB.1',
      'landing-b2b.founder.email'
    ],
    emailText: 'landing-b2b.founder.emailAddress',
    emailHref: 'hello@diboas.com',
    socialLinks: [
      { label: 'landing-b2b.founder.social.linkedin', href: 'https://www.linkedin.com/in/bribeirobr/', icon: 'linkedin' },
      { label: 'landing-b2b.founder.social.x', href: 'https://x.com/bribeiro_br', icon: 'x' },
      { label: 'landing-b2b.founder.social.substack', href: 'https://bribeirobr.substack.com/', icon: 'substack' },
    ],
  },
  image: {
    src: B2B_IMAGES.founderPhoto,
    alt: 'Bar, Founder of diBoaS'
  },
  seo: {
    ariaLabel: 'landing-b2b.sections.founder.ariaLabel'
  },
  analytics: {
    sectionId: 'founder-b2b',
    category: 'landing-b2b'
  }
};

// ─── Section 12: Waitlist Configuration ─────────────────────

export const B2B_WAITLIST_CONFIG = {
  sectionId: 'waitlist-section-b2b',
  backgroundColor: 'var(--section-bg-brand)',
  headline: 'landing-b2b.waitlist.header',
  subheadline: 'landing-b2b.waitlist.description',
  hideBenefits: true,
  hideNoSpam: true,
  namespace: 'landing-b2b.waitlist',
  confirmationNamespace: 'landing-b2b.waitlistSuccess',
  source: 'landing_b2b' as const,
} as const;

// ─── Section 13: FAQ (10 items) ──────────────────────────────

export const B2B_FAQ_ITEMS: FAQItem[] = [
  {
    id: 'catch',
    question: 'landing-b2b.faq.items.catch.question',
    answer: 'landing-b2b.faq.items.catch.answer',
    category: 'general'
  },
  {
    id: 'smbOrStartup',
    question: 'landing-b2b.faq.items.smbOrStartup.question',
    answer: 'landing-b2b.faq.items.smbOrStartup.answer',
    category: 'general'
  },
  {
    id: 'safety',
    question: 'landing-b2b.faq.items.safety.question',
    answer: 'landing-b2b.faq.items.safety.answerA',
    category: 'security'
  },
  {
    id: 'liquidity',
    question: 'landing-b2b.faq.items.liquidity.question',
    answer: 'landing-b2b.faq.items.liquidity.answer',
    category: 'operations'
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
    answer: 'landing-b2b.faq.items.whyCantTouch.answerA',
    category: 'security'
  },
  {
    id: 'risk',
    question: 'landing-b2b.faq.items.risk.question',
    answer: 'landing-b2b.faq.items.risk.answer',
    category: 'security'
  },
  {
    id: 'audited',
    question: 'landing-b2b.faq.items.audited.question',
    answer: 'landing-b2b.faq.items.audited.answer',
    category: 'compliance'
  }
];

export const B2B_FAQ_CONFIG: FAQAccordionVariantConfig = {
  variant: 'default',
  content: {
    title: 'landing-b2b.faq.header',
    description: '',
    ctaText: '',
    ctaHref: '#waitlist',
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
    ariaLabel: 'landing-b2b.sections.faq.ariaLabel',
    region: 'faq'
  },
  analytics: {
    trackingPrefix: 'faq_b2b_landing',
    enabled: true
  }
};

// ─── Section 14: Footer navigation & disclosures ────────────

export const B2B_FOOTER_NAV = [
  { id: 'forYou', labelKey: 'landing-b2b.footer.nav.forYou', href: '/' },
  { id: 'forBusiness', labelKey: 'landing-b2b.footer.nav.forBusiness', href: '/business' },
  { id: 'adelaideDaily', labelKey: 'landing-b2b.footer.nav.adelaideDaily', href: '/daily-market' },
  { id: 'about', labelKey: 'landing-b2b.footer.nav.about', href: '/about' },
  { id: 'strategies', labelKey: 'landing-b2b.footer.nav.strategies', href: '/strategies' },
  { id: 'protocols', labelKey: 'landing-b2b.footer.nav.protocols', href: '/protocols' },
  { id: 'help', labelKey: 'landing-b2b.footer.nav.help', href: '/help' },
] as const;

/**
 * Locale-conditional footer disclosures.
 * Uses the same interface as MinimalFooter's disclosureKeys prop.
 *
 * MiCA Art. 68: DE, ES only
 * MiCA Art. 7: EN, DE, ES
 * CVM 3-warning: PT-BR only
 * US disclosure: EN only
 */
export const B2B_FOOTER_DISCLOSURES = {
  general: 'landing-b2b.footer.riskDisclaimer',
  stories: 'landing-b2b.footer.fictionalResults',
  ai: 'landing-b2b.footer.aiDisclosure',
  mica: 'landing-b2b.footer.micaArticle68',
  micaArticle7: 'landing-b2b.footer.micaArticle7',
  cvm: 'landing-b2b.footer.cvmWarning',
  us: 'landing-b2b.footer.usDisclosure',
  crypto: 'landing-b2b.footer.cryptoDisclosure',
  closing: 'landing-b2b.footer.closing',
} as const;
