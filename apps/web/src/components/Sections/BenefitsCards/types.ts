/**
 * BenefitsCards Section Types
 *
 * Domain-Driven Design: Type definitions for benefits display domain
 * Service Agnostic Abstraction: Generic benefit card structure
 * Code Reusability: Shared types across all BenefitsCards variants
 */

/**
 * Individual Benefit Card Configuration
 */
export interface BenefitCard {
  /** Unique identifier for the benefit card */
  id: string;

  /** Icon asset path (e.g., '/assets/icons/money-flow.avif') */
  icon: string;

  /** Alt text for the icon (accessibility) */
  iconAlt: string;

  /** Benefit title */
  title: string;

  /** Benefit description */
  description: string;
}

/**
 * BenefitsCards Section Configuration
 */
export interface BenefitsCardsConfig {
  /** Section configuration */
  section: {
    /** Optional section title */
    title?: string;

    /** Optional section description */
    description?: string;

    /** Background color variant */
    backgroundColor?: 'light-purple' | 'white' | 'neutral';
  };

  /** Array of benefit cards (max 5 for default layout) */
  cards: BenefitCard[];

  /** SEO and analytics metadata */
  seo: {
    /** Section heading level (default: h2) */
    headingLevel?: 'h1' | 'h2' | 'h3';

    /** Section aria-label for screen readers */
    ariaLabel?: string;
  };

  /** Analytics configuration */
  analytics?: {
    /** Section tracking ID */
    sectionId: string;

    /** Category for analytics events */
    category?: string;
  };
}

/**
 * BenefitsCards Variant Props
 */
export interface BenefitsCardsVariantProps {
  /** Section configuration data */
  config: BenefitsCardsConfig;

  /** Optional additional CSS class */
  className?: string;

  /** Enable performance monitoring (default: true) */
  enableAnalytics?: boolean;

  /** Priority loading for above-the-fold content */
  priority?: boolean;
}

/**
 * Supported BenefitsCards variants
 */
export type BenefitsCardsVariant = 'default';
