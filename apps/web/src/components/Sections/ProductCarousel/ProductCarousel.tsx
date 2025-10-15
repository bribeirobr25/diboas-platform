/**
 * ProductCarousel Main Component
 * 
 * Domain-Driven Design: Main entry point for product carousel functionality
 * Service Agnostic Abstraction: Factory pattern for different carousel variants
 * Code Reusability & DRY: Single interface for multiple implementations
 * File Decoupling & Organization: Clean separation between interface and variants
 * No Hardcoded Values: Uses configuration-driven approach
 */

'use client';

import { ProductCarousel as ProductCarouselFactory } from './ProductCarouselFactory';
import { PRODUCT_CAROUSEL_CONFIGS } from '@/config/productCarousel';
import type { ProductCarouselVariant } from '@/config/productCarousel';

export interface ProductCarouselProps {
  /** Carousel variant to render */
  variant?: ProductCarouselVariant;
  /** Additional CSS class names */
  className?: string;
  /** Enable analytics tracking */
  enableAnalytics?: boolean;
  /** Priority loading for images */
  priority?: boolean;
  /** Custom background color */
  backgroundColor?: string;
  /** Auto-play override */
  autoPlay?: boolean;
  /** Navigation callback */
  onNavigate?: (direction: 'prev' | 'next') => void;
  /** Slide change callback */
  onSlideChange?: (index: number) => void;
  /** CTA click callback */
  onCTAClick?: (slideId: string, ctaText: string) => void;
  /** Play/pause callback */
  onPlayPause?: (isPlaying: boolean) => void;
}

/**
 * ProductCarousel Component
 * 
 * Main component following documentation specifications:
 * - Reusable carousel section for all diboas.com pages
 * - Shows 3 cards with image + dynamic title/subtitle
 * - Works with mouse, keyboard, and touch
 * - Honors reduced motion preferences
 * - Implements accessibility best practices
 */
export function ProductCarousel({
  variant = 'default',
  className = '',
  enableAnalytics = true,
  priority = false,
  backgroundColor,
  autoPlay = true,
  onNavigate,
  onSlideChange,
  onCTAClick,
  onPlayPause
}: ProductCarouselProps) {
  const config = PRODUCT_CAROUSEL_CONFIGS[variant];

  if (!config) {
    console.warn(`ProductCarousel: Unknown variant "${variant}". Using default.`);
    return (
      <ProductCarouselFactory
        variant="default"
        className={className}
        enableAnalytics={enableAnalytics}
        priority={priority}
        backgroundColor={backgroundColor}
        autoPlay={autoPlay}
      />
    );
  }

  return (
    <ProductCarouselFactory
      variant={variant}
      className={className}
      enableAnalytics={enableAnalytics}
      priority={priority}
      backgroundColor={backgroundColor}
      autoPlay={autoPlay}
    />
  );
}

// Export types for external use
export type { ProductCarouselVariant } from '@/config/productCarousel';
export { PRODUCT_CAROUSEL_CONFIGS } from '@/config/productCarousel';