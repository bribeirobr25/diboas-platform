/**
 * Unified Sections Barrel Export
 * 
 * File Decoupling & Organization: Centralized section component exports with variant support
 * Code Reusability & DRY: Easy imports for all unified reusable sections
 * Domain-Driven Design: Single section domains with configurable variants
 */

export { HeroSection } from './HeroSection';
export { ProductCarousel } from './ProductCarousel';
export { FeatureShowcase } from './FeatureShowcase';
export { AppFeaturesCarousel } from './AppFeaturesCarousel';
export { SecurityOneFeature } from './SecurityOneFeature';

// Re-export unified types for convenience
export type { 
  HeroConfig, 
  HeroVariantConfig,
  HeroContent, 
  HeroVisualAssets,
  HeroBackgroundAssets,
  HeroSEO,
  HeroVariant
} from './HeroSection';

export type {
  ProductCarouselConfig,
  ProductCarouselVariantConfig,
  ProductCarouselContent,
  ProductCarouselSlide,
  ProductCarouselSettings,
  ProductCarouselSEO,
  ProductCarouselVariant
} from './ProductCarousel';

export type {
  FeatureShowcaseConfig,
  FeatureShowcaseVariantConfig,
  FeatureShowcaseSlide,
  FeatureShowcaseContent,
  FeatureShowcaseAssets,
  FeatureShowcaseSEO,
  FeatureShowcaseVariant
} from './FeatureShowcase';

export type {
  AppFeaturesCarouselConfig,
  AppFeaturesCarouselVariantConfig,
  AppFeatureCard,
  AppFeatureContent,
  AppFeatureAssets,
  AppFeatureSEO,
  AppFeaturesCarouselVariant
} from './AppFeaturesCarousel';

export type {
  SecurityOneFeatureProps,
  SecurityFeature
} from './SecurityOneFeature';