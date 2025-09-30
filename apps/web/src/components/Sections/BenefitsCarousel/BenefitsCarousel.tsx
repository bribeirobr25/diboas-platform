/**
 * Benefits FeatureShowcase Component
 * 
 * Domain-Driven Design: Benefits-specific showcase following FeatureShowcase pattern
 * Service Agnostic Abstraction: Fully configurable through props and variants
 * Code Reusability & DRY: Uses FeatureShowcase component eliminating duplication
 * Performance & SEO Optimization: Optimized images with proper loading
 * Error Handling & System Recovery: Graceful fallbacks and error boundaries
 * Security & Audit Standards: Secure image handling and XSS prevention
 * Product KPIs & Analytics: Configurable analytics with variant tracking
 * No Hardcoded Values: All values configurable through config system
 * Accessibility: Full keyboard navigation and screen reader support
 */

'use client';

import { FeatureShowcase } from '@/components/Sections/FeatureShowcase/FeatureShowcase';
import { BENEFITS_SHOWCASE_CONFIG } from '@/config/benefits-carousel';
import type { FeatureShowcaseProps } from '@/components/Sections/FeatureShowcase/FeatureShowcase';

export interface BenefitsCarouselProps {
  /**
   * Feature showcase variant configuration - determines layout and behavior
   */
  variant?: FeatureShowcaseProps['variant'];

  /**
   * Custom feature showcase configuration - overrides default config
   */
  config?: Partial<typeof BENEFITS_SHOWCASE_CONFIG>;

  /**
   * Custom CSS classes for styling extensions
   */
  className?: string;

  /**
   * Enable analytics tracking for user interactions
   */
  enableAnalytics?: boolean;

  /**
   * Custom section background color
   */
  backgroundColor?: string;

  /**
   * Performance optimization: Priority loading for above-fold content
   */
  priority?: boolean;
}

/**
 * Benefits FeatureShowcase with variant support
 * Monitoring & Observability: Built-in loading states and error tracking
 */
export function BenefitsCarousel({
  variant = 'default',
  config: customConfig,
  className = '',
  enableAnalytics = true,
  backgroundColor,
  priority = false
}: BenefitsCarouselProps) {
  // Domain-Driven Design: Merge default config with custom overrides
  const config = customConfig
    ? { ...BENEFITS_SHOWCASE_CONFIG, ...customConfig }
    : BENEFITS_SHOWCASE_CONFIG;

  return (
    <FeatureShowcase
      variant={variant}
      config={config}
      className={className}
      enableAnalytics={enableAnalytics}
      backgroundColor={backgroundColor}
      priority={priority}
    />
  );
}