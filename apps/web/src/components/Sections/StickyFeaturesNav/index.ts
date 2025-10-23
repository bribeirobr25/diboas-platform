/**
 * StickyFeaturesNav Component Exports
 *
 * Domain-Driven Design: Clean component interface
 * Service Agnostic Abstraction: Factory pattern for variant selection
 */

export { StickyFeaturesNavFactory } from './StickyFeaturesNavFactory';
export { StickyFeaturesNavFactory as StickyFeaturesNav } from './StickyFeaturesNavFactory';
export { getStickyFeaturesNavVariant } from './variants/registry';
export { STICKY_FEATURES_NAV_VARIANT_REGISTRY } from './variants/registry';

// Type exports
export type { StickyFeaturesNavFactoryProps } from './StickyFeaturesNavFactory';
export type { StickyFeaturesNavVariantProps } from './variants/types';
export type {
  StickyFeaturesNavVariant,
  StickyFeaturesNavVariantConfig,
  FeatureCategory,
  FeatureItem,
  StickyFeaturesNavSettings,
} from '@/config/stickyFeaturesNav';

// Default export
export { StickyFeaturesNavFactory as default } from './StickyFeaturesNavFactory';
