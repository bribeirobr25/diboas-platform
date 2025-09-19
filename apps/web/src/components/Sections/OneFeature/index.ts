/**
 * One Feature Section Barrel Export
 * 
 * File Decoupling & Organization: Centralized one feature component exports
 * Code Reusability: Easy imports for one feature functionality
 */

export { OneFeature } from './OneFeature';

// Re-export types for convenience
export type { 
  OneFeatureConfig,
  OneFeatureContent,
  OneFeatureLink,
  OneFeatureAssets,
  OneFeatureSEO
} from '@/config/one-feature';