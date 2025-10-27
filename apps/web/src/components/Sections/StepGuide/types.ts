/**
 * StepGuide Type Definitions
 *
 * Domain-Driven Design: Step-by-step guide domain types
 * Service Agnostic Abstraction: Pure type definitions without implementation
 * Type Safety: Comprehensive TypeScript interfaces for all section configurations
 */

/**
 * Individual Step Configuration
 */
export interface Step {
  /** Unique step identifier */
  id: string;
  /** Step number (e.g., "01", "02") */
  number: string;
  /** Step instruction text */
  text: string;
}

/**
 * Content Configuration
 */
export interface StepGuideContent {
  /** Section title */
  title: string;
  /** Array of steps */
  steps: Step[];
}

/**
 * SEO Configuration
 */
export interface StepGuideSEO {
  /** Heading level for the title (default: h2) */
  headingLevel?: 'h1' | 'h2' | 'h3';
  /** ARIA label for the section */
  ariaLabel?: string;
}

/**
 * Analytics Configuration
 */
export interface StepGuideAnalytics {
  /** Unique section identifier for analytics */
  sectionId: string;
  /** Analytics category */
  category?: string;
}

/**
 * Complete StepGuide Configuration
 */
export interface StepGuideConfig {
  /** Content configuration */
  content: StepGuideContent;
  /** SEO configuration */
  seo: StepGuideSEO;
  /** Analytics configuration (optional) */
  analytics?: StepGuideAnalytics;
}

/**
 * Variant Component Props
 */
export interface StepGuideVariantProps {
  /** Section configuration */
  config: StepGuideConfig;
  /** Additional CSS class names */
  className?: string;
  /** Enable analytics tracking */
  enableAnalytics?: boolean;
}

/**
 * Supported StepGuide Variants
 */
export type StepGuideVariant = 'default';

/**
 * Section Component Props (Factory Pattern)
 */
export interface StepGuideSectionProps {
  /** Section configuration */
  config: StepGuideConfig;
  /** Variant to render (default: 'default') */
  variant?: StepGuideVariant;
  /** Additional CSS class names */
  className?: string;
  /** Enable analytics tracking */
  enableAnalytics?: boolean;
}
