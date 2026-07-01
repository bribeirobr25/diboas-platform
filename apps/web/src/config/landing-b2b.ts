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

import type { TwoWorldsSectionConfig } from './twoWorldsSection';

import type { ScenarioCardsConfig } from './scenarioCards';

/**
 * B2B Landing Page Image Paths
 */
const B2B_IMAGES = {
  hero: '/assets/images/business-hero.jpg',
  twoWorldsPayments: '/assets/images/business-card-payments.jpg',
  twoWorldsTreasury: '/assets/images/business-idle-cash.jpg',
  originStory: '/assets/images/business-small-shop.jpg',
  featureGetPaid: '/assets/images/seamless-pay.avif',
  featurePayAnyone: '/assets/images/points-of-connection.avif',
  featureAdelaide: '/assets/images/brewed-focus.avif',
  featureRecords: '/assets/images/business-records.jpg',
  carouselConnect: '/assets/images/digital-nearness.avif',
  carouselRules: '/assets/images/private-control.avif',
  carouselWorks: '/assets/images/quiet-growth.avif',
  carouselAccess: '/assets/images/moments-we-share.avif',
  founderPhoto: '/assets/images/power-of-us.avif',
} as const;

// ─── Section 1: Hero ─────────────────────────────────────────

export const B2B_HERO_CONFIG: HeroVariantConfig = {
  variant: 'fullBackground',
  content: {
    title: 'landing-b2b.hero.headline',
    description: 'landing-b2b.hero.subheadline',
    ctaText: 'landing-b2b.hero.cta',
    ctaHref: '#two-worlds',
    ctaTarget: '_self',
  },
  backgroundAssets: {
    backgroundImage: B2B_IMAGES.hero,
    backgroundImageMobile: B2B_IMAGES.hero,
    // Dark overlay for white-text legibility over the daylight skyline photo.
    overlayOpacity: 0.55,
  },
  seo: {
    titleTag: 'diBoaS for Business | Stop Overpaying on Fees and Idle Cash',
    imageAlt: {
      background: 'landing-b2b.hero.imageAlt',
    },
  },
  analytics: {
    trackingPrefix: 'hero_b2b_landing',
    enabled: true,
  },
} as const;

// ─── Section 2: Two Worlds (NEW) ─────────────────────────────

export const B2B_TWO_WORLDS_CONFIG: TwoWorldsSectionConfig = {
  content: {
    header: 'landing-b2b.twoWorlds.header',
    cardA: {
      headline: 'landing-b2b.twoWorlds.cardA.headline',
      body: 'landing-b2b.twoWorlds.cardA.body',
      cta: 'landing-b2b.twoWorlds.cardA.cta',
      ctaHref: '/tools/card-fees',
      image: B2B_IMAGES.twoWorldsPayments,
      imageAlt: 'landing-b2b.twoWorlds.cardA.imageAlt',
    },
    cardB: {
      headline: 'landing-b2b.twoWorlds.cardB.headline',
      body: 'landing-b2b.twoWorlds.cardB.body',
      cta: 'landing-b2b.twoWorlds.cardB.cta',
      ctaHref: '/tools/idle-cash',
      image: B2B_IMAGES.twoWorldsTreasury,
      imageAlt: 'landing-b2b.twoWorlds.cardB.imageAlt',
    },
  },
  seo: {
    ariaLabel: 'landing-b2b.sections.systemCosts.ariaLabel',
  },
  analytics: {
    sectionId: 'two-worlds-b2b',
    category: 'landing-b2b',
  },
};

// ─── Section 3: Origin Story (ProseSection) ───────────────────

export const B2B_ORIGIN_STORY_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2b.origin.header',
    paragraphs: [
      'landing-b2b.origin.paragraphs.0',
      'landing-b2b.origin.paragraphs.1',
      'landing-b2b.origin.paragraphs.2',
      'landing-b2b.origin.paragraphs.3',
      'landing-b2b.origin.paragraphs.4',
    ],
  },
  image: {
    src: B2B_IMAGES.originStory,
    alt: 'Person holding a phone with diBoaS app',
    position: 'right',
  },
  style: {
    backgroundColor: 'var(--section-bg-warm)',
    verticalPadding: 'standard',
  },
  seo: {
    ariaLabel: 'landing-b2b.sections.originStory.ariaLabel',
  },
  analytics: {
    sectionId: 'origin-story-b2b',
    category: 'landing-b2b',
  },
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
        description: 'landing-b2b.howItWorks.steps.connect.description',
      },
      assets: {
        image: B2B_IMAGES.carouselConnect,
      },
      seo: {
        imageAlt: 'landing-b2b.howItWorks.steps.connect.imageAlt',
      },
    },
    {
      id: 'step-rules',
      content: {
        title: 'landing-b2b.howItWorks.steps.rules.title',
        description: 'landing-b2b.howItWorks.steps.rules.description',
      },
      assets: {
        image: B2B_IMAGES.carouselRules,
      },
      seo: {
        imageAlt: 'landing-b2b.howItWorks.steps.rules.imageAlt',
      },
    },
    {
      id: 'step-works',
      content: {
        title: 'landing-b2b.howItWorks.steps.works.title',
        description: 'landing-b2b.howItWorks.steps.works.description',
      },
      assets: {
        image: B2B_IMAGES.carouselWorks,
      },
      seo: {
        imageAlt: 'landing-b2b.howItWorks.steps.works.imageAlt',
      },
    },
    {
      id: 'step-access',
      content: {
        title: 'landing-b2b.howItWorks.steps.access.title',
        description: 'landing-b2b.howItWorks.steps.access.description',
      },
      assets: {
        image: B2B_IMAGES.carouselAccess,
      },
      seo: {
        imageAlt: 'landing-b2b.howItWorks.steps.access.imageAlt',
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
    trackingPrefix: 'how_it_works_b2b',
    enabled: true,
  },
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
      imageAlt: 'landing-b2b.features.cards.getPaid.imageAlt',
    },
    {
      id: 'feature-pay-anyone',
      title: 'landing-b2b.features.cards.payAnyone.headline',
      description: 'landing-b2b.features.cards.payAnyone.body',
      backgroundImage: B2B_IMAGES.featurePayAnyone,
      imageAlt: 'landing-b2b.features.cards.payAnyone.imageAlt',
    },
    {
      id: 'feature-adelaide',
      title: 'landing-b2b.features.cards.adelaide.headline',
      description: 'landing-b2b.features.cards.adelaide.body',
      backgroundImage: B2B_IMAGES.featureAdelaide,
      imageAlt: 'landing-b2b.features.cards.adelaide.imageAlt',
    },
    {
      // Spec §8 4th card: "Records for real operations" (transaction history,
      // statements, exportable records for accounting/tax/audit).
      id: 'feature-records',
      title: 'landing-b2b.features.cards.records.headline',
      description: 'landing-b2b.features.cards.records.body',
      backgroundImage: B2B_IMAGES.featureRecords,
      imageAlt: 'landing-b2b.features.cards.records.imageAlt',
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

// ─── Section 8: Fee Transparency (FeeTable) ──────────────────

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
      example: 'landing-b2b.fees.headers.example',
    },
    rows: [
      {
        id: 'account',
        action: 'landing-b2b.fees.rows.account.action',
        diboas: 'landing-b2b.fees.rows.account.diboas',
        competitors: 'landing-b2b.fees.rows.account.competitors',
        difference: 'landing-b2b.fees.rows.account.difference',
        example: 'landing-b2b.fees.rows.account.example',
        isFree: true,
      },
      {
        id: 'receive',
        action: 'landing-b2b.fees.rows.receive.action',
        diboas: 'landing-b2b.fees.rows.receive.diboas',
        competitors: 'landing-b2b.fees.rows.receive.competitors',
        difference: 'landing-b2b.fees.rows.receive.difference',
        example: 'landing-b2b.fees.rows.receive.example',
        // P1-6: receiving is $0 only between diBoaS users in digital dollars; a
        // card-funded payment is an on-ramp (0.48% + processor). Not unconditionally free.
        isFree: false,
      },
      {
        id: 'send',
        action: 'landing-b2b.fees.rows.send.action',
        diboas: 'landing-b2b.fees.rows.send.diboas',
        competitors: 'landing-b2b.fees.rows.send.competitors',
        difference: 'landing-b2b.fees.rows.send.difference',
        example: 'landing-b2b.fees.rows.send.example',
        // P1-6: sending is $0 only between diBoaS users in digital dollars; paying
        // an external account is an off-ramp (0.48%). Not unconditionally free.
        isFree: false,
      },
      {
        id: 'add',
        action: 'landing-b2b.fees.rows.add.action',
        diboas: 'landing-b2b.fees.rows.add.diboas',
        competitors: 'landing-b2b.fees.rows.add.competitors',
        difference: 'landing-b2b.fees.rows.add.difference',
        example: 'landing-b2b.fees.rows.add.example',
      },
      {
        id: 'invest',
        action: 'landing-b2b.fees.rows.invest.action',
        diboas: 'landing-b2b.fees.rows.invest.diboas',
        competitors: 'landing-b2b.fees.rows.invest.competitors',
        difference: 'landing-b2b.fees.rows.invest.difference',
        example: 'landing-b2b.fees.rows.invest.example',
        isFree: true,
      },
      {
        id: 'sell',
        action: 'landing-b2b.fees.rows.sell.action',
        diboas: 'landing-b2b.fees.rows.sell.diboas',
        competitors: 'landing-b2b.fees.rows.sell.competitors',
        difference: 'landing-b2b.fees.rows.sell.difference',
        example: 'landing-b2b.fees.rows.sell.example',
      },
      {
        id: 'swap',
        action: 'landing-b2b.fees.rows.swap.action',
        diboas: 'landing-b2b.fees.rows.swap.diboas',
        competitors: 'landing-b2b.fees.rows.swap.competitors',
        difference: 'landing-b2b.fees.rows.swap.difference',
        example: 'landing-b2b.fees.rows.swap.example',
        isFree: true,
      },
      {
        id: 'cashOut',
        action: 'landing-b2b.fees.rows.cashOut.action',
        diboas: 'landing-b2b.fees.rows.cashOut.diboas',
        competitors: 'landing-b2b.fees.rows.cashOut.competitors',
        difference: 'landing-b2b.fees.rows.cashOut.difference',
        example: 'landing-b2b.fees.rows.cashOut.example',
      },
    ],
  },
  // Lean mode (parity with the b2c landing fee table): collapse to the first 3
  // rows; an "expand" control reveals the remaining rows. The toggle label
  // reuses the b2c "See the full cost" key (landing-b2c is loaded on this page),
  // which also gives the button its accessible name (a11y: button-name).
  previewRows: 3,
  expandToggleLabel: 'landing-b2c.comparison.disclosureToggle',
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'landing-b2b.sections.feeTable.ariaLabel',
  },
  analytics: {
    sectionId: 'fees-b2b',
    category: 'landing-b2b',
  },
};

// ─── Section 10: Fit Assessment (BenefitsCards) ──────────────

export const B2B_FIT_ASSESSMENT_CONFIG: BenefitsCardsConfig = {
  section: {
    title: 'landing-b2b.fitAssessment.header',
    backgroundColor: 'enterprise',
  },
  cards: [
    {
      id: 'good-fit',
      icon: 'check-circle',
      title: 'landing-b2b.fitAssessment.goodFit.title',
      description: 'landing-b2b.fitAssessment.goodFit.description',
      iconAlt: 'landing-b2b.fitAssessment.goodFit.iconAlt',
    },
    {
      id: 'not-a-fit',
      icon: 'x-circle',
      title: 'landing-b2b.fitAssessment.notAFit.title',
      description: 'landing-b2b.fitAssessment.notAFit.description',
      iconAlt: 'landing-b2b.fitAssessment.notAFit.iconAlt',
    },
  ],
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'landing-b2b.sections.rightForYou.ariaLabel',
  },
  analytics: {
    sectionId: 'fit-assessment-b2b',
    category: 'landing-b2b',
  },
};

// ─── Section 11: About the Founder (FounderSection) ──────────

export const B2B_FOUNDER_CONFIG: FounderSectionConfig = {
  content: {
    header: 'landing-b2b.founder.header',
    paragraphs: [
      'landing-b2b.founder.paragraphs.versionB.0',
      'landing-b2b.founder.paragraphs.versionB.1',
      'landing-b2b.founder.email',
    ],
    emailText: 'landing-b2b.founder.emailAddress',
    emailHref: 'hello@diboas.com',
    socialLinks: [
      {
        label: 'landing-b2b.founder.social.linkedin',
        href: 'https://www.linkedin.com/in/bribeirobr/',
        icon: 'linkedin',
      },
      { label: 'landing-b2b.founder.social.x', href: 'https://x.com/bribeiro_br', icon: 'x' },
      {
        label: 'landing-b2b.founder.social.substack',
        href: 'https://bribeirobr.substack.com/',
        icon: 'substack',
      },
    ],
  },
  seo: {
    ariaLabel: 'landing-b2b.sections.founder.ariaLabel',
  },
  analytics: {
    sectionId: 'founder-b2b',
    category: 'landing-b2b',
  },
};

// ─── Section 12: Waitlist Configuration ─────────────────────

export const B2B_WAITLIST_CONFIG = {
  sectionId: 'waitlist-section-b2b',
  backgroundColor: 'var(--section-bg-dark)',
  headline: 'landing-b2b.waitlist.header',
  subheadline: 'landing-b2b.waitlist.description',
  hideBenefits: true,
  hideNoSpam: false,
  namespace: 'landing-b2b.waitlist',
  confirmationNamespace: 'landing-b2b.waitlistSuccess',
  source: 'landing_b2b' as const,
} as const;

// ─── Section 13: FAQ (5 items) — top questions; full FAQ at /help ─
// All FAQ content is sourced from the canonical `faq.json` namespace
// (Phase 8 Item A consolidation — single source of truth for /help, /, /business).
// `safetyBusiness` is the B2B-tailored variant of `safety` (B2C/help use the
// consumer-friendly variant); per-surface variants preserve audience tone.

export const B2B_FAQ_ITEMS: FAQItem[] = [
  {
    id: 'catch',
    question: 'faq.items.catch.question',
    answer: 'faq.items.catch.answer',
    category: 'general',
  },
  {
    id: 'safety',
    question: 'faq.items.safetyBusiness.question',
    answer: 'faq.items.safetyBusiness.answer',
    category: 'security',
  },
  {
    id: 'payments',
    question: 'faq.items.payments.question',
    answer: 'faq.items.payments.answer',
    category: 'operations',
  },
  {
    id: 'compliance',
    question: 'faq.items.compliance.question',
    answer: 'faq.items.compliance.answer',
    category: 'compliance',
  },
  {
    id: 'risk',
    question: 'faq.items.risk.question',
    answer: 'faq.items.risk.answer',
    category: 'security',
  },
];

export const B2B_FAQ_CONFIG: FAQAccordionVariantConfig = {
  variant: 'default',
  content: {
    title: 'landing-b2b.faq.header',
    description: '',
    ctaText: '',
    ctaHref: '#waitlist',
    items: B2B_FAQ_ITEMS,
  },
  settings: {
    enableAnimations: true,
    animationDuration: 400,
    autoClose: true,
    enableKeyboardNav: true,
    scrollIntoView: true,
  },
  seo: {
    ariaLabel: 'landing-b2b.sections.faq.ariaLabel',
    region: 'faq',
  },
  analytics: {
    trackingPrefix: 'faq_b2b_landing',
    enabled: true,
  },
};
