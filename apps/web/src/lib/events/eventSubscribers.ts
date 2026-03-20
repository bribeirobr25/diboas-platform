/**
 * Event Subscribers
 *
 * Event-Driven Architecture: Registers cross-cutting event listeners.
 * Called once from MonitoringInit to wire up:
 *   1. WAITLIST_SIGNUP_COMPLETED → invalidate stats cache
 *   2. APPLICATION_ERROR (high/critical) → trigger alerting
 *   3. CONSENT_GIVEN → log consent event
 */

import { applicationEventBus, ApplicationEventType } from './ApplicationEventBus';
import type { ApplicationErrorEventPayload, ConsentEventPayload } from './applicationEventTypes';
import { Logger } from '@/lib/monitoring/Logger';

let registered = false;

/**
 * Register all application event subscribers.
 * Idempotent — safe to call multiple times (only registers once).
 */
export function registerEventSubscribers(): void {
  if (registered) return;
  registered = true;

  // 1. WAITLIST_SIGNUP_COMPLETED → invalidate stats cache
  applicationEventBus.on(ApplicationEventType.WAITLIST_SIGNUP_COMPLETED, (payload) => {
    Logger.info('Waitlist signup completed — invalidating stats cache', {
      submissionId: (payload as { submissionId?: string }).submissionId,
      source: payload.source,
    });
    // POST-LAUNCH: Replace with actual cache invalidation when stats cache exists
  });

  // 2. APPLICATION_ERROR → trigger alerting for high/critical severity
  applicationEventBus.on<ApplicationErrorEventPayload>(
    ApplicationEventType.APPLICATION_ERROR,
    async (payload) => {
      if (payload.severity === 'high' || payload.severity === 'critical') {
        try {
          const { alertingService, AlertSeverity } = await import(
            '@/lib/monitoring/AlertingService'
          );
          const errorObj =
            payload.error instanceof Error
              ? payload.error
              : new Error(String(payload.error));
          const severity =
            payload.severity === 'critical'
              ? AlertSeverity.CRITICAL
              : AlertSeverity.ERROR;
          await alertingService.sendErrorAlert(errorObj, severity, payload.context);
        } catch {
          // Alerting is non-critical — silently degrade
        }
      }
    },
  );

  // 3. CONSENT_GIVEN → log consent event
  applicationEventBus.on<ConsentEventPayload>(
    ApplicationEventType.CONSENT_GIVEN,
    (payload) => {
      Logger.info('Consent given', {
        consentType: payload.consentType,
        newState: payload.newState,
        source: payload.source,
      });
      // PostHog + PerformanceMonitor init are already handled by MonitoringInit.tsx
    },
  );
}
