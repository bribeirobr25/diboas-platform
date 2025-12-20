/**
 * DemoEmbed Type Definitions
 *
 * Domain-Driven Design: Demo embed section domain types
 * Service Agnostic Abstraction: Pure type definitions without implementation
 * Type Safety: Comprehensive TypeScript interfaces for all section configurations
 */

/**
 * Content Configuration
 */
export interface DemoEmbedContent {
  /** Section header text (translation key) */
  header: string;
  /** Subtext below the header (translation key) */
  subtext: string;
}

/**
 * Demo Configuration
 */
export interface DemoEmbedDemo {
  /** Demo embed URL (iframe src) */
  embedUrl?: string;
  /** Demo component to render (if not using iframe) */
  component?: React.ComponentType<any>;
  /** Placeholder message when demo is not available */
  placeholder?: string;
}

/**
 * SEO Configuration
 */
export interface DemoEmbedSEO {
  /** Heading level for the header (default: h2) */
  headingLevel?: 'h1' | 'h2' | 'h3';
  /** ARIA label for the section */
  ariaLabel?: string;
}

/**
 * Analytics Configuration
 */
export interface DemoEmbedAnalytics {
  /** Unique section identifier for analytics */
  sectionId: string;
  /** Analytics category */
  category?: string;
}

/**
 * Complete DemoEmbed Configuration
 */
export interface DemoEmbedConfig {
  /** Content configuration */
  content: DemoEmbedContent;
  /** Demo configuration */
  demo?: DemoEmbedDemo;
  /** SEO configuration */
  seo: DemoEmbedSEO;
  /** Analytics configuration (optional) */
  analytics?: DemoEmbedAnalytics;
}

/**
 * Variant Component Props
 */
export interface DemoEmbedVariantProps {
  /** Section configuration */
  config: DemoEmbedConfig;
  /** Additional CSS class names */
  className?: string;
  /** Enable analytics tracking */
  enableAnalytics?: boolean;
}

/**
 * Supported DemoEmbed Variants
 */
export type DemoEmbedVariant = 'default';

/**
 * Section Component Props (Factory Pattern)
 */
export interface DemoEmbedSectionProps {
  /** Section configuration */
  config: DemoEmbedConfig;
  /** Variant to render (default: 'default') */
  variant?: DemoEmbedVariant;
  /** Additional CSS class names */
  className?: string;
  /** Enable analytics tracking */
  enableAnalytics?: boolean;
}
