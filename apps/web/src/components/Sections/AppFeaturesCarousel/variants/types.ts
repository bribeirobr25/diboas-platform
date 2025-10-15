/**
 * AppFeaturesCarousel Variant Types
 * 
 * Domain-Driven Design: Clear type definitions for app features carousel variants
 * Service Agnostic Abstraction: Decoupled interfaces for different implementations
 * Type Safety: Comprehensive TypeScript interfaces
 */

import type { AppFeaturesCarouselVariantConfig } from '@/config/appFeaturesCarousel';

export interface AppFeaturesCarouselVariantProps {
  /**
   * AppFeaturesCarousel configuration for this variant
   */
  config: AppFeaturesCarouselVariantConfig;

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
   * Autoplay controls
   */
  autoPlay?: boolean;
  
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
  
  /**
   * Play/pause handler
   */
  onPlayPause?: (isPlaying: boolean) => void;
}

export interface AppFeaturesCarouselVariantComponent {
  (props: AppFeaturesCarouselVariantProps): JSX.Element | null;
}

export interface AppFeaturesCarouselVariantRegistry {
  [key: string]: AppFeaturesCarouselVariantComponent;
}