/**
 * Protocols Page Configuration — Phase 3B
 *
 * Config-driven composition for the Protocols landing page.
 * Extracts FAQ, i18n prefix, and disclaimer logic from the
 * ProtocolsPageContent orchestrator into declarative config objects.
 *
 * i18n prefix: 'protocols' — resolved automatically by the
 * config-translator system for keys starting with 'protocols.'.
 *
 * Domain-Driven Design: Protocols page domain configuration
 * Service Agnostic Abstraction: Decoupled content from presentation
 */

import {
  DEFAULT_FAQ_ACCORDION_SETTINGS,
  type FAQAccordionVariantConfig,
} from '@/config/faqAccordion';
import { getFAQForSurface } from '@/config/faqRegistry';

// ─── i18n Prefix (Pattern B: dynamic components) ────────────

/** The i18n namespace prefix for the Protocols page. */
export const PROTOCOLS_I18N_PREFIX = 'protocols' as const;

// ─── FAQ Configuration ──────────────────────────────────────
// Content is sourced from the canonical `faq.json` namespace via the FAQ registry
// (2026-07-13 SSOT consolidation — the page's own `protocols.faq.qN` block was
// byte-identical to the canonical ids and has been removed).

const PROTOCOLS_FAQ_ITEMS = getFAQForSurface('protocols');

/**
 * FAQ Accordion config for the Protocols page.
 *
 * 5 top questions — full FAQ at /help (Protocols & Transparency topic).
 */
export const PROTOCOLS_FAQ_CONFIG: FAQAccordionVariantConfig = {
  variant: 'default',
  content: {
    title: `${PROTOCOLS_I18N_PREFIX}.faq.h2`,
    description: '',
    ctaText: '',
    ctaHref: '',
    items: PROTOCOLS_FAQ_ITEMS,
  },
  settings: DEFAULT_FAQ_ACCORDION_SETTINGS,
  seo: {
    ariaLabel: 'protocols.sections.faq.ariaLabel',
    region: 'faq',
  },
  analytics: {
    trackingPrefix: 'faq_protocols',
    enabled: true,
  },
};

// getProtocolsDisclaimerKeys was removed 2026-07-07 (messaging fix plan MSG-07):
// its consumers were deleted as dead code earlier, and the per-page
// `protocols.footer.*` keys it targeted were pruned. The rendered footer uses
// MinimalFooter + B2C_FOOTER_DISCLOSURES (landing-b2c namespace).
