/**
 * ProductCarousel Factory Component
 * 
 * Domain-Driven Design: Single entry point with variant composition
 * Service Agnostic Abstraction: Variant selection handled internally
 * Code Reusability: Shared analytics, error handling, and configuration logic
 * Maintenance: Easy to add variants without touching consumer code
 * Security: Centralized validation and error handling
 * No Hardcoded Values: All configuration through props and design tokens
 */

'use client';

import { Logger } from '@/lib/monitoring/Logger';
import { useCallback, useMemo } from 'react';
import { PRODUCT_CAROUSEL_CONFIGS, type ProductCarouselVariantConfig, type ProductCarouselVariant } from '@/config/productCarousel';
import { analyticsService } from '@/lib/analytics/error-resilient-service';
import { getProductCarouselVariant, validateProductCarouselVariant } from './variants/registry';
import type { ProductCarouselVariantProps } from './variants/types';
import { useConfigTranslation } from '@/lib/i18n/config-translator';

export interface ProductCarouselProps {
  /**
   * ProductCarousel variant to render - determines layout and behavior
   */
  variant?: string;

  /**
   * Custom product carousel configuration - overrides default config
   */
  config?: Partial<ProductCarouselVariantConfig>;

  /**
   * Custom CSS classes for styling extensions
   */
  className?: string;

  /**
   * Enable analytics tracking for user interactions
   */
  enableAnalytics?: boolean;

  /**
   * Custom section background color
   */
  backgroundColor?: string;

  /**
   * Performance optimization: Priority loading for above-fold content
   */
  priority?: boolean;

  /**
   * Enable auto-play functionality
   */
  autoPlay?: boolean;
}

/**
 * ProductCarousel Factory Component
 * 
 * Monitoring & Observability: Built-in analytics and error tracking
 * Performance: Variant-based code splitting and lazy loading
 */
export function ProductCarousel({
  variant = 'default',
  config: customConfig,
  className = '',
  enableAnalytics = true,
  backgroundColor,
  priority = false,
  autoPlay = true
}: ProductCarouselProps) {
  // Domain-Driven Design: Configuration resolution with validation
  const baseResolvedConfig = useMemo(() => {
    try {
      const baseConfig = PRODUCT_CAROUSEL_CONFIGS[variant as ProductCarouselVariant] || PRODUCT_CAROUSEL_CONFIGS.default;
      const finalConfig = customConfig
        ? { ...baseConfig, ...customConfig } as ProductCarouselVariantConfig
        : baseConfig;

      // Security: Validate configuration in development
      if (process.env.NODE_ENV === 'development') {
        // Only validate if we have a config to validate
        if (finalConfig) {
          validateProductCarouselVariant(variant, finalConfig);
        }
      }

      return finalConfig;
    } catch (error) {
      Logger.warn('Failed to resolve ProductCarousel configuration:', { error: error instanceof Error ? error.message : String(error) });
      return PRODUCT_CAROUSEL_CONFIGS.default;
    }
  }, [variant, customConfig]);

  // Internationalization: Translate config using translation keys
  const resolvedConfig = useConfigTranslation(baseResolvedConfig);

  // Performance: Get variant component with memoization
  const VariantComponent = useMemo(() => {
    return getProductCarouselVariant(variant);
  }, [variant]);

  // Product KPIs & Analytics: Navigation tracking
  const handleNavigate = useCallback(async (direction: 'prev' | 'next') => {
    if (!enableAnalytics || !resolvedConfig.analytics?.enabled) return;

    try {
      await analyticsService.trackEvent(`${resolvedConfig.analytics.trackingPrefix}_navigation`, {
        direction,
        variant: resolvedConfig.variant,
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Analytics tracking failed silently:  carousel navigation:', error);
    }
  }, [enableAnalytics, resolvedConfig]);

  // Product KPIs & Analytics: Slide change tracking
  const handleSlideChange = useCallback(async (slideIndex: number) => {
    if (!enableAnalytics || !resolvedConfig.analytics?.enabled) return;

    try {
      await analyticsService.trackEvent(`${resolvedConfig.analytics.trackingPrefix}_slide_change`, {
        slide_index: slideIndex,
        slide_id: resolvedConfig.content.slides?.[slideIndex]?.id,
        variant: resolvedConfig.variant,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Analytics tracking failed silently:  carousel slide change:', error);
    }
  }, [enableAnalytics, resolvedConfig]);

  // Product KPIs & Analytics: CTA interaction tracking
  const handleCTAClick = useCallback(async (slideId: string, ctaHref: string) => {
    if (!enableAnalytics || !resolvedConfig.analytics?.enabled) return;

    try {
      await analyticsService.trackEvent(`${resolvedConfig.analytics.trackingPrefix}_cta_click`, {
        slide_id: slideId,
        cta_href: ctaHref,
        variant: resolvedConfig.variant,
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      });

      // Navigate to CTA link
      window.location.href = ctaHref;
    } catch (error) {
      // Analytics tracking failed silently:  carousel CTA click:', error);
      
      // Still navigate even if analytics fails
      window.location.href = ctaHref;
    }
  }, [enableAnalytics, resolvedConfig]);

  // Product KPIs & Analytics: Play/pause tracking
  const handlePlayPause = useCallback(async (isPlaying: boolean) => {
    if (!enableAnalytics || !resolvedConfig.analytics?.enabled) return;

    try {
      await analyticsService.trackEvent(`${resolvedConfig.analytics.trackingPrefix}_${isPlaying ? 'play' : 'pause'}`, {
        variant: resolvedConfig.variant,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Analytics tracking failed silently:  carousel play/pause:', error);
    }
  }, [enableAnalytics, resolvedConfig]);

  // Variant props with shared logic
  const variantProps: ProductCarouselVariantProps = {
    config: resolvedConfig,
    className,
    enableAnalytics,
    priority,
    backgroundColor,
    autoPlay,
    onNavigate: handleNavigate,
    onSlideChange: handleSlideChange,
    onCTAClick: handleCTAClick,
    onPlayPause: handlePlayPause
  };

  // Error Handling: Fallback if variant component fails to load
  try {
    return <VariantComponent {...variantProps} />;
  } catch (error) {
    Logger.error(`Failed to render product carousel variant '${variant}'`, {}, error instanceof Error ? error : undefined);

    // Fallback to default variant
    const DefaultVariant = getProductCarouselVariant('default');
    return <DefaultVariant {...variantProps} />;
  }
}

// Export for backward compatibility
export default ProductCarousel;