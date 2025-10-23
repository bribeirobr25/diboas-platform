/**
 * StickyFeaturesNav Variant Types
 *
 * Domain-Driven Design: Clear type definitions for sticky features nav variants
 * Service Agnostic Abstraction: Decoupled interfaces for different implementations
 * Type Safety: Comprehensive TypeScript interfaces
 */

import type { StickyFeaturesNavVariantConfig } from '@/config/stickyFeaturesNav';

export interface StickyFeaturesNavVariantProps {
  /**
   * StickyFeaturesNav configuration for this variant
   */
  config: StickyFeaturesNavVariantConfig;

  /**
   * Custom CSS classes for styling extensions
   */
  className?: string;

  /**
   * Enable analytics tracking for user interactions
   */
  enableAnalytics?: boolean;

  /**
   * Custom section background color override
   */
  backgroundColor?: string;

  /**
   * Callback when a nav item is clicked
   */
  onNavItemClick?: (categoryId: string) => void;

  /**
   * Callback when active category changes
   */
  onActiveCategoryChange?: (categoryId: string) => void;

  /**
   * Callback when CTA is clicked
   */
  onCTAClick?: (categoryId: string, itemId: string, href: string) => void;
}

export interface StickyFeaturesNavVariantComponent {
  (props: StickyFeaturesNavVariantProps): JSX.Element;
}

export interface StickyFeaturesNavVariantRegistry {
  [key: string]: StickyFeaturesNavVariantComponent;
}
