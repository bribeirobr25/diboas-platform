/**
 * Section Configuration Utilities
 *
 * Configuration merging and validation
 */

import { Logger } from '@/lib/monitoring/Logger';
import type { BaseSectionConfig } from './SectionPattern';

/**
 * Merge section configurations with type safety
 */
export function mergeSectionConfig<T extends BaseSectionConfig<string, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>>>(
  baseConfig: T,
  customConfig?: Partial<T>
): T {
  if (!customConfig) return baseConfig;

  try {
    // Deep merge configurations
    const merged = {
      ...baseConfig,
      ...customConfig,
      content: {
        ...baseConfig.content,
        ...(customConfig.content || {})
      },
      settings: {
        ...baseConfig.settings,
        ...(customConfig.settings || {})
      },
      analytics: customConfig.analytics ? {
        ...baseConfig.analytics,
        ...customConfig.analytics
      } : baseConfig.analytics,
      seo: {
        ...baseConfig.seo,
        ...(customConfig.seo || {})
      }
    } as T;

    Logger.debug('Section configuration merged', {
      variant: merged.variant,
      hasCustomConfig: !!customConfig
    });

    return merged;

  } catch (error) {
    Logger.error('Failed to merge section configuration', {
      error: error instanceof Error ? error.message : 'Unknown error',
      variant: baseConfig.variant
    });

    // Return base config on merge failure
    return baseConfig;
  }
}

/**
 * Validate section configuration
 */
export function validateSectionConfig<T extends BaseSectionConfig<string, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>>>(
  config: T
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate required fields
  if (!config.variant) {
    errors.push('Missing required field: variant');
  }

  if (!config.content) {
    errors.push('Missing required field: content');
  }

  if (!config.settings) {
    errors.push('Missing required field: settings');
  }

  if (!config.seo) {
    errors.push('Missing required field: seo');
  } else {
    if (!config.seo.ariaLabel) {
      errors.push('Missing required field: seo.ariaLabel');
    }
  }

  // Validate analytics configuration if present
  if (config.analytics) {
    if (!config.analytics.trackingPrefix) {
      errors.push('Missing required field: analytics.trackingPrefix');
    }

    if (!config.analytics.events) {
      errors.push('Missing required field: analytics.events');
    }
  }

  const isValid = errors.length === 0;

  if (!isValid) {
    Logger.warn('Section configuration validation failed', {
      variant: config.variant,
      errors
    });
  }

  return { isValid, errors };
}
