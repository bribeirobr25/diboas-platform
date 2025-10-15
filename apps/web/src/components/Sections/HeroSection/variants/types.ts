/**
 * Hero Variant Types
 * 
 * Domain-Driven Design: Clear type definitions for hero variants
 * Service Agnostic Abstraction: Decoupled interfaces for different implementations
 * Type Safety: Comprehensive TypeScript interfaces
 */

import type { HeroVariantConfig } from '@/config/hero';

export interface HeroVariantProps {
  /**
   * Hero configuration for this variant
   */
  config: HeroVariantConfig;

  /**
   * Custom CSS classes for styling extensions
   */
  className?: string;

  /**
   * Enable analytics tracking for user interactions
   */
  enableAnalytics?: boolean;

  /**
   * Performance optimization: Priority loading for above-fold content
   */
  priority?: boolean;

  /**
   * Custom section background color override
   */
  backgroundColor?: string;

  /**
   * CTA click handler
   */
  onCTAClick?: () => void;
}

export interface HeroVariantComponent {
  (props: HeroVariantProps): JSX.Element;
}

export interface HeroVariantRegistry {
  [key: string]: HeroVariantComponent;
}