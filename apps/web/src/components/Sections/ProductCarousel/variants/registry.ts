/**
 * ProductCarousel Variant Registry
 * 
 * Domain-Driven Design: Centralized registry for all carousel variants
 * Service Agnostic Abstraction: Pluggable variant system
 * Code Reusability: Easy to add/remove variants without touching core component
 * Maintenance: Single place to manage all variations
 */

import type { ProductCarouselVariantRegistry, ProductCarouselVariantComponent } from './types';

// Static imports for critical variants
import { ProductCarouselDefault } from './ProductCarouselDefault/ProductCarouselDefault';

/**
 * ProductCarousel Variant Registry
 * 
 * Performance: Only the actively used default variant is included
 * Scalability: Easy to add new variants when needed
 */
export const PRODUCT_CAROUSEL_VARIANT_REGISTRY: ProductCarouselVariantRegistry = {
  // Core variants (static import for performance)
  default: ProductCarouselDefault,
  
  // Future variants can be easily added here when needed:
  // grid: ProductCarouselGrid,
  // stack: ProductCarouselStack,
  // masonry: ProductCarouselMasonry,
  // timeline: ProductCarouselTimeline,
  // gallery: ProductCarouselGallery,
  // compare: ProductCarouselCompare,
  // featured: ProductCarouselFeatured,
} as const;

/**
 * Get a product carousel variant component by name
 * 
 * @param variantName - The name of the variant to get
 * @returns The variant component or default if not found
 */
export function getProductCarouselVariant(variantName: string): ProductCarouselVariantComponent {
  return PRODUCT_CAROUSEL_VARIANT_REGISTRY[variantName] || PRODUCT_CAROUSEL_VARIANT_REGISTRY.default;
}

/**
 * Check if a variant exists in the registry
 * 
 * @param variantName - The name of the variant to check
 * @returns True if the variant exists
 */
export function hasProductCarouselVariant(variantName: string): boolean {
  return variantName in PRODUCT_CAROUSEL_VARIANT_REGISTRY;
}

/**
 * Get all available product carousel variant names
 * 
 * @returns Array of variant names
 */
export function getAvailableProductCarouselVariants(): string[] {
  return Object.keys(PRODUCT_CAROUSEL_VARIANT_REGISTRY);
}

/**
 * Development helper: Validate variant configuration
 * 
 * @param variantName - The variant name to validate
 * @param config - The configuration object to validate
 */
export function validateProductCarouselVariant(variantName: string, config: any): boolean {
  if (!hasProductCarouselVariant(variantName)) {
    console.warn(`ProductCarousel variant '${variantName}' not found in registry`);
    return false;
  }

  // Add more validation logic here as needed
  if (!config?.content?.slides?.length) {
    console.warn(`ProductCarousel variant '${variantName}' missing required slides`, {
      variant: variantName,
      config: config ? 'Config exists' : 'No config',
      contentExists: !!config?.content,
      slidesExists: !!config?.content?.slides,
      slidesLength: config?.content?.slides?.length || 0
    });
    return false;
  }

  return true;
}