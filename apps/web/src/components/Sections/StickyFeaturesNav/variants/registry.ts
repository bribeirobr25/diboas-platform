/**
 * StickyFeaturesNav Variant Registry
 *
 * Domain-Driven Design: Service discovery for sticky features nav variants
 * Service Agnostic Abstraction: Centralized variant management
 * Code Reusability: Single source of truth for variant resolution
 */

import { StickyFeaturesNavDefault } from './StickyFeaturesNavDefault/StickyFeaturesNavDefault';
import type { StickyFeaturesNavVariantRegistry } from './types';

/**
 * Registry of all available StickyFeaturesNav variants
 *
 * Domain-Driven Design: Centralized variant discovery
 * Service Agnostic: Each variant is independently loadable
 * Type Safety: Strongly typed variant registry
 */
export const STICKY_FEATURES_NAV_VARIANT_REGISTRY: StickyFeaturesNavVariantRegistry = {
  default: StickyFeaturesNavDefault,
} as const;

/**
 * Get variant component by name with fallback
 *
 * @param variant - Variant name to resolve
 * @returns Variant component or default if not found
 */
export function getStickyFeaturesNavVariant(variant: string = 'default') {
  const VariantComponent = STICKY_FEATURES_NAV_VARIANT_REGISTRY[variant];

  if (!VariantComponent) {
    console.warn(
      `StickyFeaturesNav variant '${variant}' not found. Falling back to 'default'.`
    );
    return STICKY_FEATURES_NAV_VARIANT_REGISTRY.default;
  }

  return VariantComponent;
}
