/**
 * Help Page Configuration
 *
 * 4-section layout using reusable section components:
 * 1. Hero (HeroSection centered)
 * 2. FAQ Topics (multiple FAQAccordion sections grouped by topic)
 * 3. Waitlist (WaitlistSection)
 * 4. Footer (MinimalFooter)
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
    backgroundImage: '/assets/images/hand-bright2.avif',
    backgroundImageMobile: '/assets/images/hand-bright2.avif',
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
] as const;

export type HelpTopicId = (typeof HELP_TOPIC_IDS)[number];

/**
 * Number of questions per topic (for building FAQItem arrays).
 * Must match the q1..qN keys in landing-help.json for each topic.
 */
const TOPIC_QUESTION_COUNTS: Record<HelpTopicId, number> = {
  gettingStarted: 4,
  moneySafety: 4,
  feesCosts: 3,
  investingStrategies: 2,
  forBusinesses: 3,
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
};

/**
 * Build FAQ items for a given topic.
 * Returns items with translation keys that will be resolved by useConfigTranslation.
 */
function buildTopicItems(topicId: HelpTopicId): FAQItem[] {
  const count = TOPIC_QUESTION_COUNTS[topicId];
  const category = TOPIC_CATEGORIES[topicId];
  const items: FAQItem[] = [];

  for (let i = 1; i <= count; i++) {
    items.push({
      id: `${topicId}-q${i}`,
      question: `landing-help.topics.${topicId}.questions.q${i}.question`,
      answer: `landing-help.topics.${topicId}.questions.q${i}.answer`,
      category,
    });
  }

  return items;
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
  Object.fromEntries(
    HELP_TOPIC_IDS.map((id) => [id, buildTopicConfig(id)])
  ) as Record<HelpTopicId, FAQAccordionVariantConfig>;

// ─── Section 3: Waitlist ─────────────────────────────────────

export const HELP_WAITLIST_CONFIG = {
  sectionId: 'waitlist-section-help',
  backgroundColor: 'var(--section-bg-brand)',
  headline: 'landing-help.waitlist.header',
  subheadline: 'landing-help.waitlist.description',
  hideBenefits: true,
  hideNoSpam: true,
  source: 'help' as const,
} as const;
