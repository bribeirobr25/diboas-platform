/**
 * B2C Landing Page Configuration
 *
 * Domain-Driven Design: B2C landing page domain configuration
 * Service Agnostic Abstraction: Decoupled content from presentation
 * Configuration Management: Centralized landing page content
 * No Hardcoded Values: All values from design tokens and i18n keys
 *
 * 12-Section Layout (CMO Final Copy):
 * 1. Hero
 * 2. Scenarios (ProductCarousel default variant)
 * 2.5. Persona Carousel (ProductCarousel persona variant)
 * 3. Origin Story (ProseSection)
 * 4. How It Works (AppFeaturesCarousel) — 4 steps
 * 5. Fees (FeeTable) — moved up from 6
 * 6. What's the Catch? (ProseSection) — moved up from 7
 * 6.5. Under the Hood (ExpandableSection)
 * 7. Demo (DemoLauncher) — moved up from 8
 * 8. Social Proof — moved up from 9
 * 8.5. About the Founder (FounderSection)
 * 9. Waitlist (Version A/B)
 * 10. FAQ (expanded 5→12)
 * 11. Footer (MinimalFooter)
 */

import { ROUTES } from './routes';
import type { FAQAccordionVariantConfig, FAQItem } from './faqAccordion';
import type { HeroVariantConfig } from './hero';
import type { ProductCarouselVariantConfig } from './productCarousel';
import type { AppFeaturesCarouselVariantConfig } from './appFeaturesCarousel';
import type { ProseSectionConfig } from './proseSection';
import type { FeeTableConfig } from './feeTable';
import type { ExpandableSectionConfig } from './expandableSection';
import type { FounderSectionConfig } from './founderSection';
import type { GoalCalculatorConfig } from './goalCalculator';

/**
 * B2C Landing Page Image Paths
 * Handoff naming convention: /assets/images/{section}-{name}.avif
 */
const B2C_IMAGES = {
  hero: '/assets/images/phone-banner.avif',
  heroMobile: '/assets/images/phone-banner.avif',
  step1: '/assets/images/payment-bright.avif',
  step2: '/assets/images/phone-grow.avif',
  step3: '/assets/images/phone-features3.avif',
  scenarioDinner: '/assets/images/friends-dinner.avif',
  scenarioGlobal: '/assets/images/global2.avif',
  scenarioEmergency: '/assets/images/bed-dark3.avif',
  featureSend: '/assets/images/global-rio-sweden.avif',
  featureGoals: '/assets/images/phone-features.avif',
  featureAlwaysOn: '/assets/images/bed-bright.avif',
  originStory: '/assets/images/hand-bright2.avif',
  catchSection: '/assets/images/phone-diboas.avif',
} as const;

/**
 * Section 1: Hero Configuration
 */
export const B2C_HERO_CONFIG: HeroVariantConfig = {
  variant: 'fullBackground',
  content: {
    title: 'landing-b2c.hero.headline',
    description: 'landing-b2c.hero.subheadline',
    ctaText: 'landing-b2c.hero.cta',
    ctaHref: '#demo',
    ctaTarget: '_self'
  },
  backgroundAssets: {
    backgroundImage: B2C_IMAGES.hero,
    backgroundImageMobile: B2C_IMAGES.heroMobile,
    overlayOpacity: 0.1
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
 * Section 1.5: Goal Calculator Configuration
 */
export const B2C_GOAL_CALCULATOR_CONFIG: GoalCalculatorConfig = {
  content: {
    header: 'landing-b2c.goalCalculator.header',
    tabs: {
      christmas: 'landing-b2c.goalCalculator.tabs.christmas',
      emergency: 'landing-b2c.goalCalculator.tabs.emergency',
      vacation: 'landing-b2c.goalCalculator.tabs.vacation',
    },
    fields: {
      christmas: {
        label: 'landing-b2c.goalCalculator.fields.christmas.label',
        helper: 'landing-b2c.goalCalculator.fields.christmas.helper',
      },
      emergency: {
        label: 'landing-b2c.goalCalculator.fields.emergency.label',
        helper: 'landing-b2c.goalCalculator.fields.emergency.helper',
      },
      vacation: {
        label: 'landing-b2c.goalCalculator.fields.vacation.label',
        helper: 'landing-b2c.goalCalculator.fields.vacation.helper',
      },
      initialDeposit: {
        label: 'landing-b2c.goalCalculator.fields.initialDeposit.label',
        helper: 'landing-b2c.goalCalculator.fields.initialDeposit.helper',
      },
      monthlyDeposit: {
        label: 'landing-b2c.goalCalculator.fields.monthlyDeposit.label',
        helper: 'landing-b2c.goalCalculator.fields.monthlyDeposit.helper',
      },
      riskTier: {
        label: 'landing-b2c.goalCalculator.fields.riskTier.label',
      },
    },
    coverage: {
      label: 'landing-b2c.goalCalculator.coverage.label',
      months3: 'landing-b2c.goalCalculator.coverage.months3',
      months4: 'landing-b2c.goalCalculator.coverage.months4',
      months6: 'landing-b2c.goalCalculator.coverage.months6',
    },
    timeline: {
      label: 'landing-b2c.goalCalculator.timeline.label',
      months6: 'landing-b2c.goalCalculator.timeline.months6',
      months9: 'landing-b2c.goalCalculator.timeline.months9',
      months12: 'landing-b2c.goalCalculator.timeline.months12',
      months18: 'landing-b2c.goalCalculator.timeline.months18',
    },
    vacationDate: {
      label: 'landing-b2c.goalCalculator.vacationDate.label',
    },
    tiers: {
      careful: 'landing-b2c.goalCalculator.tiers.careful',
      moderate: 'landing-b2c.goalCalculator.tiers.moderate',
      aggressive: 'landing-b2c.goalCalculator.tiers.aggressive',
    },
    cta: 'landing-b2c.goalCalculator.cta',
    result: {
      christmasHeadline: 'landing-b2c.goalCalculator.result.christmasHeadline',
      emergencyHeadline: 'landing-b2c.goalCalculator.result.emergencyHeadline',
      vacationHeadline: 'landing-b2c.goalCalculator.result.vacationHeadline',
      planLine: 'landing-b2c.goalCalculator.result.planLine',
      scenarioGood: 'landing-b2c.goalCalculator.result.scenarioGood',
      scenarioExpected: 'landing-b2c.goalCalculator.result.scenarioExpected',
      scenarioBad: 'landing-b2c.goalCalculator.result.scenarioBad',
      badCaseLoss: 'landing-b2c.goalCalculator.result.badCaseLoss',
      disclaimer: 'landing-b2c.goalCalculator.result.disclaimer',
      startSmallerToggle: 'landing-b2c.goalCalculator.result.startSmallerToggle',
      startSmallerPrompt: 'landing-b2c.goalCalculator.result.startSmallerPrompt',
      startSmallerPartial: 'landing-b2c.goalCalculator.result.startSmallerPartial',
      primaryCta: 'landing-b2c.goalCalculator.result.primaryCta',
      secondaryHow: 'landing-b2c.goalCalculator.result.secondaryHow',
      secondaryRisks: 'landing-b2c.goalCalculator.result.secondaryRisks',
      demoLink: 'landing-b2c.goalCalculator.result.demoLink',
    },
    helpers: {
      bigCommitment: 'landing-b2c.goalCalculator.helpers.bigCommitment',
      oneMonthWarning: 'landing-b2c.goalCalculator.helpers.oneMonthWarning',
      christmasRollover: 'landing-b2c.goalCalculator.helpers.christmasRollover',
      vacationDateMinimum: 'landing-b2c.goalCalculator.helpers.vacationDateMinimum',
    },
    microcopy: 'landing-b2c.goalCalculator.microcopy',
  },
  seo: {
    ariaLabel: 'Goal-based savings calculator',
  },
  analytics: {
    sectionId: 'goal-calculator-b2c',
    category: 'landing-b2c',
  },
} as const;

/**
 * Section 2: Origin Story Configuration (ProseSection)
 * "Her name was Adelaide.", warm background, 6 paragraphs + transition hook
 */
export const B2C_ORIGIN_STORY_CONFIG: ProseSectionConfig = {
  content: {
    transitionHook: 'landing-b2c.origin.transitionHook',
    header: 'landing-b2c.origin.header',
    paragraphs: [
      'landing-b2c.origin.paragraphs.p1',
      'landing-b2c.origin.paragraphs.p2',
      'landing-b2c.origin.paragraphs.p3',
      'landing-b2c.origin.paragraphs.p5',
      'landing-b2c.origin.paragraphs.p6',
    ],
  },
  image: {
    src: B2C_IMAGES.originStory,
    alt: 'Person holding a phone with diBoaS app',
    position: 'right',
  },
  style: {
    backgroundColor: 'var(--section-bg-warm)',
    verticalPadding: 'standard',
  },
  seo: {
    ariaLabel: 'Origin story, why diBoaS exists',
  },
  analytics: {
    sectionId: 'origin-story-b2c',
    category: 'landing-b2c',
  },
} as const;

/**
 * Section 2.5: Persona Carousel Configuration (ProductCarousel persona variant)
 * 3 persona slides with headline, subtext, CTA
 */
export const B2C_PERSONA_CAROUSEL_CONFIG: ProductCarouselVariantConfig = {
  variant: 'persona',
  content: {
    heading: 'landing-b2c.personas.header',
    slides: [
      {
        id: 'persona-urgent-transfer',
        title: 'landing-b2c.personas.slide1.headline',
        subtitle: 'landing-b2c.personas.slide1.subtext',
        imageAlt: '',
        ctaText: 'landing-b2c.personas.slide1.cta',
        ctaHref: '#demo',
      },
      {
        id: 'persona-hidden-fees',
        title: 'landing-b2c.personas.slide2.headline',
        subtitle: 'landing-b2c.personas.slide2.subtext',
        imageAlt: '',
        ctaText: 'landing-b2c.personas.slide2.cta',
        ctaHref: '#demo',
      },
      {
        id: 'persona-savings',
        title: 'landing-b2c.personas.slide3.headline',
        subtitle: 'landing-b2c.personas.slide3.subtext',
        imageAlt: '',
        ctaText: 'landing-b2c.personas.slide3.cta',
        ctaHref: '#demo',
      },
    ],
  },
  settings: {
    autoPlay: true,
    autoPlayInterval: 5000,
    transitionDuration: 500,
    pauseOnHover: true,
    enableKeyboard: true,
    enableTouch: true,
    enableDots: true,
    enablePlayPause: false,
  },
  seo: {
    headingTag: 'h2',
    ariaLabel: 'Persona carousel showing who diBoaS is for',
  },
  analytics: {
    trackingPrefix: 'persona_carousel_b2c',
    enabled: true,
  },
};

/**
 * Section 4: How It Works Configuration (AppFeaturesCarousel)
 * 4 steps with images
 */
export const B2C_HOW_IT_WORKS_CONFIG: AppFeaturesCarouselVariantConfig = {
  variant: 'default',
  sectionTitle: 'landing-b2c.howItWorks.header',
  cards: [
    {
      id: 'step-1-deposit',
      content: {
        title: 'landing-b2c.howItWorks.step1.title',
        description: 'landing-b2c.howItWorks.step1.description',
      },
      assets: {
        image: B2C_IMAGES.step1,
      },
      seo: {
        imageAlt: 'Step 1: Send and receive money',
      },
    },
    {
      id: 'step-2-earn',
      content: {
        title: 'landing-b2c.howItWorks.step2.title',
        description: 'landing-b2c.howItWorks.step2.description',
      },
      assets: {
        image: B2C_IMAGES.step2,
      },
      seo: {
        imageAlt: 'Step 2: Invest and grow your money',
      },
    },
    {
      id: 'step-3-withdraw',
      content: {
        title: 'landing-b2c.howItWorks.step3.title',
        description: 'landing-b2c.howItWorks.step3.description',
      },
      assets: {
        image: B2C_IMAGES.step3,
      },
      seo: {
        imageAlt: 'Step 3: Track and learn',
      },
    },
    {
      id: 'step-4-buy-hold',
      content: {
        title: 'landing-b2c.howItWorks.step4.title',
        description: 'landing-b2c.howItWorks.step4.description',
      },
      assets: {
        image: '/assets/images/garden.avif',
      },
      seo: {
        imageAlt: 'Step 4: Buy and hold crypto assets',
      },
    },
  ],
  settings: {
    autoRotateMs: 0,
    pauseOnHover: true,
    enableTouch: true,
    enableAnalytics: true,
    transitionDuration: 300,
  },
  analytics: {
    trackingPrefix: 'how_it_works_b2c',
    enabled: true,
  },
};

/**
 * Section 3: Scenarios Configuration (ProductCarousel default variant)
 * 3 real-life scenario slides with background images
 */
export const B2C_SCENARIOS_CONFIG: ProductCarouselVariantConfig = {
  variant: 'default',
  content: {
    heading: 'landing-b2c.scenarios.header',
    slides: [
      {
        id: 'scenario-dinner',
        title: 'landing-b2c.scenarios.card1.title',
        subtitle: 'landing-b2c.scenarios.card1.description',
        image: B2C_IMAGES.scenarioDinner,
        imageAlt: 'Friends splitting dinner',
      },
      {
        id: 'scenario-global',
        title: 'landing-b2c.scenarios.card2.title',
        subtitle: 'landing-b2c.scenarios.card2.description',
        image: B2C_IMAGES.scenarioGlobal,
        imageAlt: 'Sending payment internationally',
      },
      {
        id: 'scenario-emergency',
        title: 'landing-b2c.scenarios.card3.title',
        subtitle: 'landing-b2c.scenarios.card3.description',
        image: B2C_IMAGES.scenarioEmergency,
        imageAlt: 'Emergency money transfer to family',
      },
    ],
  },
  settings: {
    autoPlay: false,
    autoPlayInterval: 5000,
    transitionDuration: 500,
    pauseOnHover: true,
    enableKeyboard: true,
    enableTouch: true,
    enableDots: true,
    enablePlayPause: false,
  },
  seo: {
    headingTag: 'h2',
    ariaLabel: 'Real-life scenarios where diBoaS helps',
  },
  analytics: {
    trackingPrefix: 'scenarios_b2c',
    enabled: true,
  },
} as const;

/**
 * Section 5: Fees Configuration (FeeTable)
 * 8 fee rows, 5-column comparison layout with examples
 */
export const B2C_FEES_CONFIG: FeeTableConfig = {
  content: {
    transitionHook: 'landing-b2c.fees.transitionHook',
    title: 'landing-b2c.fees.title',
    painIntro: 'landing-b2c.fees.painIntro',
    disclaimer: 'landing-b2c.fees.disclaimer',
    example: 'landing-b2c.fees.example',
    footerLine: 'landing-b2c.fees.footerLine',
    headers: {
      action: 'landing-b2c.fees.headers.action',
      diboas: 'landing-b2c.fees.headers.diboas',
      competitors: 'landing-b2c.fees.headers.competitors',
      difference: 'landing-b2c.fees.headers.difference',
      example: 'landing-b2c.fees.headers.example',
    },
    rows: [
      {
        id: 'account',
        action: 'landing-b2c.fees.rows.account.action',
        diboas: 'landing-b2c.fees.rows.account.diboas',
        competitors: 'landing-b2c.fees.rows.account.competitors',
        difference: 'landing-b2c.fees.rows.account.difference',
        example: 'landing-b2c.fees.rows.account.example',
        isFree: true,
      },
      {
        id: 'adding',
        action: 'landing-b2c.fees.rows.adding.action',
        diboas: 'landing-b2c.fees.rows.adding.diboas',
        competitors: 'landing-b2c.fees.rows.adding.competitors',
        difference: 'landing-b2c.fees.rows.adding.difference',
        example: 'landing-b2c.fees.rows.adding.example',
        isHighlight: true,
      },
      {
        id: 'sending',
        action: 'landing-b2c.fees.rows.sending.action',
        diboas: 'landing-b2c.fees.rows.sending.diboas',
        competitors: 'landing-b2c.fees.rows.sending.competitors',
        difference: 'landing-b2c.fees.rows.sending.difference',
        example: 'landing-b2c.fees.rows.sending.example',
        isFree: true,
      },
      {
        id: 'buying',
        action: 'landing-b2c.fees.rows.buying.action',
        diboas: 'landing-b2c.fees.rows.buying.diboas',
        competitors: 'landing-b2c.fees.rows.buying.competitors',
        difference: 'landing-b2c.fees.rows.buying.difference',
        example: 'landing-b2c.fees.rows.buying.example',
        isHighlight: true,
        isFree: true,
      },
      {
        id: 'selling',
        action: 'landing-b2c.fees.rows.selling.action',
        diboas: 'landing-b2c.fees.rows.selling.diboas',
        competitors: 'landing-b2c.fees.rows.selling.competitors',
        difference: 'landing-b2c.fees.rows.selling.difference',
        example: 'landing-b2c.fees.rows.selling.example',
        isHighlight: true,
      },
      {
        id: 'swapping',
        action: 'landing-b2c.fees.rows.swapping.action',
        diboas: 'landing-b2c.fees.rows.swapping.diboas',
        competitors: 'landing-b2c.fees.rows.swapping.competitors',
        difference: 'landing-b2c.fees.rows.swapping.difference',
        example: 'landing-b2c.fees.rows.swapping.example',
        isFree: true,
      },
      {
        id: 'strategies',
        action: 'landing-b2c.fees.rows.strategies.action',
        diboas: 'landing-b2c.fees.rows.strategies.diboas',
        competitors: 'landing-b2c.fees.rows.strategies.competitors',
        difference: 'landing-b2c.fees.rows.strategies.difference',
        example: 'landing-b2c.fees.rows.strategies.example',
        isFree: true,
      },
      {
        id: 'cashout',
        action: 'landing-b2c.fees.rows.cashout.action',
        diboas: 'landing-b2c.fees.rows.cashout.diboas',
        competitors: 'landing-b2c.fees.rows.cashout.competitors',
        difference: 'landing-b2c.fees.rows.cashout.difference',
        example: 'landing-b2c.fees.rows.cashout.example',
        isHighlight: true,
      },
    ],
  },
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'Complete fee transparency table',
  },
  analytics: {
    sectionId: 'fees-b2c',
    category: 'landing-b2c',
  },
} as const;

/**
 * Section 6: What's the Catch? Configuration (ProseSection)
 * Warm background, 6 paragraphs, no emphasis line
 */
export const B2C_CATCH_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.catch.header',
    paragraphs: [
      'landing-b2c.catch.paragraphs.p1',
      'landing-b2c.catch.paragraphs.p2',
      'landing-b2c.catch.paragraphs.p3',
      'landing-b2c.catch.paragraphs.p4',
      'landing-b2c.catch.paragraphs.p5',
      'landing-b2c.catch.paragraphs.p6',
    ],
  },
  image: {
    src: B2C_IMAGES.catchSection,
    alt: 'diBoaS app showing transparent features',
    position: 'left',
  },
  style: {
    backgroundColor: 'var(--section-bg-warm)',
    verticalPadding: 'standard',
    headerStyle: 'centered',
  },
  seo: {
    ariaLabel: 'What is the catch, honest transparency',
  },
  analytics: {
    sectionId: 'catch-b2c',
    category: 'landing-b2c',
  },
} as const;

/**
 * Section 6.5: Under the Hood Configuration (ExpandableSection)
 * Collapsible technical details
 */
export const B2C_UNDER_THE_HOOD_CONFIG: ExpandableSectionConfig = {
  content: {
    toggleLabel: 'landing-b2c.underTheHood.toggleLabel',
    paragraphs: [
      'landing-b2c.underTheHood.paragraphs.p1',
      'landing-b2c.underTheHood.paragraphs.p2',
      'landing-b2c.underTheHood.paragraphs.p3',
      'landing-b2c.underTheHood.paragraphs.p4',
    ],
    linkText: 'landing-b2c.underTheHood.linkText',
    linkHref: '/protocols',
  },
  seo: {
    ariaLabel: 'Technical details about diBoaS architecture',
  },
  analytics: {
    sectionId: 'under-the-hood-b2c',
    category: 'landing-b2c',
  },
} as const;


/**
 * Section 7: Demo Configuration
 */
export const B2C_DEMO_CONFIG = {
  content: {
    transitionHook: 'landing-b2c.demo.transitionHook',
    header: 'landing-b2c.demo.header',
    subtext: 'landing-b2c.demo.subtext',
    ctaPrimary: 'landing-b2c.demo.ctaPrimary',
    ctaSecondary: 'landing-b2c.demo.ctaSecondary',
  },
  seo: {
    headingLevel: 'h2' as const,
    ariaLabel: 'Interactive demo section',
  },
  analytics: {
    sectionId: 'demo-section-b2c',
    category: 'landing-b2c',
  },
} as const;

/**
 * Section 9: Waitlist Configuration
 */
export const B2C_WAITLIST_CONFIG = {
  sectionId: 'waitlist-section-b2c',
  backgroundColor: 'var(--section-bg-brand)',
  headline: 'landing-b2c.waitlist.header',
  subheadline: 'landing-b2c.waitlist.description',
  hideBenefits: true,
  hideNoSpam: true,
  source: 'landing_b2c' as const,
} as const;

/**
 * Section 8.5: About the Founder Configuration (FounderSection)
 * Circular photo + bio paragraphs + contact
 */
export const B2C_FOUNDER_CONFIG: FounderSectionConfig = {
  content: {
    header: 'landing-b2c.founder.header',
    paragraphs: [
      'landing-b2c.founder.paragraphs.p1',
      'landing-b2c.founder.paragraphs.p2',
      'landing-b2c.founder.paragraphs.p3',
    ],
    emailText: 'landing-b2c.founder.emailText',
    emailHref: 'hello@diboas.com',
    socialLinks: [
      { label: 'landing-b2c.founder.social.linkedin', href: 'https://www.linkedin.com/in/bribeirobr/', icon: 'linkedin' },
      { label: 'landing-b2c.founder.social.x', href: 'https://x.com/bribeiro_br', icon: 'x' },
      { label: 'landing-b2c.founder.social.substack', href: 'https://bribeirobr.substack.com/', icon: 'substack' },
    ],
  },
  seo: {
    ariaLabel: 'About the founder of diBoaS',
  },
  analytics: {
    sectionId: 'founder-b2c',
    category: 'landing-b2c',
  },
} as const;

/**
 * Section 10: FAQ Items for B2C Landing Page
 * 12 CMO-approved items
 */
export const B2C_FAQ_ITEMS: FAQItem[] = [
  {
    id: 'isBank',
    question: 'landing-b2c.faq.items.isBank.question',
    answer: 'landing-b2c.faq.items.isBank.answer',
    category: 'general'
  },
  {
    id: 'isForEveryone',
    question: 'landing-b2c.faq.items.isForEveryone.question',
    answer: 'landing-b2c.faq.items.isForEveryone.answer',
    category: 'general'
  },
  {
    id: 'withdraw',
    question: 'landing-b2c.faq.items.withdraw.question',
    answer: 'landing-b2c.faq.items.withdraw.answer',
    category: 'fees'
  },
  {
    id: 'safety',
    question: 'landing-b2c.faq.items.safety.question',
    answer: 'landing-b2c.faq.items.safety.answer',
    category: 'security'
  },
  {
    id: 'howPossible',
    question: 'landing-b2c.faq.items.howPossible.question',
    answer: 'landing-b2c.faq.items.howPossible.answer',
    category: 'fees'
  },
  {
    id: 'minimum',
    question: 'landing-b2c.faq.items.minimum.question',
    answer: 'landing-b2c.faq.items.minimum.answer',
    category: 'getting-started'
  },
  {
    id: 'justTransfers',
    question: 'landing-b2c.faq.items.justTransfers.question',
    answer: 'landing-b2c.faq.items.justTransfers.answer',
    category: 'getting-started'
  },
  {
    id: 'understanding',
    question: 'landing-b2c.faq.items.understanding.question',
    answer: 'landing-b2c.faq.items.understanding.answer',
    category: 'getting-started'
  },
  {
    id: 'whatIfWrong',
    question: 'landing-b2c.faq.items.whatIfWrong.question',
    answer: 'landing-b2c.faq.items.whatIfWrong.answer',
    category: 'security'
  },
  {
    id: 'shutdown',
    question: 'landing-b2c.faq.items.shutdown.question',
    answer: 'landing-b2c.faq.items.shutdown.answer',
    category: 'security'
  },
  {
    id: 'audited',
    question: 'landing-b2c.faq.items.audited.question',
    answer: 'landing-b2c.faq.items.audited.answer',
    category: 'security'
  },
  {
    id: 'afterSignup',
    question: 'landing-b2c.faq.items.afterSignup.question',
    answer: 'landing-b2c.faq.items.afterSignup.answer',
    category: 'getting-started'
  }
];

/**
 * Section 10: FAQ Section Configuration
 */
export const B2C_FAQ_CONFIG: FAQAccordionVariantConfig = {
  variant: 'default',
  content: {
    title: 'landing-b2c.faq.header',
    description: '',
    ctaText: '',
    ctaHref: '',
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
 * Section 11: Footer disclaimer key
 */
export const B2C_DISCLAIMER_KEY = 'landing-b2c.footer.disclosures.general';

/**
 * Footer nav links for B2C landing page
 */
export const B2C_FOOTER_NAV = [
  { id: 'forYou', labelKey: 'landing-b2c.footer.nav.forYou', href: ROUTES.HOME },
  { id: 'forBusiness', labelKey: 'landing-b2c.footer.nav.forBusiness', href: ROUTES.BUSINESS_LANDING },
  { id: 'adelaideDaily', labelKey: 'landing-b2c.footer.nav.adelaideDaily', href: ROUTES.DAILY_MARKET },
  { id: 'about', labelKey: 'landing-b2c.footer.nav.about', href: ROUTES.ABOUT },
  { id: 'strategies', labelKey: 'landing-b2c.footer.nav.strategies', href: ROUTES.STRATEGIES },
  { id: 'protocols', labelKey: 'landing-b2c.footer.nav.protocols', href: ROUTES.PROTOCOLS },
  { id: 'help', labelKey: 'landing-b2c.footer.nav.help', href: '/help' },
] as const;

/**
 * Footer disclosure keys, locale-conditional
 */
export const B2C_FOOTER_DISCLOSURES = {
  // All locales
  general: 'landing-b2c.footer.disclosures.general',
  crypto: 'landing-b2c.footer.disclosures.crypto',
  stories: 'landing-b2c.footer.disclosures.stories',
  ai: 'landing-b2c.footer.disclosures.ai',
  closing: 'landing-b2c.footer.disclosures.closing',
  // Locale-conditional (keys may not exist in all locales)
  mica: 'landing-b2c.footer.disclosures.mica',
  micaArticle7: 'landing-b2c.footer.disclosures.micaArticle7',
  cvm: 'landing-b2c.footer.disclosures.cvm',
  bcb: 'landing-b2c.footer.disclosures.bcb',
  us: 'landing-b2c.footer.disclosures.us',
} as const;
