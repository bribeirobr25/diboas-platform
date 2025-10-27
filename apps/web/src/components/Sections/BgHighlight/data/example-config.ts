/**
 * BgHighlight Example Configuration
 *
 * Domain-Driven Design: Sample configuration for background highlight display
 * Service Agnostic Abstraction: Declarative configuration for content and styling
 * Code Reusability: Template for creating BgHighlight configurations
 *
 * USAGE:
 * ```tsx
 * import { BgHighlightSection } from '@/components/Sections/BgHighlight';
 * import { bgHighlightConfig } from '@/components/Sections/BgHighlight/data/example-config';
 *
 * export function MyPage() {
 *   return <BgHighlightSection config={bgHighlightConfig} />;
 * }
 * ```
 */

import type { BgHighlightConfig } from '../types';

/**
 * Example BgHighlight Configuration
 *
 * Full-width background image section with title and description at bottom-left.
 * Displays brand message with nature background.
 */
export const bgHighlightConfig: BgHighlightConfig = {
  /** Background image configuration */
  backgroundImage: {
    src: '/assets/socials/real/nature.avif',
    alt: 'Natural landscape representing growth and financial sustainability'
  },

  /** Content configuration */
  content: {
    title: "I'm diBoaS",
    description: "I have complete banking in real time and with nor borders, a place to learn about money, investing and strategy, a secure place to invest and grow my money and a lot of Rewards and other benefits"
  },

  /** SEO and accessibility metadata */
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'DiBoaS platform introduction with brand message'
  },

  /** Analytics configuration */
  analytics: {
    sectionId: 'bg-highlight-default',
    category: 'brand'
  }
};
