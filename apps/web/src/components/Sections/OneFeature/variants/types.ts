/**
 * OneFeature Variant Types
 * 
 * Domain-Driven Design: Clear type definitions for feature showcase variants
 * Service Agnostic Abstraction: Decoupled interfaces for different implementations
 * Type Safety: Comprehensive TypeScript interfaces
 */

import type { OneFeatureVariantConfig } from '@/config/oneFeature';

export interface OneFeatureVariantProps {
  /**
   * OneFeature configuration for this variant
   */
  config: OneFeatureVariantConfig;

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
   * Feature click handler
   */
  onFeatureClick?: (featureId: string, href: string) => void;
  
  /**
   * CTA click handler
   */
  onCTAClick?: (href: string) => void;
}

export interface OneFeatureVariantComponent {
  (props: OneFeatureVariantProps): JSX.Element | null;
}

export interface OneFeatureVariantRegistry {
  [key: string]: OneFeatureVariantComponent;
}