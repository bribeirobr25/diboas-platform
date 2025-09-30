/**
 * Unified Sections Barrel Export with Dynamic Loading
 * 
 * File Decoupling & Organization: Centralized section component exports with variant support
 * Code Reusability & DRY: Easy imports for all unified reusable sections
 * Domain-Driven Design: Single section domains with configurable variants
 * Performance & SEO Optimization: Dynamic imports for better bundle splitting
 */

import dynamic from 'next/dynamic';
import React from 'react';

// Loading components
const LoadingDiv = ({ height }: { height: string }) => React.createElement('div', {
  style: { 
    height, 
    backgroundColor: '#f5f5f5', 
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666'
  }
}, 'Loading...');

// Static export for HeroSection (above-the-fold, critical)
export { HeroSection } from './HeroSection';

// Dynamic imports for below-the-fold sections
export const ProductCarousel = dynamic(() => import('./ProductCarousel').then(mod => ({ default: mod.ProductCarousel })), {
  loading: () => React.createElement(LoadingDiv, { height: '400px' }),
  ssr: true
});

export const FeatureShowcase = dynamic(() => import('./FeatureShowcase').then(mod => ({ default: mod.FeatureShowcase })), {
  loading: () => React.createElement(LoadingDiv, { height: '600px' }),
  ssr: true
});

export const AppFeaturesCarousel = dynamic(() => import('./AppFeaturesCarousel').then(mod => ({ default: mod.AppFeaturesCarousel })), {
  loading: () => React.createElement(LoadingDiv, { height: '500px' }),
  ssr: true
});

export const SecurityOneFeature = dynamic(() => import('./SecurityOneFeature').then(mod => ({ default: mod.SecurityOneFeature })), {
  loading: () => React.createElement(LoadingDiv, { height: '400px' }),
  ssr: true
});

// BenefitsCarousel is also available for dynamic import
export const BenefitsCarousel = dynamic(() => import('./BenefitsCarousel').then(mod => ({ default: mod.BenefitsCarousel })), {
  loading: () => React.createElement(LoadingDiv, { height: '450px' }),
  ssr: true
});

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