'use client';

/**
 * MonitoringInit — Initializes monitoring services in root layout.
 *
 * - PerformanceMonitor: consent-gated (only starts after analytics consent)
 * - MonitoringService: always active (internal error/security tracking, no PII)
 * - MonitoringAlertService: always active (server-side alerting infrastructure)
 *
 * Listens for consent changes to start/stop PerformanceMonitor dynamically.
 */

import { useEffect, useRef } from 'react';
import { hasAnalyticsConsent } from '@/components/CookieConsent';
import { registerEventSubscribers } from '@/lib/events/eventSubscribers';
import { Logger } from '@/lib/monitoring/Logger';
import {
  applicationEventBus,
  ApplicationEventType,
  type ConsentEventPayload,
} from '@/lib/events/ApplicationEventBus';

export function MonitoringInit() {
  const initializedRef = useRef(false);
  const perfMonitorRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Phase 2 L1 (audit/2026-05-08): hydrate the client Logger with the
    // x-request-id from the server's <meta> tag so all subsequent
    // Logger entries can be correlated to the originating server request.
    Logger.initFromMeta();

    // Event subscribers: wire up cross-cutting event listeners
    registerEventSubscribers();

    // MonitoringService: unconditional — tracks errors and security events internally
    import('@/lib/monitoring/service').catch(() => {});

    // MonitoringAlertService: unconditional — wires alert delivery infrastructure
    import('@/lib/monitoring/AlertingService').catch(() => {});

    // PerformanceMonitor: consent-gated
    const initPerfMonitor = async () => {
      if (!hasAnalyticsConsent()) return;
      try {
        const { performanceMonitor } = await import('@/lib/monitoring/performance-monitor');
        perfMonitorRef.current = performanceMonitor;
      } catch {
        // Silently fail — monitoring is non-critical
      }
    };

    initPerfMonitor();

    // Listen for consent changes via ApplicationEventBus
    const unsubGiven = applicationEventBus.on<ConsentEventPayload>(
      ApplicationEventType.CONSENT_GIVEN,
      (payload) => {
        if (payload.consentType === 'analytics' || payload.consentType === 'all') {
          initPerfMonitor();
        }
      }
    );

    const unsubWithdrawn = applicationEventBus.on<ConsentEventPayload>(
      ApplicationEventType.CONSENT_WITHDRAWN,
      () => {
        if (perfMonitorRef.current) {
          perfMonitorRef.current.destroy();
          perfMonitorRef.current = null;
        }
      }
    );

    return () => {
      unsubGiven();
      unsubWithdrawn();
    };
  }, []);

  return null;
}
