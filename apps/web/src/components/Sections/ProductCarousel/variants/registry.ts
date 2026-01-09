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
 * Runtime configuration type for validation
 */
interface ProductCarouselValidationConfig {
  content?: {
    slides?: unknown[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Type guard to check if config has required shape
 */
function isValidConfig(config: unknown): config is ProductCarouselValidationConfig {
  return typeof config === 'object' && config !== null;
}

/**
 * Development helper: Validate variant configuration
 *
 * @param variantName - The variant name to validate
 * @param config - The configuration object to validate
 */
export function validateProductCarouselVariant(variantName: string, config: unknown): boolean {
  if (!hasProductCarouselVariant(variantName)) {
    // Variant not found in registry
    return false;
  }

  // Type guard for runtime validation
  if (!isValidConfig(config)) {
    // Config is not a valid object
    return false;
  }

  // Add more validation logic here as needed
  const slides = config.content?.slides;
  if (!slides || !Array.isArray(slides) || slides.length === 0) {
    // Missing required slides
    return false;
  }

  return true;
}