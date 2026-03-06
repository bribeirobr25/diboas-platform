/**
 * Strategies Landing Page Configuration
 *
 * Phase 3A: Extract config objects from the StrategiesPageContent orchestrator
 * into a dedicated config file for config-driven composition.
 *
 * Sections: CVM (PT-BR only) -> Hero -> Matrix -> Cards -> Protocols -> Fees
 * -> How to Choose -> FAQ -> Waitlist -> Disclaimers
 *
 * Domain-Driven Design: Strategies page domain configuration
 * Service Agnostic Abstraction: Decoupled content from presentation
 */

import { DEFAULT_FAQ_ACCORDION_SETTINGS } from '@/config/faqAccordion';
import type { FAQAccordionVariantConfig, FAQItem } from '@/config/faqAccordion';

// ─── i18n Prefix (Pattern B: dynamic components) ────────────

/** Base i18n prefix for all Strategies page translation keys. */
export const STRATEGIES_I18N_PREFIX = 'marketing.pages.strategies' as const;

// ─── Wallet Architecture A/B Toggle ─────────────────────────

const WALLET_ARCH = process.env.NEXT_PUBLIC_WALLET_ARCHITECTURE || 'non-custodial';
const safeAnswerKey = WALLET_ARCH === 'mpc' ? 'answerB' : 'answerA';

// ─── FAQ Item IDs ───────────────────────────────────────────

const FAQ_ITEM_IDS = [
  'switch',
  'multiple',
  'rebalancing',
  'guaranteed',
  'systemProblem',
  'whereMoneyGoes',
  'fullThrottleReqs',
  'safe',
  'loseEverything',
  'bankDifference',
] as const;

// ─── Section: FAQ (10 items) ────────────────────────────────

const STRATEGIES_FAQ_ITEMS: FAQItem[] = FAQ_ITEM_IDS.map((itemId) => ({
  id: `faq-${itemId}`,
  question: `${STRATEGIES_I18N_PREFIX}.faq.items.${itemId}.question`,
  answer:
    itemId === 'safe'
      ? `${STRATEGIES_I18N_PREFIX}.faq.items.safe.${safeAnswerKey}`
      : `${STRATEGIES_I18N_PREFIX}.faq.items.${itemId}.answer`,
  category: 'general' as const,
}));

/** FAQ Accordion config for the Strategies page — 10 items with A/B wallet-architecture answer for "safe". */
export const STRATEGIES_FAQ_CONFIG: FAQAccordionVariantConfig = {
  variant: 'default',
  content: {
    title: `${STRATEGIES_I18N_PREFIX}.faq.header`,
    description: '',
    ctaText: '',
    ctaHref: '',
    items: STRATEGIES_FAQ_ITEMS,
  },
  settings: DEFAULT_FAQ_ACCORDION_SETTINGS,
  seo: {
    ariaLabel: 'Strategy frequently asked questions',
    region: 'faq',
  },
};

// ─── Section: Waitlist / CTA ────────────────────────────────

/** Waitlist section config for the Strategies page. */
export const STRATEGIES_WAITLIST_CONFIG = {
  sectionId: 'strategies-waitlist',
  headline: 'marketing.pages.strategies.waitlist.header',
  subheadline: 'marketing.pages.strategies.waitlist.body',
  belowCta: 'marketing.pages.strategies.waitlist.belowCta',
  belowCheckbox: 'marketing.pages.strategies.waitlist.belowCheckbox',
  hideBenefits: true,
  hideNoSpam: true,
} as const;
