/**
 * FeatureShowcase Variant Registry
 * 
 * Domain-Driven Design: Centralized registry for all showcase variants
 * Service Agnostic Abstraction: Pluggable variant system
 * Code Reusability: Easy to add/remove variants without touching core component
 * Maintenance: Single place to manage all variations
 */

import dynamic from 'next/dynamic';
import type { FeatureShowcaseVariantRegistry, FeatureShowcaseVariantComponent } from './types';

// Static imports for critical variants
import { FeatureShowcaseDefault } from './FeatureShowcaseDefault/FeatureShowcaseDefault';

// Dynamic imports for additional variants (performance optimization)
const FeatureShowcaseBenefits = dynamic(
  () => import('./FeatureShowcaseBenefits/FeatureShowcaseBenefits')
    .then(mod => ({ default: mod.FeatureShowcaseBenefits }))
    .catch((error) => {
      // Dev error: 'Failed to load FeatureShowcaseBenefits variant:', error);
      // Fallback to default variant
      return { default: FeatureShowcaseDefault };
    }),
  {
    loading: () => null,
    ssr: true
  }
);

/**
 * FeatureShowcase Variant Registry
 * 
 * Performance: Critical variants are statically imported, others are lazy-loaded
 * Scalability: Easy to add new variants without touching existing code
 */
export const FEATURE_SHOWCASE_VARIANT_REGISTRY: FeatureShowcaseVariantRegistry = {
  // Core variants (static import for performance)
  default: FeatureShowcaseDefault,
  
  // Additional variants (dynamic import for bundle splitting)
  benefits: FeatureShowcaseBenefits as FeatureShowcaseVariantComponent,
  
  // Future variants can be easily added here:
  // carousel: FeatureShowcaseCarousel,
  // timeline: FeatureShowcaseTimeline,
  // tabs: FeatureShowcaseTabs,
  // accordion: FeatureShowcaseAccordion,
  // split: FeatureShowcaseSplit,
} as const;

/**
 * Get a feature showcase variant component by name
 * 
 * @param variantName - The name of the variant to get
 * @returns The variant component or default if not found
 */
export function getFeatureShowcaseVariant(variantName: string): FeatureShowcaseVariantComponent {
  return FEATURE_SHOWCASE_VARIANT_REGISTRY[variantName] || FEATURE_SHOWCASE_VARIANT_REGISTRY.default;
}

/**
 * Check if a variant exists in the registry
 * 
 * @param variantName - The name of the variant to check
 * @returns True if the variant exists
 */
export function hasFeatureShowcaseVariant(variantName: string): boolean {
  return variantName in FEATURE_SHOWCASE_VARIANT_REGISTRY;
}

/**
 * Get all available feature showcase variant names
 * 
 * @returns Array of variant names
 */
export function getAvailableFeatureShowcaseVariants(): string[] {
  return Object.keys(FEATURE_SHOWCASE_VARIANT_REGISTRY);
}

/**
 * Runtime configuration type for validation
 */
interface FeatureShowcaseValidationConfig {
  slides?: unknown[];
  [key: string]: unknown;
}

/**
 * Type guard to check if config has required shape
 */
function isValidConfig(config: unknown): config is FeatureShowcaseValidationConfig {
  return typeof config === 'object' && config !== null;
}

/**
 * Development helper: Validate variant configuration
 *
 * @param variantName - The variant name to validate
 * @param config - The configuration object to validate
 */
export function validateFeatureShowcaseVariant(variantName: string, config: unknown): boolean {
  if (!hasFeatureShowcaseVariant(variantName)) {
    // Dev warning: FeatureShowcase variant '${variantName}' not found in registry`);
    return false;
  }

  // Type guard for runtime validation
  if (!isValidConfig(config)) {
    // Dev warning: FeatureShowcase variant '${variantName}' config is not a valid object`);
    return false;
  }

  // Add more validation logic here as needed
  if (!config.slides || !Array.isArray(config.slides) || config.slides.length === 0) {
    // Dev warning: FeatureShowcase variant '${variantName}' missing required slides`);
    return false;
  }

  return true;
}