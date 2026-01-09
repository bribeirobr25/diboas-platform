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
 * Runtime configuration type for validation
 */
interface OneFeatureValidationConfig {
  content?: {
    features?: unknown[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Type guard to check if config has required shape
 */
function isValidConfig(config: unknown): config is OneFeatureValidationConfig {
  return typeof config === 'object' && config !== null;
}

/**
 * Validate variant configuration
 * Security & Audit Standards: Ensures configuration integrity
 */
export function validateOneFeatureVariant(
  variant: string,
  config: unknown
): void {
  if (!hasOneFeatureVariant(variant)) {
    Logger.error('Invalid OneFeature variant', { variant });
    throw new Error(`Invalid OneFeature variant: ${variant}`);
  }

  // Type guard for runtime validation
  if (!isValidConfig(config)) {
    Logger.error('Invalid OneFeature configuration', { variant, config: 'Invalid config type' });
    throw new Error('OneFeature configuration must be a valid object');
  }

  // Additional validation logic can be added here
  const features = config.content?.features;
  if (!features || !Array.isArray(features)) {
    Logger.error('Invalid OneFeature configuration', { variant, config: 'Missing features array' });
    throw new Error('OneFeature configuration must include features array');
  }
}