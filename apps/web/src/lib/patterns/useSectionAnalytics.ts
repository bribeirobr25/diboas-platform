/**
 * Section Analytics Hook
 *
 * Analytics integration for section components
 */

import { useRef, useCallback } from 'react';
import { Logger } from '@/lib/monitoring/Logger';
import type { SectionAnalyticsService, SectionAnalyticsConfig } from './SectionPattern';
import { getSessionId } from './hookUtils';

/**
 * Hook for section analytics integration
 */
export function useSectionAnalytics(
  analyticsService: SectionAnalyticsService,
  config: SectionAnalyticsConfig,
  enabled: boolean = true
) {
  const lastTrackTime = useRef<Map<string, number>>(new Map());

  /**
   * Track an analytics event with throttling
   */
  const trackEvent = useCallback(async (
    eventType: keyof SectionAnalyticsConfig['events'] | string,
    properties: Record<string, unknown> = {},
    throttleMs: number = 100
  ) => {
    if (!enabled || !config.enabled) return;

    const eventName = typeof eventType === 'string' && eventType in config.events
      ? config.events[eventType as keyof SectionAnalyticsConfig['events']]
      : eventType;

    const fullEventName = `${config.trackingPrefix}_${eventName}`;

    // Throttle rapid events
    const now = Date.now();
    const lastTrack = lastTrackTime.current.get(fullEventName) || 0;

    if (now - lastTrack < throttleMs) {
      Logger.debug(`Analytics event throttled: ${fullEventName}`);
      return;
    }

    lastTrackTime.current.set(fullEventName, now);

    try {
      const enrichedProperties = {
        ...properties,
        timestamp: new Date().toISOString(),
        section: config.trackingPrefix,
        sessionId: getSessionId(),
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };

      await analyticsService.trackEvent(fullEventName, enrichedProperties);

      Logger.debug(`Analytics event tracked: ${fullEventName}`, enrichedProperties);

    } catch (error) {
      Logger.warn(`Failed to track analytics event: ${fullEventName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        properties
      });
    }
  }, [enabled, config, analyticsService]);

  /**
   * Track section view event
   */
  const trackSectionView = useCallback(async (
    sectionId: string,
    additionalProperties: Record<string, unknown> = {}
  ) => {
    try {
      await analyticsService.trackSectionView(sectionId, {
        ...additionalProperties,
        trackingPrefix: config.trackingPrefix
      });

      Logger.debug(`Section view tracked: ${sectionId}`);

    } catch (error) {
      Logger.warn(`Failed to track section view: ${sectionId}`, { error });
    }
  }, [analyticsService, config.trackingPrefix]);

  /**
   * Track interaction event with context
   */
  const trackInteraction = useCallback(async (
    interactionType: string,
    target: string,
    properties: Record<string, unknown> = {}
  ) => {
    await trackEvent('interaction', {
      interactionType,
      target,
      ...properties
    });
  }, [trackEvent]);

  /**
   * Track CTA click with attribution
   */
  const trackCTAClick = useCallback(async (
    ctaId: string,
    ctaText: string,
    ctaHref: string,
    properties: Record<string, unknown> = {}
  ) => {
    await trackEvent('cta_click', {
      ctaId,
      ctaText,
      ctaHref,
      ...properties
    });
  }, [trackEvent]);

  /**
   * Track navigation event
   */
  const trackNavigation = useCallback(async (
    fromIndex: number,
    toIndex: number,
    method: 'manual' | 'auto' | 'keyboard' | 'touch',
    properties: Record<string, unknown> = {}
  ) => {
    await trackEvent('navigation', {
      fromIndex,
      toIndex,
      method,
      ...properties
    });
  }, [trackEvent]);

  /**
   * Track error event
   */
  const trackError = useCallback(async (
    errorType: string,
    errorMessage: string,
    context: string,
    properties: Record<string, unknown> = {}
  ) => {
    await trackEvent('error', {
      errorType,
      errorMessage,
      context,
      ...properties
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackSectionView,
    trackInteraction,
    trackCTAClick,
    trackNavigation,
    trackError,
    getHealthStatus: () => analyticsService.getHealthStatus()
  };
}
