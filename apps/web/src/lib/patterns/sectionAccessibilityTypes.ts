/**
 * Section Accessibility Type Definitions
 *
 * Accessibility and responsive design patterns
 */

/**
 * Accessibility configuration for sections
 */
export interface SectionAccessibilityConfig {
  /** Enable keyboard navigation */
  enableKeyboard?: boolean;

  /** Enable touch/swipe navigation */
  enableTouch?: boolean;

  /** Announce changes to screen readers */
  announceChanges?: boolean;

  /** Custom keyboard instructions */
  keyboardInstructions?: string;

  /** Focus management configuration */
  focusManagement?: {
    trapFocus?: boolean;
    returnFocus?: boolean;
    skipLinks?: boolean;
  };

  /** Reduced motion preferences */
  respectReducedMotion?: boolean;
}

/**
 * Responsive breakpoint configuration
 */
export interface SectionBreakpoints {
  /** Small mobile devices */
  smallMobile: number;  // 320px

  /** Medium mobile devices */
  mobile: number;       // 480px

  /** Large mobile devices */
  largeMobile: number;  // 600px

  /** Tablet devices */
  tablet: number;       // 768px

  /** Small desktop */
  desktop: number;      // 1024px

  /** Large desktop */
  largeDesktop: number; // 1440px
}

/**
 * Responsive configuration for sections
 */
export interface SectionResponsiveConfig {
  /** Breakpoint configuration */
  breakpoints: SectionBreakpoints;

  /** Mobile-specific settings */
  mobile?: {
    simplifiedNavigation?: boolean;
    reducedAnimations?: boolean;
    optimizedImages?: boolean;
  };

  /** Tablet-specific settings */
  tablet?: {
    hybridInteractions?: boolean;
    enhancedTouch?: boolean;
  };

  /** Desktop-specific settings */
  desktop?: {
    keyboardShortcuts?: boolean;
    hoverEffects?: boolean;
    advancedFeatures?: boolean;
  };
}
