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
 * Runtime configuration type for validation
 */
interface AppFeaturesCarouselValidationConfig {
  cards?: unknown[];
  [key: string]: unknown;
}

/**
 * Type guard to check if config has required shape
 */
function isValidConfig(config: unknown): config is AppFeaturesCarouselValidationConfig {
  return typeof config === 'object' && config !== null;
}

/**
 * Development helper: Validate variant configuration
 *
 * @param variantName - The variant name to validate
 * @param config - The configuration object to validate
 */
export function validateAppFeaturesCarouselVariant(variantName: string, config: unknown): boolean {
  if (!hasAppFeaturesCarouselVariant(variantName)) {
    // Variant not found in registry
    return false;
  }

  // Type guard for runtime validation
  if (!isValidConfig(config)) {
    // Config is not a valid object
    return false;
  }

  // Add more validation logic here as needed
  const cards = config.cards;
  if (!cards || !Array.isArray(cards) || cards.length === 0) {
    // Missing required cards
    return false;
  }

  return true;
}