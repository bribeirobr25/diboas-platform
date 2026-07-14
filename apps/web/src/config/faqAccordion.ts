/**
 * FAQ Accordion Configuration
 *
 * Domain-Driven Design: FAQ domain configuration with variant support
 * Service Agnostic Abstraction: Decoupled FAQ content from presentation
 * Configuration Management: Centralized FAQ content and settings
 * No Hardcoded Values: All values configurable through interfaces
 *
 * Content selection (which ids each surface shows) lives in the canonical FAQ
 * registry — `@/config/faqRegistry` — which sources every string from the single
 * `faq.json` store. This file owns only the shared presentation types + settings.
 */

export type FAQAccordionVariant = 'default';

export interface FAQItem {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
  readonly category:
    'getting-started' | 'guides' | 'security' | 'fees' | 'general' | 'compliance' | 'operations';
}

/**
 * FAQ Accordion content. `items` carries FAQItem[] whose `question`/`answer` are
 * translation keys resolved at runtime by `useConfigTranslation`. Page configs
 * build `items` from `getFAQForSurface()` (see `@/config/faqRegistry`).
 */
export interface FAQAccordionContent {
  readonly title: string;
  readonly description: string;
  readonly ctaText: string;
  readonly ctaHref: string;
  readonly ctaTarget?: '_blank' | '_self';
  readonly items?: readonly FAQItem[];
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

// Shared default settings — consumed by the per-surface configs (strategies, protocols).
export const DEFAULT_FAQ_ACCORDION_SETTINGS: FAQAccordionSettings = {
  enableAnimations: true,
  animationDuration: 400,
  autoClose: true,
  enableKeyboardNav: true,
  scrollIntoView: true,
} as const;

export type FAQAccordionConfig = FAQAccordionVariantConfig;
