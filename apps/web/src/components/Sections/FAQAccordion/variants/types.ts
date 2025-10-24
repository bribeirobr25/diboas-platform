/**
 * FAQAccordion Variant Types
 *
 * Domain-Driven Design: Centralized type definitions for all FAQ accordion variants
 * Code Reusability: Shared types across all FAQ accordion variants
 * Type Safety: Strict typing for variant props and configurations
 */

import type { FAQAccordionConfig } from '@/config/faqAccordion';

/**
 * Base props shared by all FAQ accordion variants
 */
export interface FAQAccordionVariantProps {
  /**
   * Configuration object for the FAQ accordion
   */
  readonly config: FAQAccordionConfig;

  /**
   * Optional CSS class name for custom styling
   */
  readonly className?: string;

  /**
   * Optional background color override
   */
  readonly backgroundColor?: string;

  /**
   * Enable analytics tracking
   * @default true
   */
  readonly enableAnalytics?: boolean;

  /**
   * Callback when FAQ item is expanded
   */
  readonly onExpand?: (itemId: string) => void;

  /**
   * Callback when FAQ item is collapsed
   */
  readonly onCollapse?: (itemId: string) => void;

  /**
   * Callback when CTA button is clicked
   */
  readonly onCTAClick?: (href: string) => void;
}

/**
 * Type for FAQ accordion variant component
 */
export type FAQAccordionVariantComponent = React.ComponentType<FAQAccordionVariantProps>;

/**
 * Map of variant names to their components
 */
export type FAQAccordionVariantMap = {
  readonly [K in FAQAccordionConfig['variant']]: FAQAccordionVariantComponent;
};
