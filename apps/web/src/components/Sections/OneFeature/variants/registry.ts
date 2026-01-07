/**
 * OneFeature Variant Registry
 * 
 * Domain-Driven Design: Centralized variant management
 * Service Agnostic Abstraction: Dynamic variant loading
 * Code Reusability: Single source of truth for variants
 * Performance: Lazy loading for bundle optimization
 */

import { Logger } from '@/lib/monitoring/Logger';
import type { 
  OneFeatureVariantComponent, 
  OneFeatureVariantRegistry 
} from './types';

// Dynamic imports for code splitting
import { OneFeatureDefault } from './OneFeatureDefault';

/**
 * Registry of all available OneFeature variants
 * Performance: Core variants use static imports
 */
export const ONE_FEATURE_VARIANT_REGISTRY: OneFeatureVariantRegistry = {
  // Core variant (static import for performance)
  default: OneFeatureDefault,
};

/**
 * Get a specific OneFeature variant by name
 * Error Handling: Returns default variant if requested variant not found
 */
export function getOneFeatureVariant(
  variant: string
): OneFeatureVariantComponent {
  const VariantComponent = ONE_FEATURE_VARIANT_REGISTRY[variant];
  
  if (!VariantComponent) {
    Logger.warn('OneFeature variant not found, using default', { 
      requestedVariant: variant,
      availableVariants: Object.keys(ONE_FEATURE_VARIANT_REGISTRY)
    });
    return ONE_FEATURE_VARIANT_REGISTRY.default;
  }
  
  return VariantComponent;
}

/**
 * Check if a variant exists in the registry
 * Security: Validates variant names before usage
 */
export function hasOneFeatureVariant(variant: string): boolean {
  return variant in ONE_FEATURE_VARIANT_REGISTRY;
}

/**
 * Get all available variant names
 * Monitoring & Observability: Useful for debugging and analytics
 */
export function getOneFeatureVariantNames(): string[] {
  return Object.keys(ONE_FEATURE_VARIANT_REGISTRY);
}

/**
 * Validate variant configuration
 * Security & Audit Standards: Ensures configuration integrity
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Validation function accepts untyped runtime data
export function validateOneFeatureVariant(
  variant: string,
  config: any
): void {
  if (!hasOneFeatureVariant(variant)) {
    Logger.error('Invalid OneFeature variant', { variant });
    throw new Error(`Invalid OneFeature variant: ${variant}`);
  }

  // Additional validation logic can be added here
  if (!config?.content?.features || !Array.isArray(config.content.features)) {
    Logger.error('Invalid OneFeature configuration', { variant, config });
    throw new Error('OneFeature configuration must include features array');
  }
}