/**
 * Hero Section Examples
 * 
 * Service Agnostic Abstraction: Example implementations for different use cases
 * Code Reusability & DRY Principles: Reusable hero configurations
 */

import { HeroSection } from './HeroSection';
import { HeroSectionFullBg } from '../HeroSectionFullBg';
import { DEFAULT_HERO_CONFIG } from '@/config/hero';

// Example 1: Original Hero Section with visual content
export function HeroSectionWithVisuals() {
  return (
    <HeroSection 
      config={DEFAULT_HERO_CONFIG}
      enableAnalytics={true}
    />
  );
}

// Example 2: Full Background Hero Section
export function HeroSectionWithFullBackground() {
  return (
    <HeroSectionFullBg 
      config={DEFAULT_HERO_CONFIG}
      backgroundImage="/assets/socials/drawing/bg-diboas-abstract.avif"
      enableAnalytics={true}
    />
  );
}

// Example 3: Custom content with full background
export function HeroSectionCustomContent() {
  const customConfig = {
    ...DEFAULT_HERO_CONFIG,
    content: {
      title: "Transform Your Financial Future",
      description: "Experience the power of DeFi with our innovative platform",
      ctaText: "Get Started",
      ctaHref: "/signup",
      ctaTarget: "_self" as const
    }
  };

  return (
    <HeroSectionFullBg 
      config={customConfig}
      backgroundImage="/assets/socials/drawing/bg-diboas-abstract.avif"
      enableAnalytics={true}
    />
  );
}

// Example 4: Different background image
export function HeroSectionAlternativeBackground() {
  return (
    <HeroSectionFullBg 
      config={DEFAULT_HERO_CONFIG}
      backgroundImage="/assets/socials/drawing/bg-desktop-acqua.avif"
      enableAnalytics={true}
    />
  );
}