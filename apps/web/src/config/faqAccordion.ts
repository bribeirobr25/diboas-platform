/**
 * FAQ Accordion Configuration
 *
 * Domain-Driven Design: FAQ domain configuration with variant support
 * Service Agnostic Abstraction: Decoupled FAQ content from presentation
 * Configuration Management: Centralized FAQ content and settings
 * No Hardcoded Values: All values configurable through interfaces
 * DRY Principles: Uses centralized ROUTES configuration for all links
 */

import { ROUTES } from './routes';

export type FAQAccordionVariant = 'default';

export interface FAQItem {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
  readonly category: 'getting-started' | 'guides' | 'security' | 'fees';
}

export interface FAQAccordionContent {
  readonly title: string;
  readonly description: string;
  readonly ctaText: string;
  readonly ctaHref: string;
  readonly ctaTarget?: '_blank' | '_self';
  readonly items: readonly FAQItem[];
}

export interface FAQAccordionSettings {
  readonly enableAnimations: boolean;
  readonly animationDuration: number; // milliseconds
  readonly autoClose: boolean; // Close other items when opening one
  readonly enableKeyboardNav: boolean;
  readonly scrollIntoView: boolean;
}

export interface FAQAccordionSEO {
  readonly ariaLabel: string;
  readonly region: string;
}

export interface FAQAccordionVariantConfig {
  readonly variant: FAQAccordionVariant;
  readonly content: FAQAccordionContent;
  readonly settings: FAQAccordionSettings;
  readonly seo: FAQAccordionSEO;
  readonly analytics?: {
    readonly trackingPrefix: string;
    readonly enabled: boolean;
  };
}

// Default FAQ items
// Note: Questions and answers are translation keys that will be resolved at runtime
export const DEFAULT_FAQ_ITEMS: FAQItem[] = [
  // Getting Started
  {
    id: 'faq-1',
    question: 'marketing.faq.items.q1.question',
    answer: 'marketing.faq.items.q1.answer',
    category: 'getting-started'
  },
  {
    id: 'faq-2',
    question: 'marketing.faq.items.q2.question',
    answer: 'marketing.faq.items.q2.answer',
    category: 'getting-started'
  },
  {
    id: 'faq-3',
    question: 'marketing.faq.items.q3.question',
    answer: 'marketing.faq.items.q3.answer',
    category: 'getting-started'
  },
  // About Your Guides
  {
    id: 'faq-4',
    question: 'marketing.faq.items.q4.question',
    answer: 'marketing.faq.items.q4.answer',
    category: 'guides'
  },
  {
    id: 'faq-5',
    question: 'marketing.faq.items.q5.question',
    answer: 'marketing.faq.items.q5.answer',
    category: 'guides'
  },
  {
    id: 'faq-6',
    question: 'marketing.faq.items.q6.question',
    answer: 'marketing.faq.items.q6.answer',
    category: 'guides'
  },
  // Security & Safety
  {
    id: 'faq-7',
    question: 'marketing.faq.items.q7.question',
    answer: 'marketing.faq.items.q7.answer',
    category: 'security'
  },
  {
    id: 'faq-8',
    question: 'marketing.faq.items.q8.question',
    answer: 'marketing.faq.items.q8.answer',
    category: 'security'
  },
  {
    id: 'faq-9',
    question: 'marketing.faq.items.q9.question',
    answer: 'marketing.faq.items.q9.answer',
    category: 'security'
  },
  // Fees & Costs
  {
    id: 'faq-10',
    question: 'marketing.faq.items.q10.question',
    answer: 'marketing.faq.items.q10.answer',
    category: 'fees'
  },
  {
    id: 'faq-11',
    question: 'marketing.faq.items.q11.question',
    answer: 'marketing.faq.items.q11.answer',
    category: 'fees'
  }
];

// Default content configuration
// Note: Title, description, and CTA text are translation keys that will be resolved at runtime
// DRY Principles: All links use centralized ROUTES configuration
export const DEFAULT_FAQ_ACCORDION_CONTENT: FAQAccordionContent = {
  title: 'marketing.faq.title',
  description: 'marketing.faq.description',
  ctaText: 'marketing.faq.ctaText',
  ctaHref: ROUTES.HELP.FAQ,
  ctaTarget: '_self',
  items: DEFAULT_FAQ_ITEMS
} as const;

// Default settings
export const DEFAULT_FAQ_ACCORDION_SETTINGS: FAQAccordionSettings = {
  enableAnimations: true,
  animationDuration: 400,
  autoClose: true,
  enableKeyboardNav: true,
  scrollIntoView: true
} as const;

// Predefined variant configurations
export const FAQ_ACCORDION_CONFIGS = {
  default: {
    variant: 'default' as const,
    content: DEFAULT_FAQ_ACCORDION_CONTENT,
    settings: DEFAULT_FAQ_ACCORDION_SETTINGS,
    seo: {
      ariaLabel: 'Frequently asked questions section',
      region: 'faq'
    },
    analytics: {
      trackingPrefix: 'faq_accordion',
      enabled: true
    }
  }
} as const;

// Legacy compatibility
export const DEFAULT_FAQ_ACCORDION_CONFIG = FAQ_ACCORDION_CONFIGS.default;
export type FAQAccordionConfig = FAQAccordionVariantConfig;
