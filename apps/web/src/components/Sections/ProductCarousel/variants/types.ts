/**
 * ProductCarousel Variant Types
 * 
 * Domain-Driven Design: Clear type definitions for carousel variants
 * Service Agnostic Abstraction: Decoupled interfaces for different implementations
 * Type Safety: Comprehensive TypeScript interfaces
 */

import type { ProductCarouselVariantConfig } from '@/config/productCarousel';

export interface ProductCarouselVariantProps {
  /**
   * ProductCarousel configuration for this variant
   */
  config: ProductCarouselVariantConfig;

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

export interface ProductCarouselVariantComponent {
  (props: ProductCarouselVariantProps): JSX.Element | null;
}

export interface ProductCarouselVariantRegistry {
  [key: string]: ProductCarouselVariantComponent;
}