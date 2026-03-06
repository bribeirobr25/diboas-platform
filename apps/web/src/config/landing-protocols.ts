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

import { DEFAULT_FAQ_ACCORDION_SETTINGS } from '@/config/faqAccordion';
import type { FAQAccordionVariantConfig, FAQItem } from '@/config/faqAccordion';

// ─── i18n Prefix (Pattern B: dynamic components) ────────────

/** The i18n namespace prefix for the Protocols page. */
export const PROTOCOLS_I18N_PREFIX = 'protocols' as const;

// ─── FAQ Configuration ──────────────────────────────────────

const PROTOCOLS_FAQ_ITEM_IDS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'] as const;

const PROTOCOLS_FAQ_ITEMS: FAQItem[] = PROTOCOLS_FAQ_ITEM_IDS.map((itemId) => ({
  id: `faq-${itemId}`,
  question: `${PROTOCOLS_I18N_PREFIX}.faq.${itemId}.question`,
  answer: `${PROTOCOLS_I18N_PREFIX}.faq.${itemId}.answer`,
  category: 'general' as const,
}));

/**
 * FAQ Accordion config for the Protocols page.
 *
 * 8 questions covering protocol selection, due diligence,
 * TVL interpretation, and regulatory context.
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
    ariaLabel: 'Protocol frequently asked questions',
    region: 'faq',
  },
  analytics: {
    trackingPrefix: 'faq_protocols',
    enabled: true,
  },
};

// ─── Footer Disclaimer Keys (locale-conditional) ────────────

/**
 * Returns the ordered list of footer disclaimer translation keys
 * for the Protocols page, conditioned on the active locale.
 *
 * MiCA Art. 68 / Art. 7: EN, DE, ES only
 * US disclosure: EN only
 * All other disclaimers: every locale
 *
 * Keys are relative to the `protocols` namespace —
 * e.g. `'footer.lastUpdated'` resolves to `protocols.footer.lastUpdated`.
 */
export function getProtocolsDisclaimerKeys(locale: string): string[] {
  const keys: string[] = [
    'footer.lastUpdated',
    'footer.dataSources',
    'footer.mainDisclaimer',
  ];

  if (['en', 'de', 'es'].includes(locale)) {
    keys.push('footer.micaArt68');
    keys.push('footer.micaArt7');
  }

  keys.push('footer.aiDisclosure');

  if (locale === 'en') {
    keys.push('footer.usDisclosure');
  }

  keys.push('footer.externalLinks');
  keys.push('footer.professionalAdvice');
  keys.push('footer.copyright');

  return keys;
}
