/**
 * BgHighlight Configuration
 *
 * Domain-Driven Design: Background highlight domain configuration
 * Service Agnostic Abstraction: Decoupled content from presentation
 * Configuration Management: Centralized BgHighlight content and settings
 * No Hardcoded Values: All values configurable through interfaces
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
    src: '/assets/socials/real/nature.avif',
    alt: 'Natural landscape representing growth and financial sustainability with diBoaS'
  },

  /** Content configuration */
  content: {
    title: "I'm diBoaS",
    description: "I have complete banking in real time and with nor borders, a place to learn about money, investing and strategy, a secure place to invest and grow my money and a lot of Rewards and other benefits"
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
