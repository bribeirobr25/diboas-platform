/**
 * Feature Showcase Barrel Export
 * 
 * File Decoupling & Organization: Centralized feature showcase component exports
 * Code Reusability: Easy imports for feature showcase functionality
 */

export { FeatureShowcase } from './FeatureShowcase';

// Re-export types for convenience
export type { 
  FeatureShowcaseConfig,
  FeatureShowcaseSlide,
  FeatureShowcaseContent,
  FeatureShowcaseAssets,
  FeatureShowcaseSEO
} from '@/config/feature-showcase';