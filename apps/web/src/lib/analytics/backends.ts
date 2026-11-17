/**
 * Analytics Backend Abstraction (Task 59)
 *
 * Service Agnostic Abstraction: IAnalyticsBackend interface
 * with GA4 and PostHog implementations. Allows swapping or
 * adding analytics providers without touching the core service.
 */

import type { AnalyticsEvent } from './types';

/** How a batch is sent. `unloading`: the page is being hidden or closed, so the batch must be
 *  handed over now, with a transport that survives the page going away. */
export interface SendOptions {
  unloading?: boolean;
}

/**
 * Interface for analytics backends.
 * Each backend knows how to send events to a specific provider.
 */
export interface IAnalyticsBackend {
  /** Human-readable name for logging/debugging */
  readonly name: string;

  /** Send a batch of events to the provider */
  sendEvents(events: AnalyticsEvent[], options?: SendOptions): Promise<void>;

  /** Whether this backend is currently available (loaded, consented, etc.) */
  isAvailable(): boolean;

  /** Get ready to send synchronously later (called only once consent exists). Optional. */
  warm?(): void;
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

type PostHogClient = (typeof import('posthog-js'))['default'];

/**
 * PostHog backend — lazy-loads posthog-js behind consent.
 * Available only when PostHog has been initialised (__loaded === true).
 *
 * The service calls `warm()` on every consented `track()`, so by the time a page is hidden the
 * loaded client is usually cached and the hand-off is synchronous (the first send otherwise
 * waits for `import()`; the 2026-11-12 audit found a reader who leaves within the first batch
 * window always took that path). An unloading send asks for `{ transport: 'sendBeacon',
 * send_instantly: true }`: delivered at once, skipping PostHog's own queue. Every capture
 * carries the event's own timestamp (PostHog would otherwise stamp the send time) and still
 * passes PostHog's `before_send` scrubbers.
 */
export class PostHogBackend implements IAnalyticsBackend {
  readonly name = 'PostHog';
  private client: PostHogClient | null = null;
  private loading: Promise<void> | null = null;

  warm(): void {
    if (this.client || this.loading) return;
    this.loading = import('posthog-js')
      .then(({ default: posthog }) => {
        if (posthog.__loaded) this.client = posthog;
      })
      .catch(() => {})
      .finally(() => {
        this.loading = null;
      });
  }

  sendEvents(events: AnalyticsEvent[], options: SendOptions = {}): Promise<void> {
    if (this.client) {
      this.capture(this.client, events, options);
      return Promise.resolve();
    }
    return this.loadAndSend(events, options);
  }

  private async loadAndSend(events: AnalyticsEvent[], options: SendOptions): Promise<void> {
    try {
      const posthog = (await import('posthog-js')).default;
      if (!posthog.__loaded) return;
      this.client = posthog;
      this.capture(posthog, events, options);
    } catch {
      // PostHog not available or not consented — silently skip
    }
  }

  private capture(posthog: PostHogClient, events: AnalyticsEvent[], options: SendOptions): void {
    for (const event of events) {
      posthog.capture(event.name, event.parameters, {
        ...(event.timestamp ? { timestamp: new Date(event.timestamp) } : {}),
        ...(options.unloading ? ({ transport: 'sendBeacon', send_instantly: true } as const) : {}),
      });
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
