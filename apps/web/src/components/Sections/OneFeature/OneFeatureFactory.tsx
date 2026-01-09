/**
 * OneFeature Factory Component
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
import { ONE_FEATURE_CONFIGS, type OneFeatureVariantConfig, type OneFeatureVariant } from '@/config/oneFeature';
import { analyticsService } from '@/lib/analytics/error-resilient-service';
import { getOneFeatureVariant, validateOneFeatureVariant } from './variants/registry';
import type { OneFeatureVariantProps } from './variants/types';
import { useConfigTranslation } from '@/lib/i18n/config-translator';

export interface OneFeatureProps {
  /**
   * OneFeature variant to render - determines layout and behavior
   */
  variant?: string;

  /**
   * Custom configuration - overrides default config
   */
  config?: Partial<OneFeatureVariantConfig>;

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
 * SecurityOneFeature Factory Component
 * 
 * Monitoring & Observability: Built-in analytics and error tracking
 * Performance: Variant-based code splitting and lazy loading
 */
export function OneFeature({
  variant = 'default',
  config: customConfig,
  className = '',
  enableAnalytics = true,
  backgroundColor,
  priority = true
}: OneFeatureProps) {
  // Domain-Driven Design: Configuration resolution with validation
  const baseResolvedConfig = useMemo(() => {
    const baseConfig = ONE_FEATURE_CONFIGS[variant as OneFeatureVariant] || ONE_FEATURE_CONFIGS.default;
    const finalConfig = customConfig
      ? { ...baseConfig, ...customConfig } as OneFeatureVariantConfig
      : baseConfig;

    // Security: Validate configuration in development
    if (process.env.NODE_ENV === 'development') {
      validateOneFeatureVariant(variant, finalConfig);
    }

    return finalConfig;
  }, [variant, customConfig]);

  // Internationalization: Translate config using translation keys
  const resolvedConfig = useConfigTranslation(baseResolvedConfig);

  // Performance: Get variant component with memoization
  const VariantComponent = useMemo(() => {
    return getOneFeatureVariant(variant);
  }, [variant]);

  // Product KPIs & Analytics: Feature interaction tracking
  const handleFeatureClick = useCallback(async (featureId: string, href: string) => {
    if (!enableAnalytics || !resolvedConfig.analytics?.enabled) return;

    try {
      await analyticsService.trackEvent(`${resolvedConfig.analytics.trackingPrefix}_feature_click`, {
        feature_id: featureId,
        href,
        variant: resolvedConfig.variant,
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      });

      // Navigate to feature link
      if (href.startsWith('http')) {
        window.open(href, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = href;
      }
    } catch (error) {
      // Analytics tracking failed silently:  feature click:', error);
      
      // Still navigate even if analytics fails
      if (href.startsWith('http')) {
        window.open(href, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = href;
      }
    }
  }, [enableAnalytics, resolvedConfig]);

  // Product KPIs & Analytics: CTA tracking
  const handleCTAClick = useCallback(async (href: string) => {
    if (!enableAnalytics || !resolvedConfig.analytics?.enabled) return;

    try {
      await analyticsService.trackEvent(`${resolvedConfig.analytics.trackingPrefix}_cta_click`, {
        href,
        variant: resolvedConfig.variant,
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      });

      // Navigate to CTA link
      if (href.startsWith('http')) {
        window.open(href, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = href;
      }
    } catch (error) {
      // Analytics tracking failed silently:  CTA click:', error);
      
      // Still navigate even if analytics fails
      if (href.startsWith('http')) {
        window.open(href, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = href;
      }
    }
  }, [enableAnalytics, resolvedConfig]);

  // Variant props with shared logic
  const variantProps: OneFeatureVariantProps = {
    config: resolvedConfig,
    className,
    enableAnalytics,
    priority,
    backgroundColor,
    onFeatureClick: handleFeatureClick,
    onCTAClick: handleCTAClick
  };

  // Error Handling: Fallback if variant component fails to load
  try {
    return <VariantComponent {...variantProps} />;
  } catch (error) {
    Logger.error(`Failed to render one feature variant '${variant}'`, {}, error instanceof Error ? error : undefined);

    // Fallback to default variant
    const DefaultVariant = getOneFeatureVariant('default');
    return <DefaultVariant {...variantProps} />;
  }
}

// Export for backward compatibility
export default OneFeature;