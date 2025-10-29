/**
 * BgHighlight Configuration
 *
 * Domain-Driven Design: Background highlight domain configuration
 * Service Agnostic Abstraction: Decoupled content from presentation
 * Configuration Management: Centralized BgHighlight content and settings
 * No Hardcoded Values: All values configurable through interfaces
 *
 * Note: Title, description, and alt text are translation keys that will be resolved at runtime
 */

import type { BgHighlightConfig } from '@/components/Sections/BgHighlight/types';

/**
 * Default BgHighlight Configuration
 *
 * Full-width background image section with brand message.
 * Displays title and description at bottom-left with gradient overlay.
 */
export const DEFAULT_BG_HIGHLIGHT_CONFIG: BgHighlightConfig = {
  /** Background image configuration */
  backgroundImage: {
    src: '/assets/socials/real/diboas-banner.avif',
    alt: 'marketing.bgHighlight.imageAlt'
  },

  /** Content configuration */
  content: {
    title: 'marketing.bgHighlight.title',
    description: 'marketing.bgHighlight.description'
  },

  /** SEO and accessibility metadata */
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'DiBoaS platform brand introduction with comprehensive features'
  },

  /** Analytics configuration */
  analytics: {
    sectionId: 'bg-highlight-home',
    category: 'brand'
  }
} as const;
