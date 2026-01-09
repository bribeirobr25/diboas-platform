/**
 * FeatureShowcase Factory Component
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
import { FEATURE_SHOWCASE_CONFIGS, type FeatureShowcaseVariantConfig, type FeatureShowcaseVariant } from '@/config/featureShowcase';
import { analyticsService } from '@/lib/analytics/error-resilient-service';
import { getFeatureShowcaseVariant, validateFeatureShowcaseVariant } from './variants/registry';
import type { FeatureShowcaseVariantProps } from './variants/types';
import { useConfigTranslation } from '@/lib/i18n/config-translator';

export interface FeatureShowcaseProps {
  /**
   * FeatureShowcase variant to render - determines layout and behavior
   */
  variant?: string;

  /**
   * Custom feature showcase configuration - overrides default config
   */
  config?: Partial<FeatureShowcaseVariantConfig>;

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
}

/**
 * FeatureShowcase Factory Component
 * 
 * Monitoring & Observability: Built-in analytics and error tracking
 * Performance: Variant-based code splitting and lazy loading
 */
export function FeatureShowcase({
  variant = 'default',
  config: customConfig,
  className = '',
  enableAnalytics = true,
  backgroundColor,
  priority = false
}: FeatureShowcaseProps) {
  // Domain-Driven Design: Configuration resolution with validation
  const baseResolvedConfig = useMemo(() => {
    const baseConfig = FEATURE_SHOWCASE_CONFIGS[variant as FeatureShowcaseVariant] || FEATURE_SHOWCASE_CONFIGS.default;
    const finalConfig = customConfig
      ? { ...baseConfig, ...customConfig } as FeatureShowcaseVariantConfig
      : baseConfig;

    // Security: Validate configuration in development
    if (process.env.NODE_ENV === 'development') {
      validateFeatureShowcaseVariant(variant, finalConfig);
    }

    return finalConfig;
  }, [variant, customConfig]);

  // Internationalization: Translate config using translation keys
  const resolvedConfig = useConfigTranslation(baseResolvedConfig);

  // Performance: Get variant component with memoization
  const VariantComponent = useMemo(() => {
    return getFeatureShowcaseVariant(variant);
  }, [variant]);

  // Product KPIs & Analytics: Navigation tracking
  const handleNavigate = useCallback(async (direction: 'prev' | 'next') => {
    if (!enableAnalytics || !resolvedConfig.analytics?.enabled) return;

    try {
      await analyticsService.trackEvent(`${resolvedConfig.analytics.trackingPrefix}_${resolvedConfig.analytics.eventSuffixes?.navigation || 'navigation'}`, {
        direction,
        variant: resolvedConfig.variant,
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Analytics tracking failed silently:  showcase navigation:', error);
    }
  }, [enableAnalytics, resolvedConfig]);

  // Product KPIs & Analytics: Slide change tracking
  const handleSlideChange = useCallback(async (slideIndex: number) => {
    if (!enableAnalytics || !resolvedConfig.analytics?.enabled) return;

    try {
      await analyticsService.trackEvent(`${resolvedConfig.analytics.trackingPrefix}_slide_change`, {
        slide_index: slideIndex,
        slide_id: resolvedConfig.slides?.[slideIndex]?.id,
        variant: resolvedConfig.variant,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Analytics tracking failed silently:  showcase slide change:', error);
    }
  }, [enableAnalytics, resolvedConfig]);

  // Product KPIs & Analytics: CTA interaction tracking
  const handleCTAClick = useCallback(async (slideId: string, ctaHref: string) => {
    if (!enableAnalytics || !resolvedConfig.analytics?.enabled) return;

    try {
      await analyticsService.trackEvent(`${resolvedConfig.analytics.trackingPrefix}_${resolvedConfig.analytics.eventSuffixes?.ctaClick || 'cta_click'}`, {
        slide_id: slideId,
        cta_href: ctaHref,
        variant: resolvedConfig.variant,
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      });

      // Navigate based on target
      const slide = resolvedConfig.slides?.find(s => s.id === slideId);
      if (slide?.content.ctaTarget === '_blank') {
        window.open(ctaHref, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = ctaHref;
      }
    } catch (error) {
      // Analytics tracking failed silently:  showcase CTA click:', error);
      
      // Still navigate even if analytics fails
      const slide = resolvedConfig.slides?.find(s => s.id === slideId);
      if (slide?.content.ctaTarget === '_blank') {
        window.open(ctaHref, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = ctaHref;
      }
    }
  }, [enableAnalytics, resolvedConfig]);

  // Variant props with shared logic
  const variantProps: FeatureShowcaseVariantProps = {
    config: resolvedConfig,
    className,
    enableAnalytics,
    priority,
    backgroundColor,
    onNavigate: handleNavigate,
    onSlideChange: handleSlideChange,
    onCTAClick: handleCTAClick
  };

  // Error Handling: Fallback if variant component fails to load
  try {
    return <VariantComponent {...variantProps} />;
  } catch (error) {
    Logger.error(`Failed to render feature showcase variant '${variant}'`, {}, error instanceof Error ? error : undefined);

    // Fallback to default variant
    const DefaultVariant = getFeatureShowcaseVariant('default');
    return <DefaultVariant {...variantProps} />;
  }
}

// Export for backward compatibility
export default FeatureShowcase;