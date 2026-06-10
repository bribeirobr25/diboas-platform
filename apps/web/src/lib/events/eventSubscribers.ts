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
          const { alertingService, AlertSeverity } =
            await import('@/lib/monitoring/AlertingService');
          const errorObj =
            payload.error instanceof Error ? payload.error : new Error(String(payload.error));
          const severity =
            payload.severity === 'critical' ? AlertSeverity.CRITICAL : AlertSeverity.ERROR;
          await alertingService.sendErrorAlert(errorObj, severity, payload.context);
        } catch {
          // Alerting is non-critical — silently degrade
        }
      }
    }
  );

  // 3. CONSENT_GIVEN → log consent event
  applicationEventBus.on<ConsentEventPayload>(ApplicationEventType.CONSENT_GIVEN, (payload) => {
    Logger.info('Consent given', {
      consentType: payload.consentType,
      newState: payload.newState,
      source: payload.source,
    });
    // PostHog + PerformanceMonitor init are already handled by MonitoringInit.tsx
  });

  // 4. SHARE_COMPLETED → track share_completed
  applicationEventBus.on(ApplicationEventType.SHARE_COMPLETED, (data) => {
    import('@/lib/analytics/service')
      .then((mod) =>
        mod.analyticsService.track({ name: 'share_completed', parameters: data.metadata })
      )
      .catch(() => Logger.warn('Failed to load analytics for share_completed subscriber'));
  });

  // 5. PRE_DEMO_STARTED → track pre_demo_started
  applicationEventBus.on(ApplicationEventType.PRE_DEMO_STARTED, (data) => {
    import('@/lib/analytics/service')
      .then((mod) =>
        mod.analyticsService.track({ name: 'pre_demo_started', parameters: data.metadata })
      )
      .catch(() => Logger.warn('Failed to load analytics for pre_demo_started subscriber'));
  });

  // 6. PRE_DREAM_STARTED → track pre_dream_started
  applicationEventBus.on(ApplicationEventType.PRE_DREAM_STARTED, (data) => {
    import('@/lib/analytics/service')
      .then((mod) =>
        mod.analyticsService.track({ name: 'pre_dream_started', parameters: data.metadata })
      )
      .catch(() => Logger.warn('Failed to load analytics for pre_dream_started subscriber'));
  });

  // ── A16 / O-3: bridge the remaining client-emitted funnel events to analytics ──
  // Scope note: these subscribers run CLIENT-side (registered from the 'use client'
  // MonitoringInit). `analyticsService` is itself client-only (gtag/posthog), and
  // `applicationEventBus` is a per-runtime singleton, so ONLY client-emitted events
  // can be bridged here. The rich server-side WAITLIST_SIGNUP_COMPLETED (in
  // WaitlistApplicationService) and the server-side WAITLIST_REFERRAL_USED (referral
  // store) fire on the server bus and never reach this listener — `referral_used` is
  // therefore derived below from the client signup completion. SHARE_INITIATED has no
  // emitter (only PRE_DREAM_SHARE_INITIATED fires), so it is intentionally not bridged.
  // All events flow through `track()`, which is consent-gated and locale-enriched.

  // 7. WAITLIST_SIGNUP_COMPLETED → waitlist_signup_completed (+ derived referral_used)
  applicationEventBus.on(ApplicationEventType.WAITLIST_SIGNUP_COMPLETED, (data) => {
    const meta = (data.metadata ?? {}) as { position?: number; hasReferral?: boolean };
    const hasReferral = !!meta.hasReferral;
    import('@/lib/analytics/service')
      .then((mod) => {
        mod.analyticsService.track({
          name: 'waitlist_signup_completed',
          parameters: { has_referral: hasReferral, position: meta.position },
        });
        // A referral is "used" exactly when a referred user completes signup.
        if (hasReferral) {
          mod.analyticsService.track({ name: 'referral_used', parameters: {} });
        }
      })
      .catch(() =>
        Logger.warn('Failed to load analytics for waitlist_signup_completed subscriber')
      );
  });

  // 8. PRE_DEMO_DEPOSIT_COMPLETED → pre_demo_deposit_completed
  applicationEventBus.on(ApplicationEventType.PRE_DEMO_DEPOSIT_COMPLETED, (data) => {
    const meta = (data.metadata ?? {}) as { amount?: number };
    import('@/lib/analytics/service')
      .then((mod) =>
        mod.analyticsService.track({
          name: 'pre_demo_deposit_completed',
          parameters: { amount: meta.amount },
        })
      )
      .catch(() =>
        Logger.warn('Failed to load analytics for pre_demo_deposit_completed subscriber')
      );
  });

  // 9. PRE_DEMO_SEND_COMPLETED → pre_demo_send_completed
  //    (deliberately drops the `recipient` field — user-entered, potential PII).
  applicationEventBus.on(ApplicationEventType.PRE_DEMO_SEND_COMPLETED, (data) => {
    const meta = (data.metadata ?? {}) as { amount?: number };
    import('@/lib/analytics/service')
      .then((mod) =>
        mod.analyticsService.track({
          name: 'pre_demo_send_completed',
          parameters: { amount: meta.amount },
        })
      )
      .catch(() => Logger.warn('Failed to load analytics for pre_demo_send_completed subscriber'));
  });

  // 10. PRE_DEMO_BUY_COMPLETED → pre_demo_buy_completed
  applicationEventBus.on(ApplicationEventType.PRE_DEMO_BUY_COMPLETED, (data) => {
    const meta = (data.metadata ?? {}) as { amount?: number; asset?: string };
    import('@/lib/analytics/service')
      .then((mod) =>
        mod.analyticsService.track({
          name: 'pre_demo_buy_completed',
          parameters: { amount: meta.amount, asset: meta.asset },
        })
      )
      .catch(() => Logger.warn('Failed to load analytics for pre_demo_buy_completed subscriber'));
  });

  // 11. PRE_DREAM_SHARE_INITIATED → pre_dream_share_initiated
  applicationEventBus.on(ApplicationEventType.PRE_DREAM_SHARE_INITIATED, (data) => {
    const meta = (data.metadata ?? {}) as { platform?: string };
    import('@/lib/analytics/service')
      .then((mod) =>
        mod.analyticsService.track({
          name: 'pre_dream_share_initiated',
          parameters: { platform: meta.platform },
        })
      )
      .catch(() =>
        Logger.warn('Failed to load analytics for pre_dream_share_initiated subscriber')
      );
  });
}
