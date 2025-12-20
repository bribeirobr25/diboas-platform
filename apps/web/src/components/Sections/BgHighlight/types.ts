/**
 * BgHighlight Type Definitions
 *
 * Domain-Driven Design: Background highlight section domain types
 * Service Agnostic Abstraction: Pure type definitions without implementation
 * Type Safety: Comprehensive TypeScript interfaces for all section configurations
 */

/**
 * Background Image Configuration
 */
export interface BgHighlightImage {
  /** Image source path */
  src: string;
  /** Accessibility alt text for the background image */
  alt: string;
}

/**
 * Content Configuration
 */
export interface BgHighlightContent {
  /** Main title text */
  title: string;
  /** Description text */
  description: string;
  /** CTA button text (optional) */
  ctaText?: string;
  /** CTA button href (optional) */
  ctaHref?: string;
}

/**
 * SEO Configuration
 */
export interface BgHighlightSEO {
  /** Heading level for the title (default: h2) */
  headingLevel?: 'h1' | 'h2' | 'h3';
  /** ARIA label for the section */
  ariaLabel?: string;
}

/**
 * Analytics Configuration
 */
export interface BgHighlightAnalytics {
  /** Unique section identifier for analytics */
  sectionId: string;
  /** Analytics category */
  category?: string;
}

/**
 * Complete BgHighlight Configuration
 */
export interface BgHighlightConfig {
  /** Background image configuration */
  backgroundImage: BgHighlightImage;
  /** Content configuration */
  content: BgHighlightContent;
  /** SEO configuration */
  seo: BgHighlightSEO;
  /** Analytics configuration (optional) */
  analytics?: BgHighlightAnalytics;
}

/**
 * Variant Component Props
 */
export interface BgHighlightVariantProps {
  /** Section configuration */
  config: BgHighlightConfig;
  /** Additional CSS class names */
  className?: string;
  /** Enable analytics tracking */
  enableAnalytics?: boolean;
  /** Priority loading for LCP optimization */
  priority?: boolean;
}

/**
 * Supported BgHighlight Variants
 */
export type BgHighlightVariant = 'default';

/**
 * Section Component Props (Factory Pattern)
 */
export interface BgHighlightSectionProps {
  /** Section configuration */
  config: BgHighlightConfig;
  /** Variant to render (default: 'default') */
  variant?: BgHighlightVariant;
  /** Additional CSS class names */
  className?: string;
  /** Enable analytics tracking */
  enableAnalytics?: boolean;
  /** Priority loading for LCP optimization */
  priority?: boolean;
}
