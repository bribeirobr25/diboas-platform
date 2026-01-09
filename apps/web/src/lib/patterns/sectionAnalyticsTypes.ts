/**
 * Section Analytics Type Definitions
 *
 * Analytics patterns and service interfaces
 */

/**
 * Standard analytics configuration for sections
 */
export interface SectionAnalyticsConfig {
  /** Enable/disable analytics tracking */
  enabled: boolean;

  /** Prefix for all analytics events from this section */
  trackingPrefix: string;

  /** Standard event names for consistent tracking */
  events: {
    /** User interaction events (clicks, taps) */
    interaction: string;

    /** Navigation events (slide changes, page changes) */
    navigation: string;

    /** CTA click events */
    cta_click: string;

    /** Section view events */
    section_view: string;

    /** Error events */
    error: string;
  };

  /** Additional custom events specific to section */
  customEvents?: Record<string, string>;
}

/**
 * Analytics service interface abstraction
 */
export interface SectionAnalyticsService {
  /**
   * Track an analytics event
   */
  trackEvent(
    eventName: string,
    properties: Record<string, unknown>
  ): Promise<void>;

  /**
   * Track a section view event
   */
  trackSectionView(
    sectionId: string,
    properties: Record<string, unknown>
  ): Promise<void>;

  /**
   * Get service health status
   */
  getHealthStatus(): {
    isHealthy: boolean;
    failedEventsCount: number;
    isOnline: boolean;
  };
}
