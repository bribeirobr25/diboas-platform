/**
 * FeatureShowcase Variant Types
 * 
 * Domain-Driven Design: Clear type definitions for showcase variants
 * Service Agnostic Abstraction: Decoupled interfaces for different implementations
 * Type Safety: Comprehensive TypeScript interfaces
 */

import type { FeatureShowcaseVariantConfig } from '@/config/featureShowcase';

export interface FeatureShowcaseVariantProps {
  /**
   * FeatureShowcase configuration for this variant
   */
  config: FeatureShowcaseVariantConfig;

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
   * Navigation handlers
   */
  onNavigate?: (direction: 'prev' | 'next') => void;
  
  /**
   * Slide change handler
   */
  onSlideChange?: (slideIndex: number) => void;
  
  /**
   * CTA click handler
   */
  onCTAClick?: (slideId: string, ctaHref: string) => void;
}

export interface FeatureShowcaseVariantComponent {
  (props: FeatureShowcaseVariantProps): JSX.Element | null;
}

export interface FeatureShowcaseVariantRegistry {
  [key: string]: FeatureShowcaseVariantComponent;
}