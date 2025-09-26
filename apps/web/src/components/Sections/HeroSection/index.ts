/**
 * Unified Hero Section Barrel Export
 * 
 * File Decoupling & Organization: Clean component exports with variant support
 * Code Reusability & DRY: Centralized hero section exports
 * Domain-Driven Design: Single hero domain with configurable variants
 */

export { HeroSection } from './HeroSection';
export type { HeroSectionProps } from './HeroSection';
export type { 
  HeroConfig, 
  HeroVariantConfig, 
  HeroContent, 
  HeroVisualAssets, 
  HeroBackgroundAssets, 
  HeroSEO, 
  HeroVariant 
} from '@/config/hero';
export { HERO_CONFIGS } from '@/config/hero';