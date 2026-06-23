/**
 * B2C Landing Page Configuration
 *
 * Domain-Driven Design: B2C landing page domain configuration
 * Service Agnostic Abstraction: Decoupled content from presentation
 * Configuration Management: Centralized landing page content
 * No Hardcoded Values: All values from design tokens and i18n keys
 *
 * 15-Section Layout + Footer (Visual Overhaul v2):
 * 1.  Hero — Dark bg with headline and CTA
 * 2.  ComparisonTable — Rate comparison (NEW)
 * 3.  GoalExampleCards — Expandable goal cards (NEW)
 * 4.  SidePocketStrip — Brand-tinted breathing strip (NEW)
 * 5.  Adelaide Story (ProseSection) — warm bg
 * 6.  How It Works Detailed — 3-card static grid (NEW)
 * 7.  Money That Moves (AppFeaturesCarousel) — 4 feature cards
 * 8.  Fee Table — Transparent fee table
 * 9.  What's the Catch? (ProseSection) — dark bg
 * 10. Under the Hood (ExpandableSection)
 * 11. Demo (DemoLauncher)
 * 12. Founding Members (NEW wrapper)
 * 13. Built by Bar (FounderSection)
 * 14. Waitlist — dark bg
 * 15. FAQ (top 5; full FAQ at /help)
 * —  Footer (MinimalFooter)
 */

import { ROUTES } from './routes';
import type { FAQAccordionVariantConfig, FAQItem } from './faqAccordion';
import type { HeroVariantConfig } from './hero';
import type { AppFeaturesCarouselVariantConfig } from './appFeaturesCarousel';
import type { ProseSectionConfig } from './proseSection';
import type { FeeTableConfig } from './feeTable';
import type { ExpandableSectionConfig } from './expandableSection';
import type { FounderSectionConfig } from './founderSection';
/**
 * B2C Landing Page Image Paths
 * Handoff naming convention: /assets/images/{section}-{name}.avif
 */
const B2C_IMAGES = {
  hero: '/assets/images/soft-arrival.avif',
  heroMobile: '/assets/images/soft-arrival.avif',
  step1: '/assets/images/seamless-pay.avif',
  step2: '/assets/images/quiet-growth.avif',
  step3: '/assets/images/pocket-clarity.avif',
  featureSend: '/assets/images/points-of-connection.avif',
  featureGoals: '/assets/images/brewed-focus.avif',
  featureAlwaysOn: '/assets/images/moment-of-ease.avif',
  originStory: '/assets/images/saved-through-time.avif',
  catchSection: '/assets/images/quiet-horizon.avif',
  heroBand: '/assets/images/still-tide.avif',
} as const;

/**
 * Section 1: Hero Configuration
 * CTA scrolls to #comparison (first proof section)
 */
export const B2C_HERO_CONFIG: HeroVariantConfig = {
  variant: 'cinematic',
  content: {
    title: 'landing-b2c.hero.headline',
    description: 'landing-b2c.hero.subheadline',
    ctaText: 'landing-b2c.hero.cta',
    ctaHref: '#comparison',
    ctaTarget: '_self',
  },
  cinematic: {
    scene: 'dawn-water',
    theme: 'dark',
    align: 'left',
    sectionId: 'hero-b2c',
    posterImage: B2C_IMAGES.heroBand,
    posterDuotone: true,
  },
  seo: {
    titleTag: 'diBoaS - Make Your Money Work',
    imageAlt: {
      background: 'Financial growth background illustration',
    },
  },
  analytics: {
    trackingPrefix: 'hero_b2c_landing',
    enabled: true,
  },
} as const;

/**
 * Section 5: Adelaide Story Configuration (ProseSection)
 * "Her name was Adelaide.", warm background, paragraphs + transition hook
 */
export const B2C_ORIGIN_STORY_CONFIG: ProseSectionConfig = {
  content: {
    eyebrow: 'landing-b2c.eyebrows.story',
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
    ariaLabel: 'landing-b2c.sections.originStory.ariaLabel',
  },
  analytics: {
    sectionId: 'origin-story-b2c',
    category: 'landing-b2c',
  },
} as const;

/**
 * Section 7: Money That Moves Configuration (AppFeaturesCarousel)
 * 4 feature cards: Send, Invest, Track, Buy
 */
export const B2C_HOW_IT_WORKS_CONFIG: AppFeaturesCarouselVariantConfig = {
  variant: 'default',
  sectionTitle: 'landing-b2c.howItWorks.header',
  cards: [
    {
      id: 'step-1-send-receive',
      content: {
        title: 'landing-b2c.howItWorks.step1.title',
        description: 'landing-b2c.howItWorks.step1.description',
      },
      assets: {
        image: B2C_IMAGES.step1,
      },
      seo: {
        imageAlt: 'landing-b2c.howItWorks.step1.imageAlt',
      },
    },
    {
      id: 'step-2-invest-grow',
      content: {
        title: 'landing-b2c.howItWorks.step2.title',
        description: 'landing-b2c.howItWorks.step2.description',
      },
      assets: {
        image: B2C_IMAGES.step2,
      },
      seo: {
        imageAlt: 'landing-b2c.howItWorks.step2.imageAlt',
      },
    },
    {
      id: 'step-3-track-learn',
      content: {
        title: 'landing-b2c.howItWorks.step3.title',
        description: 'landing-b2c.howItWorks.step3.description',
      },
      assets: {
        image: B2C_IMAGES.step3,
      },
      seo: {
        imageAlt: 'landing-b2c.howItWorks.step3.imageAlt',
      },
    },
    {
      id: 'step-4-buy-hold',
      content: {
        title: 'landing-b2c.howItWorks.step4.title',
        description: 'landing-b2c.howItWorks.step4.description',
      },
      assets: {
        image: '/assets/images/future-in-hand.avif',
      },
      seo: {
        imageAlt: 'landing-b2c.howItWorks.step4.imageAlt',
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
    trackingPrefix: 'money_that_moves_b2c',
    enabled: true,
  },
};

/**
 * Section 8: Fees Configuration (FeeTable)
 * 8 fee rows, 5-column comparison layout with examples — UNCHANGED
 */
export const B2C_FEES_CONFIG: FeeTableConfig = {
  content: {
    transitionHook: 'landing-b2c.fees.transitionHook',
    title: 'landing-b2c.fees.title',
    painIntro: '',
    disclaimer: 'landing-b2c.fees.disclaimer',
    example: '',
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
    ariaLabel: 'landing-b2c.sections.feeTable.ariaLabel',
  },
  analytics: {
    sectionId: 'fees-b2c',
    category: 'landing-b2c',
  },
} as const;

/**
 * Section 9: What's the Catch? Configuration (ProseSection)
 * Dark background, honest transparency
 */
export const B2C_CATCH_CONFIG: ProseSectionConfig = {
  content: {
    eyebrow: 'landing-b2c.eyebrows.honest',
    header: 'landing-b2c.catch.header',
    paragraphs: [
      'landing-b2c.catch.paragraphs.p1',
      'landing-b2c.catch.paragraphs.p2',
      'landing-b2c.catch.paragraphs.p3',
      'landing-b2c.catch.paragraphs.p4',
      'landing-b2c.catch.paragraphs.p5',
      'landing-b2c.catch.paragraphs.p6',
    ],
    // Phase 8 Item B (CC8 closeout): inject the parameterized fee citation
    // at locale-specific narrative position. pt-BR's BRL framing in p2-p3
    // shifts the fee citation forward (replacing p4 = index 3) compared to
    // en/es/de (replacing p5 = index 4). The literal `p4`/`p5` text in JSON
    // remains as dead-data for translation parity but is REPLACED at render
    // time by `feeParagraph` whose values come from buildAllFeeValues.
    feeParagraph: 'landing-b2c.catch.feeParagraph',
    feeParagraphAt: { en: 4, es: 4, de: 4, 'pt-BR': 3 },
  },
  image: {
    src: B2C_IMAGES.catchSection,
    alt: 'diBoaS app showing transparent features',
    position: 'left',
  },
  style: {
    backgroundColor: 'var(--section-bg-dark)',
    verticalPadding: 'standard',
    headerStyle: 'centered',
  },
  seo: {
    ariaLabel: 'landing-b2c.sections.honestCatch.ariaLabel',
  },
  analytics: {
    sectionId: 'catch-b2c',
    category: 'landing-b2c',
  },
} as const;

/**
 * Section 10: Under the Hood Configuration (ExpandableSection)
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
    ariaLabel: 'landing-b2c.sections.techDetails.ariaLabel',
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
    header: 'landing-b2c.demo.header',
    subtext: 'landing-b2c.demo.subtext',
    ctaPrimary: 'landing-b2c.demo.ctaPrimary',
    ctaSecondary: 'landing-b2c.demo.ctaSecondary',
  },
  seo: {
    headingLevel: 'h2' as const,
    ariaLabel: 'landing-b2c.sections.demo.ariaLabel',
  },
  analytics: {
    sectionId: 'demo-section-b2c',
    category: 'landing-b2c',
  },
} as const;

/**
 * Section 14: Waitlist Configuration
 * Dark background variant
 */
export const B2C_WAITLIST_CONFIG = {
  sectionId: 'waitlist-section-b2c',
  backgroundColor: 'var(--section-bg-dark)',
  headline: 'landing-b2c.waitlist.header',
  subheadline: 'landing-b2c.waitlist.description',
  hideBenefits: true,
  hideNoSpam: true,
  source: 'landing_b2c' as const,
} as const;

/**
 * Section 13: Built by Bar Configuration (FounderSection)
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
      {
        label: 'landing-b2c.founder.social.linkedin',
        href: 'https://www.linkedin.com/in/bribeirobr/',
        icon: 'linkedin',
      },
      { label: 'landing-b2c.founder.social.x', href: 'https://x.com/bribeiro_br', icon: 'x' },
      {
        label: 'landing-b2c.founder.social.substack',
        href: 'https://bribeirobr.substack.com/',
        icon: 'substack',
      },
    ],
  },
  seo: {
    ariaLabel: 'landing-b2c.sections.founder.ariaLabel',
  },
  analytics: {
    sectionId: 'founder-b2c',
    category: 'landing-b2c',
  },
} as const;

/**
 * Section 15: FAQ Items for B2C Landing Page
 * 5 items — top questions; full FAQ available at /help.
 * All FAQ content is sourced from the canonical `faq.json` namespace
 * (Phase 8 Item A consolidation — single source of truth for /help, /, /business).
 */
export const B2C_FAQ_ITEMS: FAQItem[] = [
  {
    id: 'isBank',
    question: 'faq.items.isBank.question',
    answer: 'faq.items.isBank.answer',
    category: 'general',
  },
  {
    id: 'safety',
    question: 'faq.items.safety.question',
    answer: 'faq.items.safety.answer',
    category: 'security',
  },
  {
    id: 'howPossible',
    question: 'faq.items.howPossible.question',
    answer: 'faq.items.howPossible.answer',
    category: 'fees',
  },
  {
    id: 'withdraw',
    question: 'faq.items.withdraw.question',
    answer: 'faq.items.withdraw.answer',
    category: 'fees',
  },
  {
    id: 'afterSignup',
    question: 'faq.items.afterSignup.question',
    answer: 'faq.items.afterSignup.answer',
    category: 'getting-started',
  },
];

/**
 * Section 15: FAQ Section Configuration
 */
export const B2C_FAQ_CONFIG: FAQAccordionVariantConfig = {
  variant: 'default',
  content: {
    title: 'landing-b2c.faq.header',
    description: '',
    ctaText: '',
    ctaHref: '',
    items: B2C_FAQ_ITEMS,
  },
  settings: {
    enableAnimations: true,
    animationDuration: 400,
    autoClose: true,
    enableKeyboardNav: true,
    scrollIntoView: true,
  },
  seo: {
    ariaLabel: 'landing-b2c.sections.faq.ariaLabel',
    region: 'faq',
  },
  analytics: {
    trackingPrefix: 'faq_b2c_landing',
    enabled: true,
  },
};

/**
 * Footer disclaimer key
 */
export const B2C_DISCLAIMER_KEY = 'landing-b2c.footer.disclosures.general';

/**
 * Footer nav links for B2C landing page
 */
export const B2C_FOOTER_NAV = [
  { id: 'forYou', labelKey: 'landing-b2c.footer.nav.forYou', href: ROUTES.HOME },
  {
    id: 'forBusiness',
    labelKey: 'landing-b2c.footer.nav.forBusiness',
    href: ROUTES.BUSINESS_LANDING,
  },
  // Surfaced in the footer too (redesign Phase 1) → the /tools hub indexes all 10.
  { id: 'moneyTools', labelKey: 'landing-b2c.footer.nav.moneyTools', href: ROUTES.TOOLS },
  // 2026-05-13: route renamed to `/market`; label "Adelaide Daily" stays.
  { id: 'adelaideDaily', labelKey: 'landing-b2c.footer.nav.adelaideDaily', href: ROUTES.MARKET },
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
