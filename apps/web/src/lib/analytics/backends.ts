/**
 * Analytics Backend Abstraction (Task 59)
 *
 * Service Agnostic Abstraction: IAnalyticsBackend interface
 * with GA4 and PostHog implementations. Allows swapping or
 * adding analytics providers without touching the core service.
 */

import type { AnalyticsEvent } from './types';

/**
 * Interface for analytics backends.
 * Each backend knows how to send events to a specific provider.
 */
export interface IAnalyticsBackend {
  /** Human-readable name for logging/debugging */
  readonly name: string;

  /** Send a batch of events to the provider */
  sendEvents(events: AnalyticsEvent[]): Promise<void>;

  /** Whether this backend is currently available (loaded, consented, etc.) */
  isAvailable(): boolean;
}

// ─── GA4 Backend ────────────────────────────────────────────────────────────

type GtagFn = (command: string, action: string, params?: Record<string, unknown>) => void;

/**
 * GA4 backend — wraps window.gtag calls.
 * Available only when gtag is loaded on the page.
 */
export class GA4Backend implements IAnalyticsBackend {
  readonly name = 'GA4';

  sendEvents(events: AnalyticsEvent[]): Promise<void> {
    const gtag = this.getGtag();
    if (!gtag) return Promise.resolve();

    for (const event of events) {
      gtag('event', event.name, event.parameters);
    }
    return Promise.resolve();
  }

  isAvailable(): boolean {
    return this.getGtag() !== undefined;
  }

  private getGtag(): GtagFn | undefined {
    if (typeof window === 'undefined') return undefined;
    return (window as Window & { gtag?: GtagFn }).gtag;
  }
}

// ─── PostHog Backend ────────────────────────────────────────────────────────

/**
 * PostHog backend — lazy-loads posthog-js behind consent.
 * Available only when PostHog has been initialised (__loaded === true).
 */
export class PostHogBackend implements IAnalyticsBackend {
  readonly name = 'PostHog';

  async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    try {
      const posthog = (await import('posthog-js')).default;
      if (!posthog.__loaded) return;

      for (const event of events) {
        posthog.capture(event.name, event.parameters);
      }
    } catch {
      // PostHog not available or not consented — silently skip
    }
  }

  isAvailable(): boolean {
    // Cannot check synchronously because posthog-js is lazy-loaded.
    // Return true so the service attempts to send; sendEvents handles
    // the case where PostHog is not actually loaded.
    if (typeof window === 'undefined') return false;
    return true;
  }
}
