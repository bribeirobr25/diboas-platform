/**
 * HeroSection Factory Component
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
import { HERO_CONFIGS, type HeroVariantConfig, type HeroVariant } from '@/config/hero';
import { analyticsService } from '@/lib/analytics';
import { getHeroVariant, validateHeroVariant } from './variants/registry';
import type { HeroVariantProps } from './variants/types';
import { useConfigTranslation } from '@/lib/i18n/config-translator';

export interface HeroSectionProps {
  /**
   * Hero variant to render - determines layout and behavior
   */
  variant?: string;

  /**
   * Custom hero configuration - overrides default config
   */
  config?: Partial<HeroVariantConfig>;

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
 * HeroSection Factory Component
 * 
 * Monitoring & Observability: Built-in analytics and error tracking
 * Performance: Variant-based code splitting and lazy loading
 */
export function HeroSection({
  variant = 'default',
  config: customConfig,
  className = '',
  enableAnalytics = true,
  backgroundColor,
  priority = true
}: HeroSectionProps) {
  // Domain-Driven Design: Configuration resolution with validation
  const baseResolvedConfig = useMemo(() => {
    const baseConfig = HERO_CONFIGS[variant as HeroVariant] || HERO_CONFIGS.default;
    const finalConfig = customConfig
      ? { ...baseConfig, ...customConfig } as HeroVariantConfig
      : baseConfig;

    // Security: Validate configuration in development
    if (process.env.NODE_ENV === 'development') {
      validateHeroVariant(variant, finalConfig);
    }

    return finalConfig;
  }, [variant, customConfig]);

  // Internationalization: Translate config using translation keys
  const resolvedConfig = useConfigTranslation(baseResolvedConfig);

  // Performance: Get variant component with memoization
  const VariantComponent = useMemo(() => {
    return getHeroVariant(variant);
  }, [variant]);

  // Product KPIs & Analytics: CTA interaction tracking
  const handleCTAClick = useCallback(async () => {
    if (!enableAnalytics || !resolvedConfig.analytics?.enabled) return;

    try {
      // Track CTA click event
      await analyticsService.trackEvent(`${resolvedConfig.analytics.trackingPrefix}_cta_click`, {
        page: window.location.pathname,
        variant: resolvedConfig.variant,
        cta_text: resolvedConfig.content.ctaText,
        cta_href: resolvedConfig.content.ctaHref,
        timestamp: new Date().toISOString()
      });

      // Navigate based on target
      if (resolvedConfig.content.ctaTarget === '_blank') {
        window.open(resolvedConfig.content.ctaHref, '_blank', 'noopener,noreferrer');
      } else {
        // Use Next.js navigation for internal links
        window.location.href = resolvedConfig.content.ctaHref;
      }
    } catch {
      // Error Handling: Don't let analytics failures break user experience

      // Still navigate even if analytics fails
      if (resolvedConfig.content.ctaTarget === '_blank') {
        window.open(resolvedConfig.content.ctaHref, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = resolvedConfig.content.ctaHref;
      }
    }
  }, [enableAnalytics, resolvedConfig]);

  // Variant props with shared logic
  const variantProps: HeroVariantProps = {
    config: resolvedConfig,
    className,
    enableAnalytics,
    priority,
    backgroundColor,
    onCTAClick: handleCTAClick
  };

  // Rendering errors are caught by SectionErrorBoundary (parent layer).
  // React component rendering is asynchronous — try/catch around JSX
  // does not catch render-time errors. See: react-hooks/error-boundaries rule.
  // (Mirrors AppFeaturesCarouselFactory.tsx pattern; the previous try/catch
  // here was futile because it could only catch synchronous throws during
  // JSX construction, not during the React render phase.)
  // eslint-disable-next-line react-hooks/static-components
  return <VariantComponent {...variantProps} />;
}

// Export for backward compatibility
export default HeroSection;