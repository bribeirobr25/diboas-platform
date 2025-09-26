/**
 * Unified App Features Carousel Barrel Export
 * 
 * File Decoupling & Organization: Clean component exports with variant support
 * Code Reusability & DRY: Centralized app features carousel exports
 * Domain-Driven Design: Single carousel domain with configurable variants
 */

export { AppFeaturesCarousel } from './AppFeaturesCarousel';
export type { AppFeaturesCarouselProps } from './AppFeaturesCarousel';
export type { 
  AppFeaturesCarouselConfig,
  AppFeaturesCarouselVariantConfig,
  AppFeatureCard,
  AppFeatureContent,
  AppFeatureAssets,
  AppFeatureSEO,
  AppFeaturesCarouselVariant
} from '@/config/appFeaturesCarousel';
export { APP_FEATURES_CAROUSEL_CONFIGS } from '@/config/appFeaturesCarousel';