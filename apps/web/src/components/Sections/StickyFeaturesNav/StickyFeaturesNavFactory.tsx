/**
 * StickyFeaturesNav Factory Component
 *
 * Domain-Driven Design: Factory pattern for sticky features nav variants
 * Service Agnostic Abstraction: Variant selection and configuration
 * Error Handling: Graceful fallbacks and error boundaries
 * Performance: Optimized variant loading and configuration merging
 */

'use client';

import React, { useMemo } from 'react';
import { getStickyFeaturesNavVariant } from './variants/registry';
import { STICKY_FEATURES_NAV_CONFIGS } from '@/config/stickyFeaturesNav';
import type { StickyFeaturesNavVariantConfig } from '@/config/stickyFeaturesNav';

export interface StickyFeaturesNavFactoryProps {
  /**
   * Variant to render - determines layout and behavior
   * @default 'default'
   */
  variant?: string;

  /**
   * Custom configuration - overrides default config
   */
  config?: Partial<StickyFeaturesNavVariantConfig>;

  /**
   * Custom CSS classes for styling extensions
   */
  className?: string;

  /**
   * Enable analytics tracking for user interactions
   * @default true
   */
  enableAnalytics?: boolean;

  /**
   * Custom section background color override
   */
  backgroundColor?: string;

  /**
   * Callback when a nav item is clicked
   */
  onNavItemClick?: (categoryId: string) => void;

  /**
   * Callback when active category changes
   */
  onActiveCategoryChange?: (categoryId: string) => void;

  /**
   * Callback when CTA is clicked
   */
  onCTAClick?: (categoryId: string, itemId: string, href: string) => void;
}

/**
 * StickyFeaturesNav Factory Component
 *
 * Provides a unified interface for rendering different sticky features nav variants
 * with consistent configuration management and error handling.
 *
 * @example
 * ```tsx
 * // Basic usage with default variant
 * <StickyFeaturesNavFactory />
 *
 * // With custom configuration
 * <StickyFeaturesNavFactory
 *   variant="default"
 *   config={{
 *     mainTitle: "Custom Title",
 *     settings: {
 *       condenseScrollThreshold: 150,
 *     }
 *   }}
 *   enableAnalytics={true}
 * />
 * ```
 */
export function StickyFeaturesNavFactory({
  variant = 'default',
  config: customConfig,
  className = '',
  enableAnalytics = true,
  backgroundColor,
  onNavItemClick,
  onActiveCategoryChange,
  onCTAClick,
}: StickyFeaturesNavFactoryProps) {
  // Configuration Management: Merge custom config with defaults
  const resolvedConfig = useMemo<StickyFeaturesNavVariantConfig>(() => {
    const baseConfig =
      STICKY_FEATURES_NAV_CONFIGS[variant as keyof typeof STICKY_FEATURES_NAV_CONFIGS] ||
      STICKY_FEATURES_NAV_CONFIGS.default;

    if (!customConfig) {
      return baseConfig;
    }

    // Deep merge configuration
    return {
      ...baseConfig,
      ...customConfig,
      settings: {
        ...baseConfig.settings,
        ...(customConfig.settings || {}),
      },
      analytics: {
        ...baseConfig.analytics,
        ...(customConfig.analytics || {}),
      },
    } as StickyFeaturesNavVariantConfig;
  }, [variant, customConfig]);

  // Service Discovery: Resolve variant component
  const VariantComponent = useMemo(() => {
    return getStickyFeaturesNavVariant(variant);
  }, [variant]);

  // Security: Validate configuration in development
  if (process.env.NODE_ENV === 'development') {
    if (!resolvedConfig.categories || resolvedConfig.categories.length === 0) {
      console.warn(
        '[StickyFeaturesNavFactory] No categories provided in configuration'
      );
    }
  }

  // Props assembly
  const variantProps = {
    config: resolvedConfig,
    className,
    enableAnalytics,
    backgroundColor,
    onNavItemClick,
    onActiveCategoryChange,
    onCTAClick,
  };

  // Error Handling: Fallback if variant component fails to load
  try {
    return <VariantComponent {...variantProps} />;
  } catch (error) {
    console.error(
      `Failed to render StickyFeaturesNav variant '${variant}':`,
      error
    );

    // Fallback to default variant
    const DefaultVariant = getStickyFeaturesNavVariant('default');
    return <DefaultVariant {...variantProps} />;
  }
}

// Default export for convenience
export default StickyFeaturesNavFactory;
