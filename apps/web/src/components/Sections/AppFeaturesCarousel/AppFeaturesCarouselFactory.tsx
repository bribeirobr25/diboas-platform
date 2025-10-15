/**
 * AppFeaturesCarousel Factory Component
 * 
 * Domain-Driven Design: Single entry point with variant composition
 * Service Agnostic Abstraction: Variant selection handled internally
 * Code Reusability: Shared analytics, error handling, and configuration logic
 * Maintenance: Easy to add variants without touching consumer code
 * Security: Centralized validation and error handling
 * No Hardcoded Values: All configuration through props and design tokens
 */

'use client';

import { useCallback, useMemo } from 'react';
import { APP_FEATURES_CAROUSEL_CONFIGS, type AppFeaturesCarouselVariantConfig, type AppFeaturesCarouselVariant } from '@/config/appFeaturesCarousel';
import { analyticsService } from '@/lib/analytics/error-resilient-service';
import { getAppFeaturesCarouselVariant, validateAppFeaturesCarouselVariant } from './variants/registry';
import type { AppFeaturesCarouselVariantProps } from './variants/types';
import { useConfigTranslation } from '@/lib/i18n/config-translator';

export interface AppFeaturesCarouselProps {
  /**
   * AppFeaturesCarousel variant to render - determines layout and behavior
   */
  variant?: string;

  /**
   * Custom app features carousel configuration - overrides default config
   */
  config?: Partial<AppFeaturesCarouselVariantConfig>;

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
 * AppFeaturesCarousel Factory Component
 * 
 * Monitoring & Observability: Built-in analytics and error tracking
 * Performance: Variant-based code splitting and lazy loading
 */
export function AppFeaturesCarousel({
  variant = 'default',
  config: customConfig,
  className = '',
  enableAnalytics = true,
  backgroundColor,
  priority = false,
  autoPlay = true
}: AppFeaturesCarouselProps) {
  // Domain-Driven Design: Configuration resolution with validation
  const baseResolvedConfig = useMemo(() => {
    try {
      const baseConfig = APP_FEATURES_CAROUSEL_CONFIGS[variant as AppFeaturesCarouselVariant] || APP_FEATURES_CAROUSEL_CONFIGS.default;
      const finalConfig = customConfig
        ? { ...baseConfig, ...customConfig } as AppFeaturesCarouselVariantConfig
        : baseConfig;

      // Security: Validate configuration in development
      if (process.env.NODE_ENV === 'development') {
        // Only validate if we have a config to validate
        if (finalConfig) {
          validateAppFeaturesCarouselVariant(variant, finalConfig);
        }
      }

      return finalConfig;
    } catch (error) {
      console.warn('Failed to resolve AppFeaturesCarousel configuration:', error);
      return APP_FEATURES_CAROUSEL_CONFIGS.default;
    }
  }, [variant, customConfig]);

  // Internationalization: Translate config using translation keys
  const resolvedConfig = useConfigTranslation(baseResolvedConfig);

  // Performance: Get variant component with memoization
  const VariantComponent = useMemo(() => {
    return getAppFeaturesCarouselVariant(variant);
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
      console.warn('Failed to track app features carousel navigation:', error);
    }
  }, [enableAnalytics, resolvedConfig]);

  // Product KPIs & Analytics: Slide change tracking
  const handleSlideChange = useCallback(async (slideIndex: number) => {
    if (!enableAnalytics || !resolvedConfig.analytics?.enabled) return;

    try {
      await analyticsService.trackEvent(`${resolvedConfig.analytics.trackingPrefix}_slide_change`, {
        slide_index: slideIndex,
        slide_id: resolvedConfig.cards?.[slideIndex]?.id,
        variant: resolvedConfig.variant,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to track app features carousel slide change:', error);
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

      // Navigate based on target
      const card = resolvedConfig.cards?.find(c => c.id === slideId);
      if (card?.content.ctaTarget === '_blank') {
        window.open(ctaHref, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = ctaHref;
      }
    } catch (error) {
      console.warn('Failed to track app features carousel CTA click:', error);
      
      // Still navigate even if analytics fails
      const card = resolvedConfig.cards?.find(c => c.id === slideId);
      if (card?.content.ctaTarget === '_blank') {
        window.open(ctaHref, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = ctaHref;
      }
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
      console.warn('Failed to track app features carousel play/pause:', error);
    }
  }, [enableAnalytics, resolvedConfig]);

  // Variant props with shared logic
  const variantProps: AppFeaturesCarouselVariantProps = {
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
    console.error(`Failed to render app features carousel variant '${variant}':`, error);
    
    // Fallback to default variant
    const DefaultVariant = getAppFeaturesCarouselVariant('default');
    return <DefaultVariant {...variantProps} />;
  }
}

// Export for backward compatibility
export default AppFeaturesCarousel;