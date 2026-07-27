/**
 * B2C Landing Page Configuration
 *
 * Domain-Driven Design: B2C landing page domain configuration
 * Service Agnostic Abstraction: Decoupled content from presentation
 * Configuration Management: Centralized landing page content
 * No Hardcoded Values: All values from design tokens and i18n keys
 *
 * NOTE (2026-07-07, MSG-07): the legacy 15-section composition this file once
 * described was retired by the Draper redesign. The rendered compositions live
 * in `landing-b2c-eu.ts` (en/de/es) and `landing-b2c-ptbr.ts` (pt-BR); this
 * file retains only the shared live exports: B2C_FEES_CONFIG, B2C_FAQ_ITEMS/
 * B2C_FAQ_CONFIG, B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES.
 */

import { ROUTES } from './routes';
import type { FAQAccordionVariantConfig } from './faqAccordion';
import { getFAQForSurface } from './faqRegistry';
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
 * All FAQ content is sourced from the canonical `faq.json` namespace via the FAQ
 * registry (single source of truth for /help, /, /business — 2026-07-13 SSOT).
 */
export const B2C_FAQ_ITEMS = getFAQForSurface('landing');

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
  // 2026-05-13: route renamed to `/market`; label "Adelaide Market" stays.
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
  micaArticle7: 'landing-b2c.footer.disclosures.micaArticle7',
  cvm: 'landing-b2c.footer.disclosures.cvm',
  bcb: 'landing-b2c.footer.disclosures.bcb',
  us: 'landing-b2c.footer.disclosures.us',
} as const;

/**
 * Page-specific footer disclosures. Passed to <MinimalFooter extraDisclosureKeys>
 * so they render on one surface only, never in the site-wide footer.
 *
 * `/market` (Adelaide Market) carries the forward-looking analyst-opinion note —
 * CVM-flavoured but shown in all locales, since the regime analysis is
 * forward-looking on every locale of that page.
 */
export const MARKET_FOOTER_EXTRA_DISCLOSURES = [
  'landing-b2c.footer.disclosures.marketAnalysis',
] as const;
