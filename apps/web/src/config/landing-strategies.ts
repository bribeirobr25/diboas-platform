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

import {
  DEFAULT_FAQ_ACCORDION_SETTINGS,
  type FAQAccordionVariantConfig,
} from '@/config/faqAccordion';
import { getFAQForSurface } from '@/config/faqRegistry';

// ─── i18n Prefix (Pattern B: dynamic components) ────────────

/** Base i18n prefix for all Strategies page translation keys. */
export const STRATEGIES_I18N_PREFIX = 'strategies' as const;

// ─── Section: FAQ (5 items) — top questions; full FAQ at /help ──
// Content is sourced from the canonical `faq.json` namespace via the FAQ registry
// (2026-07-13 SSOT consolidation). The A/B wallet-architecture answer for the
// "is my money safe?" question (canonical id `safeStrategy`) is resolved inside
// getFAQForSurface via NEXT_PUBLIC_WALLET_ARCHITECTURE.

const STRATEGIES_FAQ_ITEMS = getFAQForSurface('strategies');

/** FAQ Accordion config for the Strategies page — 5 items with A/B wallet-architecture answer for "safe". Full FAQ at /help. */
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
    ariaLabel: 'strategies.sections.faq.ariaLabel',
    region: 'faq',
  },
};
