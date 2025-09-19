/**
 * Sections Barrel Export
 * 
 * File Decoupling & Organization: Centralized section component exports
 * Code Reusability: Easy imports for all reusable sections
 */

export { HeroSection } from './HeroSection';
export { ProductCarousel } from './ProductCarousel';
export { FeatureShowcase } from './FeatureShowcase';
export { AppFeaturesCarousel } from './AppFeaturesCarousel';
export { OneFeature } from './OneFeature';

// Re-export types for convenience
export type { 
  HeroConfig, 
  HeroContent, 
  HeroAssets, 
  HeroSEO 
} from './HeroSection';

export type {
  CarouselConfig,
  CarouselSlide,
  CarouselSettings
} from './ProductCarousel';

export type {
  FeatureShowcaseConfig,
  FeatureShowcaseSlide,
  FeatureShowcaseContent,
  FeatureShowcaseAssets,
  FeatureShowcaseSEO
} from './FeatureShowcase';

export type {
  AppFeaturesCarouselConfig,
  AppFeatureCard,
  AppFeatureContent,
  AppFeatureAssets,
  AppFeatureSEO
} from './AppFeaturesCarousel';

export type {
  OneFeatureConfig,
  OneFeatureContent,
  OneFeatureLink,
  OneFeatureAssets,
  OneFeatureSEO
} from './OneFeature';