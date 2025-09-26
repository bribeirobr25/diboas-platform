/**
 * Unified Product Carousel Barrel Export
 * 
 * File Decoupling & Organization: Clean component exports with variant support
 * Code Reusability & DRY: Centralized product carousel exports
 * Domain-Driven Design: Single carousel domain with configurable variants
 */

export { ProductCarousel } from './ProductCarousel';
export type { ProductCarouselProps } from './ProductCarousel';
export type { 
  ProductCarouselConfig, 
  ProductCarouselVariantConfig, 
  ProductCarouselContent, 
  ProductCarouselSlide, 
  ProductCarouselSettings,
  ProductCarouselSEO, 
  ProductCarouselVariant 
} from '@/config/productCarousel';
export { PRODUCT_CAROUSEL_CONFIGS } from '@/config/productCarousel';