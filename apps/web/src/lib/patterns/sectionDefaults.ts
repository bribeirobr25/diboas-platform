/**
 * Section Default Configurations
 *
 * Default values for section configurations
 */

import type { SectionPerformanceConfig, SectionErrorConfig } from './sectionPerformanceTypes';
import type { SectionAccessibilityConfig, SectionBreakpoints } from './sectionAccessibilityTypes';

/**
 * Default performance configuration
 */
export const DEFAULT_PERFORMANCE_CONFIG: Required<SectionPerformanceConfig> = {
  enableLazyLoading: true,
  preloadCount: 2,
  loadingTimeout: 2000,
  navigationThrottleMs: 150,
  enableImageOptimization: true,
  criticalContent: []
};

/**
 * Default accessibility configuration (WCAG 2.1 AA compliant)
 */
export const DEFAULT_ACCESSIBILITY_CONFIG: Required<SectionAccessibilityConfig> = {
  enableKeyboard: true,
  enableTouch: true,
  announceChanges: true,
  keyboardInstructions: 'Use arrow keys to navigate',
  focusManagement: {
    trapFocus: false,
    returnFocus: true,
    skipLinks: true
  },
  respectReducedMotion: true
};

/**
 * Standard responsive breakpoints
 */
export const STANDARD_BREAKPOINTS: SectionBreakpoints = {
  smallMobile: 320,
  mobile: 480,
  largeMobile: 600,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440
};

/**
 * Default section error configuration
 */
export const DEFAULT_ERROR_CONFIG: Required<SectionErrorConfig> = {
  enableErrorBoundary: true,
  retry: {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2
  },
  fallbackContent: {
    title: 'Content temporarily unavailable',
    message: 'Please try refreshing the page or check back later.',
    action: {
      text: 'Refresh page',
      onClick: () => window.location.reload()
    }
  },
  logToAnalytics: true
};
