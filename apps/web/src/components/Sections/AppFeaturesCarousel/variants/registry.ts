/**
 * AppFeaturesCarousel Variant Registry
 * 
 * Domain-Driven Design: Centralized registry for all app features carousel variants
 * Service Agnostic Abstraction: Pluggable variant system
 * Code Reusability: Easy to add/remove variants without touching core component
 * Maintenance: Single place to manage all variations
 */

import dynamic from 'next/dynamic';
import type { AppFeaturesCarouselVariantRegistry, AppFeaturesCarouselVariantComponent } from './types';

// Static imports for critical variants
import { AppFeaturesCarouselDefault } from './AppFeaturesCarouselDefault/AppFeaturesCarouselDefault';

// No additional variants - removed unused Grid and Masonry variants

/**
 * AppFeaturesCarousel Variant Registry
 * 
 * Performance: Critical variants are statically imported, others are lazy-loaded
 * Scalability: Easy to add new variants without touching existing code
 */
export const APP_FEATURES_CAROUSEL_VARIANT_REGISTRY: AppFeaturesCarouselVariantRegistry = {
  // Core variants (static import for performance)
  default: AppFeaturesCarouselDefault,
  
  // Future variants can be easily added here:
  // timeline: AppFeaturesCarouselTimeline,
  // tabs: AppFeaturesCarouselTabs,
  // stack: AppFeaturesCarouselStack,
  // comparison: AppFeaturesCarouselComparison,
  // showcase: AppFeaturesCarouselShowcase,
} as const;

/**
 * Get an app features carousel variant component by name
 * 
 * @param variantName - The name of the variant to get
 * @returns The variant component or default if not found
 */
export function getAppFeaturesCarouselVariant(variantName: string): AppFeaturesCarouselVariantComponent {
  return APP_FEATURES_CAROUSEL_VARIANT_REGISTRY[variantName] || APP_FEATURES_CAROUSEL_VARIANT_REGISTRY.default;
}

/**
 * Check if a variant exists in the registry
 * 
 * @param variantName - The name of the variant to check
 * @returns True if the variant exists
 */
export function hasAppFeaturesCarouselVariant(variantName: string): boolean {
  return variantName in APP_FEATURES_CAROUSEL_VARIANT_REGISTRY;
}

/**
 * Get all available app features carousel variant names
 * 
 * @returns Array of variant names
 */
export function getAvailableAppFeaturesCarouselVariants(): string[] {
  return Object.keys(APP_FEATURES_CAROUSEL_VARIANT_REGISTRY);
}

/**
 * Development helper: Validate variant configuration
 * 
 * @param variantName - The variant name to validate
 * @param config - The configuration object to validate
 */
export function validateAppFeaturesCarouselVariant(variantName: string, config: any): boolean {
  if (!hasAppFeaturesCarouselVariant(variantName)) {
    console.warn(`AppFeaturesCarousel variant '${variantName}' not found in registry`);
    return false;
  }

  // Add more validation logic here as needed
  if (!config?.cards?.length) {
    console.warn(`AppFeaturesCarousel variant '${variantName}' missing required cards`, {
      variant: variantName,
      config: config ? 'Config exists' : 'No config',
      cardsExists: !!config?.cards,
      cardsLength: config?.cards?.length || 0
    });
    return false;
  }

  return true;
}