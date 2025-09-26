/**
 * Unified Feature Showcase Barrel Export
 * 
 * File Decoupling & Organization: Clean component exports with variant support
 * Code Reusability & DRY: Centralized feature showcase exports
 * Domain-Driven Design: Single showcase domain with configurable variants
 */

export { FeatureShowcase } from './FeatureShowcase';
export type { FeatureShowcaseProps } from './FeatureShowcase';
export type { 
  FeatureShowcaseConfig, 
  FeatureShowcaseVariantConfig, 
  FeatureShowcaseContent, 
  FeatureShowcaseSlide, 
  FeatureShowcaseAssets,
  FeatureShowcaseSEO, 
  FeatureShowcaseVariant 
} from '@/config/featureShowcase';
export { FEATURE_SHOWCASE_CONFIGS } from '@/config/featureShowcase';