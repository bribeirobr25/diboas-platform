/**
 * Hero Variant Registry
 * 
 * Domain-Driven Design: Centralized registry for all hero variants
 * Service Agnostic Abstraction: Pluggable variant system
 * Code Reusability: Easy to add/remove variants without touching core component
 * Maintenance: Single place to manage all variations
 */

import type { HeroVariantRegistry, HeroVariantComponent } from './types';

// Static imports for critical above-fold variants
import { HeroDefault } from './HeroDefault/HeroDefault';
import { HeroFullBackground } from './HeroFullBackground/HeroFullBackground';

/**
 * Hero Variant Registry
 * 
 * Performance: Critical variants are statically imported, others are lazy-loaded
 * Scalability: Easy to add new variants without touching existing code
 */
export const HERO_VARIANT_REGISTRY: HeroVariantRegistry = {
  // Core variants (static import for performance)
  default: HeroDefault,
  fullBackground: HeroFullBackground,
  
  // Future variants can be easily added here:
  // split: HeroSplit,
  // video: HeroVideo,
  // newsletter: HeroNewsletter,
  // product: HeroProduct,
  // landing: HeroLanding,
  // auth: HeroAuth,
  // pricing: HeroPricing,
} as const;

/**
 * Get a hero variant component by name
 * 
 * @param variantName - The name of the variant to get
 * @returns The variant component or default if not found
 */
export function getHeroVariant(variantName: string): HeroVariantComponent {
  return HERO_VARIANT_REGISTRY[variantName] || HERO_VARIANT_REGISTRY.default;
}

/**
 * Check if a variant exists in the registry
 * 
 * @param variantName - The name of the variant to check
 * @returns True if the variant exists
 */
export function hasHeroVariant(variantName: string): boolean {
  return variantName in HERO_VARIANT_REGISTRY;
}

/**
 * Get all available hero variant names
 * 
 * @returns Array of variant names
 */
export function getAvailableHeroVariants(): string[] {
  return Object.keys(HERO_VARIANT_REGISTRY);
}

/**
 * Runtime configuration type for validation
 */
interface HeroValidationConfig {
  content?: {
    title?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Type guard to check if config has required shape
 */
function isValidConfig(config: unknown): config is HeroValidationConfig {
  return typeof config === 'object' && config !== null;
}

/**
 * Development helper: Validate variant configuration
 *
 * @param variantName - The variant name to validate
 * @param config - The configuration object to validate
 */
export function validateHeroVariant(variantName: string, config: unknown): boolean {
  if (!hasHeroVariant(variantName)) {
    // Dev warning: Hero variant '${variantName}' not found in registry`);
    return false;
  }

  // Type guard for runtime validation
  if (!isValidConfig(config)) {
    // Dev warning: Hero variant '${variantName}' config is not a valid object`);
    return false;
  }

  // Add more validation logic here as needed
  if (!config.content?.title) {
    // Dev warning: Hero variant '${variantName}' missing required content.title`);
    return false;
  }

  return true;
}