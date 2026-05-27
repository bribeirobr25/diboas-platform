/**
 * Help Page Configuration
 *
 * 3-section layout using reusable section components:
 * 1. Hero (HeroSection centered)
 * 2. FAQ Topics (multiple FAQAccordion sections grouped by topic)
 * 3. Footer (MinimalFooter)
 *
 * Domain-Driven Design: Help page domain configuration
 * Service Agnostic Abstraction: Decoupled content from presentation
 */

import type { HeroVariantConfig } from './hero';
import type { FAQAccordionVariantConfig, FAQItem } from './faqAccordion';

// ─── Section 1: Hero ─────────────────────────────────────────

export const HELP_HERO_CONFIG: HeroVariantConfig = {
  variant: 'fullBackground',
  content: {
    title: 'landing-help.hero.title',
    description: 'landing-help.hero.subtitle',
    ctaText: '',
    ctaHref: '#getting-started',
    ctaTarget: '_self',
  },
  backgroundAssets: {
    backgroundImage: '/assets/images/soft-arrival.avif',
    backgroundImageMobile: '/assets/images/soft-arrival.avif',
    overlayOpacity: 0.3,
  },
  seo: {
    titleTag: 'Help Center | diBoaS',
    imageAlt: {
      background: 'Help Center background',
    },
  },
  analytics: {
    trackingPrefix: 'hero_help',
    enabled: true,
  },
} as const;

// ─── Section 2: FAQ Topics ───────────────────────────────────

/**
 * Topic IDs matching the translation file structure.
 * Each topic renders as a separate FAQAccordion section.
 */
export const HELP_TOPIC_IDS = [
  'gettingStarted',
  'moneySafety',
  'feesCosts',
  'investingStrategies',
  'forBusinesses',
  'protocolsTransparency',
] as const;

export type HelpTopicId = (typeof HELP_TOPIC_IDS)[number];

/**
 * Semantic-ID lists per topic — references entries in the canonical `faq.json`
 * namespace (Phase 8 Item A consolidation, 2026-05-20). Order matters: items
 * render top-to-bottom in the help accordion in the order listed here.
 *
 * To add a question to /help: add the semantic ID to the relevant topic list
 * (or coin a new ID + add the entry to `packages/i18n/translations/{locale}/faq.json`).
 */
const TOPIC_FAQ_IDS: Record<HelpTopicId, readonly string[]> = {
  gettingStarted: [
    'isBank',
    'isForEveryone',
    'minimum',
    'afterSignup',
    'whatKindOfMoney',
    'understanding',
    'micaRegulated',
    'pixFaq',
    'whySaveDollar',
  ],
  moneySafety: [
    'safety',
    'withdraw',
    'shutdown',
    'whatIfWrong',
    'lostPhone',
    'whatIsBalance',
    'liquidity',
    'whyCantTouch',
    'risk',
    'canLoseEverything',
  ],
  feesCosts: ['howPossible', 'catch', 'justTransfers'],
  investingStrategies: [
    'audited',
    'canSwitchStrategies',
    'multipleStrategies',
    'rebalancing',
    'returnsGuaranteed',
    'whereMoneyGoesProtocols',
    'protocolProblems',
    'vsBankSavings',
  ],
  forBusinesses: ['smbOrStartup', 'payments', 'compliance', 'sendMoney', 'whereMoneyGoes'],
  protocolsTransparency: [
    'protocolsListLimit',
    'protocolsUpdateFrequency',
    'protocolsRequest',
    'protocolsEndorsement',
    'protocolHacked',
    'protocolsWarningBadges',
    'tvlMeaning',
    'protocolsDirectInteraction',
  ],
};

/**
 * Human-readable labels for aria-label attributes (accessibility).
 */
const TOPIC_ARIA_LABELS: Record<HelpTopicId, string> = {
  gettingStarted: 'Getting Started',
  moneySafety: 'Money & Safety',
  feesCosts: 'Fees & Costs',
  investingStrategies: 'Investing & Strategies',
  forBusinesses: 'For Businesses',
  protocolsTransparency: 'Protocols & Transparency',
};

/**
 * Category mapping for each topic (used by FAQItem.category)
 */
const TOPIC_CATEGORIES: Record<HelpTopicId, FAQItem['category']> = {
  gettingStarted: 'getting-started',
  moneySafety: 'security',
  feesCosts: 'fees',
  investingStrategies: 'general',
  forBusinesses: 'operations',
  protocolsTransparency: 'general',
};

/**
 * Build FAQ items for a given topic.
 * Returns items with translation keys that will be resolved by useConfigTranslation.
 */
function buildTopicItems(topicId: HelpTopicId): FAQItem[] {
  const category = TOPIC_CATEGORIES[topicId];
  return TOPIC_FAQ_IDS[topicId].map((faqId) => ({
    id: `${topicId}-${faqId}`,
    question: `faq.items.${faqId}.question`,
    answer: `faq.items.${faqId}.answer`,
    category,
  }));
}

/**
 * Build a FAQAccordionVariantConfig for a single help topic.
 */
function buildTopicConfig(topicId: HelpTopicId): FAQAccordionVariantConfig {
  return {
    variant: 'default',
    content: {
      title: `landing-help.topics.${topicId}.title`,
      description: '',
      ctaText: '',
      ctaHref: '',
      items: buildTopicItems(topicId),
    },
    settings: {
      enableAnimations: true,
      animationDuration: 400,
      autoClose: true,
      enableKeyboardNav: true,
      scrollIntoView: true,
    },
    seo: {
      ariaLabel: `Frequently asked questions — ${TOPIC_ARIA_LABELS[topicId]}`,
      region: `faq-${topicId}`,
    },
    analytics: {
      trackingPrefix: `faq_help_${topicId}`,
      enabled: true,
    },
  };
}

/**
 * Pre-built configs for all help topics (avoids re-computation on each render).
 */
export const HELP_TOPIC_CONFIGS: Record<HelpTopicId, FAQAccordionVariantConfig> =
  Object.fromEntries(HELP_TOPIC_IDS.map((id) => [id, buildTopicConfig(id)])) as Record<
    HelpTopicId,
    FAQAccordionVariantConfig
  >;
