/**
 * TreasuryCalculator Section Types
 *
 * Domain-Driven Design: Type definitions for treasury calculator domain
 * Service Agnostic Abstraction: Generic calculator structure for B2B treasury
 */

/**
 * Calculator Configuration
 */
export interface TreasuryCalculatorConfig {
  /** Content configuration */
  content: {
    /** Section header text (translation key) */
    header: string;
    /** CTA button text (translation key) */
    cta: string;
    /** CTA href */
    ctaHref: string;
  };

  /** Default values for calculator inputs */
  defaults: {
    /** Default cash on hand value */
    cashOnHand: number;
    /** Default current interest rate (percentage) */
    currentRate: number;
    /** diBoaS projected rate (percentage) */
    diboasRate: number;
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
 * TreasuryCalculator Component Props
 */
export interface TreasuryCalculatorProps {
  /** Calculator configuration */
  config: TreasuryCalculatorConfig;

  /** Optional additional CSS class */
  className?: string;

  /** Enable analytics tracking (default: true) */
  enableAnalytics?: boolean;
}
