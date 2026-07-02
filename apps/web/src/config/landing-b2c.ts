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
import type { FeeTableConfig } from './feeTable';
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
  // Lean mode (CEO request 2026-06-26): show the first 3 fee rows; expanding
  // reveals the rest + the "See the numbers" comparison chart (passed as the
  // FeeTable `expandedSlot`). /business omits previewRows → full table.
  previewRows: 3,
  expandToggleLabel: 'landing-b2c.comparison.disclosureToggle',
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
  { id: 'investors', labelKey: 'landing-b2c.footer.nav.investors', href: ROUTES.INVESTORS },
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
