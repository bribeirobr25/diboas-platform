/**
 * Core Section Type Definitions
 *
 * Base interfaces for all section components
 */

/**
 * Base props interface for all section components
 */
export interface BaseSectionProps<TVariant extends string = string> {
  /**
   * Section variant configuration - determines layout and behavior
   */
  variant?: TVariant;

  /**
   * Custom section configuration - overrides default config
   */
  config?: Partial<BaseSectionConfig<TVariant, unknown, unknown, unknown>>;

  /**
   * Custom CSS classes for styling extensions
   */
  className?: string;

  /**
   * Enable analytics tracking for user interactions
   */
  enableAnalytics?: boolean;

  /**
   * Performance optimization: Priority loading for above-fold content
   */
  priority?: boolean;
}

/**
 * Base configuration interface for all section variants
 */
export interface BaseSectionConfig<
  TVariant extends string,
  TContent = unknown,
  TSettings = unknown,
  TAnalytics = unknown
> {
  /** Section variant identifier */
  variant: TVariant;

  /** Section content configuration */
  content: TContent;

  /** Section behavior settings */
  settings: TSettings;

  /** Analytics configuration (optional) */
  analytics?: TAnalytics;

  /** SEO optimization settings */
  seo: SectionSEOConfig;
}

/**
 * SEO configuration for sections
 */
export interface SectionSEOConfig {
  /** ARIA label for accessibility */
  ariaLabel: string;

  /** Structured data for search engines */
  structuredData?: Record<string, unknown>;

  /** Meta description for section content */
  description?: string;

  /** Keywords relevant to section content */
  keywords?: string[];
}

/**
 * Extract variant type from configuration record
 */
export type ExtractVariant<T> = T extends Record<infer K, unknown> ? K : never;

/**
 * Extract configuration type from configuration record
 */
export type ExtractConfig<T> = T extends Record<string, infer V> ? V : never;

/**
 * Make certain properties required in a configuration
 */
export type RequireConfig<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Section component factory type
 */
export type SectionComponentFactory<
  TVariant extends string,
  TConfig extends BaseSectionConfig<TVariant, unknown, unknown, unknown>
> = (props: BaseSectionProps<TVariant>) => JSX.Element;
