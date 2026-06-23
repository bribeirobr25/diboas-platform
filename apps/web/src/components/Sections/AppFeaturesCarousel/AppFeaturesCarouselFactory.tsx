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

import { Logger } from '@/lib/monitoring/Logger';
import { useCallback, useMemo } from 'react';
import {
  APP_FEATURES_CAROUSEL_CONFIGS,
  type AppFeaturesCarouselVariantConfig,
  type AppFeaturesCarouselVariant,
} from '@/config/appFeaturesCarousel';
import { analyticsService } from '@/lib/analytics';
import {
  getAppFeaturesCarouselVariant,
  validateAppFeaturesCarouselVariant,
} from './variants/registry';
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
  autoPlay = true,
}: AppFeaturesCarouselProps) {
  // Domain-Driven Design: Configuration resolution with validation
  const baseResolvedConfig = useMemo(() => {
    try {
      const baseConfig =
        APP_FEATURES_CAROUSEL_CONFIGS[variant as AppFeaturesCarouselVariant] ||
        APP_FEATURES_CAROUSEL_CONFIGS.default;
      const finalConfig = customConfig
        ? ({ ...baseConfig, ...customConfig } as AppFeaturesCarouselVariantConfig)
        : baseConfig;

      // Security: Validate configuration in development
      if (process.env.NODE_ENV === 'development') {
        // Only validate if we have a config to validate
        if (finalConfig) {
          validateAppFeaturesCarouselVariant(variant, finalConfig);
        }
      }

      return finalConfig;
    } catch {
      Logger.warn('Failed to resolve AppFeaturesCarousel configuration');
      return APP_FEATURES_CAROUSEL_CONFIGS.default;
    }
  }, [variant, customConfig]);

  // Internationalization: Translate config using translation keys
  const resolvedConfig = useConfigTranslation(baseResolvedConfig);

  // Performance: Get variant component with memoization
  const VariantComponent = useMemo(() => {
    return getAppFeaturesCarouselVariant(variant);
  }, [variant]);

  // Product KPIs & Analytics: Navigation tracking.
  // PERF-1: fire-and-forget — never block carousel interaction on the
  // analytics round-trip. `trackEvent` already swallows its own errors; the
  // trailing `.catch` guards against an unhandled rejection on the floating
  // promise.
  const handleNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      if (!enableAnalytics || !resolvedConfig.analytics?.enabled) return;

      void analyticsService
        .trackEvent(`${resolvedConfig.analytics.trackingPrefix}_navigation`, {
          direction,
          variant: resolvedConfig.variant,
          page: window.location.pathname,
          timestamp: new Date().toISOString(),
        })
        .catch(() => {
          // Analytics tracking failed silently
        });
    },
    [enableAnalytics, resolvedConfig]
  );

  // Product KPIs & Analytics: Slide change tracking (fire-and-forget)
  const handleSlideChange = useCallback(
    (slideIndex: number) => {
      if (!enableAnalytics || !resolvedConfig.analytics?.enabled) return;

      void analyticsService
        .trackEvent(`${resolvedConfig.analytics.trackingPrefix}_slide_change`, {
          slide_index: slideIndex,
          slide_id: resolvedConfig.cards?.[slideIndex]?.id,
          variant: resolvedConfig.variant,
          timestamp: new Date().toISOString(),
        })
        .catch(() => {
          // Analytics tracking failed silently
        });
    },
    [enableAnalytics, resolvedConfig]
  );

  // Product KPIs & Analytics: CTA interaction tracking (fire-and-forget).
  // PERF-1: the CTA is a native <Link>/<a> that already navigates (SPA push for
  // internal targets, a new tab for `_blank`). Issuing `window.location.href` /
  // `window.open` here would double-navigate — a hard reload over the <Link>'s
  // SPA navigation, or a second tab over `<a target="_blank">`. So we only record
  // analytics and let the element own navigation.
  const handleCTAClick = useCallback(
    (slideId: string, ctaHref: string) => {
      if (!enableAnalytics || !resolvedConfig.analytics?.enabled) return;

      void analyticsService
        .trackEvent(`${resolvedConfig.analytics.trackingPrefix}_cta_click`, {
          slide_id: slideId,
          cta_href: ctaHref,
          variant: resolvedConfig.variant,
          page: window.location.pathname,
          timestamp: new Date().toISOString(),
        })
        .catch(() => {
          // Analytics tracking failed silently
        });
    },
    [enableAnalytics, resolvedConfig]
  );

  // Product KPIs & Analytics: Play/pause tracking (fire-and-forget)
  const handlePlayPause = useCallback(
    (isPlaying: boolean) => {
      if (!enableAnalytics || !resolvedConfig.analytics?.enabled) return;

      void analyticsService
        .trackEvent(`${resolvedConfig.analytics.trackingPrefix}_${isPlaying ? 'play' : 'pause'}`, {
          variant: resolvedConfig.variant,
          timestamp: new Date().toISOString(),
        })
        .catch(() => {
          // Analytics tracking failed silently
        });
    },
    [enableAnalytics, resolvedConfig]
  );

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
    onPlayPause: handlePlayPause,
  };

  // Rendering errors are caught by SectionErrorBoundary (parent layer).
  // React component rendering is asynchronous — try/catch around JSX
  // does not catch render-time errors. See: react-hooks/error-boundaries rule.
  // VariantComponent is resolved per-variant from a static lookup map
  // (Factory pattern); React Compiler can't statically prove the value is
  // stable and warns conservatively.
  // eslint-disable-next-line react-hooks/static-components
  return <VariantComponent {...variantProps} />;
}

// Export for backward compatibility
export default AppFeaturesCarousel;
