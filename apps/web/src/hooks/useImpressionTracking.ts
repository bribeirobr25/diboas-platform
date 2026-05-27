/**
 * useImpressionTracking
 *
 * Fires an analytics event the first time the attached element becomes
 * visible in the viewport (default ≥50%). Idempotent within a single
 * mount: only fires once per hook instance, no matter how many times
 * the element scrolls in and out.
 *
 * Phase 3 L11 (audit/2026-05-08): closes the impression-coverage gap
 * flagged in the 2026-05-07 audit. Sections that wire this in get a
 * deterministic "section_impression" event for funnel analytics.
 *
 * SSR / Edge / no-IO-support safe: the effect bails out cleanly if
 * `window` or `IntersectionObserver` is unavailable.
 */

'use client';

import { useEffect, useRef } from 'react';
import { analyticsService } from '@/lib/analytics';

export interface UseImpressionTrackingOptions {
  /** Analytics event name. Convention: `<section>_impression`. */
  eventName: string;
  /** Extra parameters merged into the event payload. */
  parameters?: Record<string, unknown>;
  /**
   * Visibility ratio that counts as an impression. Default: 0.5.
   * Pass a smaller value (e.g. 0.25) for tall sections that may never
   * cross the 50% line on small viewports.
   */
  threshold?: number;
  /**
   * Set to false to disable tracking entirely (e.g. in Storybook).
   * Default: true.
   */
  enabled?: boolean;
}

/**
 * Returns a ref to attach to the element you want to track. Once the
 * element crosses the visibility threshold, the analytics event fires
 * once and the IntersectionObserver disconnects.
 */
export function useImpressionTracking<T extends HTMLElement>({
  eventName,
  parameters,
  threshold = 0.5,
  enabled = true,
}: UseImpressionTrackingOptions): React.RefObject<T> {
  const ref = useRef<T>(null);
  // Snapshot the parameters object on first render so changes to the
  // caller-passed object don't reset the firedRef. Impressions are
  // identity-stable: the event represents "the user saw this section",
  // not "the section's props changed".
  const paramsRef = useRef(parameters);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;
    if (typeof IntersectionObserver === 'undefined') return;

    const target = ref.current;
    if (!target) return;
    if (firedRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (firedRef.current) return;
          firedRef.current = true;

          analyticsService.track({
            name: eventName,
            parameters: {
              ...paramsRef.current,
              timestamp: Date.now(),
            },
          });

          observer.disconnect();
          return;
        }
      },
      { threshold }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [eventName, threshold, enabled]);

  return ref;
}
