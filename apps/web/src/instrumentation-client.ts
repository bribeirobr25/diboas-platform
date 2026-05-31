/**
 * Client Instrumentation
 *
 * Next.js 16 convention: this file is auto-loaded on the client.
 * Replaces the legacy sentry.client.config.ts for Turbopack compatibility.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 *
 * Consent-gating model (Lighthouse Remediation Plan Workstream B, 2026-05-22):
 *   - Error capture initialises unconditionally if SENTRY_DSN is set. Error
 *     events don't carry PII (scrubbed in beforeSend below). Lawful basis:
 *     GDPR Article 6(1)(f) legitimate interest (site reliability + security).
 *   - Session Replay is OFF by default (replaysSessionSampleRate: 0, no Replay
 *     integration at init). It is added via client.addIntegration() only after
 *     receiving a CONSENT_GIVEN event from applicationEventBus.
 *   - On CONSENT_WITHDRAWN, Sentry.getReplay()?.stop() halts active recording.
 *   - Subscribes to applicationEventBus (NOT the cookie-consent-changed DOM
 *     event). The DOM event is a pre-hydration fallback for the inline GA4
 *     bootstrap only — see consentUtils.ts -> dispatchConsentEvent docstring
 *     and the verified PostHogProvider precedent.
 */

import * as Sentry from '@sentry/nextjs';
import {
  applicationEventBus,
  ApplicationEventType,
  type ConsentEventPayload,
} from '@/lib/events/ApplicationEventBus';
import { hasAnalyticsConsent } from '@/components/CookieConsent/consentUtils';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment and release tracking
    environment: process.env.NODE_ENV,
    // Fallback aligned with apps/web/package.json#version. In production, the
    // @sentry/nextjs build plugin overrides this with the Vercel commit SHA
    // (when SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT are all set).
    release: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',

    // Performance Monitoring
    // Capture 10% of transactions in production, 100% in development
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay sample rates are 0 at init — Replay is added later only
    // after CONSENT_GIVEN. See enableReplay() below.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    // Debug mode disabled to reduce log noise
    debug: false,

    // Filter out noisy errors
    beforeSend(event) {
      // Filter out hydration errors (common in Next.js, usually not actionable)
      if (event.message?.includes('Hydration')) {
        return null;
      }

      // Filter out browser extension errors
      if (
        event.exception?.values?.[0]?.stacktrace?.frames?.some((frame) =>
          frame.filename?.includes('extension')
        )
      ) {
        return null;
      }

      // Privacy: Remove user PII in production
      if (process.env.NODE_ENV === 'production') {
        if (event.user) {
          delete event.user.email;
          delete event.user.username;
          delete event.user.ip_address;
        }

        // Scrub PII from event.extra
        if (event.extra) {
          const piiFields = ['email', 'name', 'username', 'ip_address', 'phone', 'address'];
          const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

          for (const key of Object.keys(event.extra)) {
            if (piiFields.includes(key.toLowerCase())) {
              event.extra[key] = '[REDACTED]';
            } else if (
              typeof event.extra[key] === 'string' &&
              emailPattern.test(event.extra[key] as string)
            ) {
              event.extra[key] = (event.extra[key] as string).replace(
                emailPattern,
                '[EMAIL_REDACTED]'
              );
            }
          }
        }

        // Scrub PII from breadcrumbs
        if (event.breadcrumbs) {
          const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
          const piiDataFields = ['email', 'name', 'username', 'ip_address', 'phone', 'address'];

          for (const breadcrumb of event.breadcrumbs) {
            if (breadcrumb.data) {
              for (const key of Object.keys(breadcrumb.data)) {
                if (piiDataFields.includes(key.toLowerCase())) {
                  breadcrumb.data[key] = '[REDACTED]';
                } else if (
                  typeof breadcrumb.data[key] === 'string' &&
                  emailPattern.test(breadcrumb.data[key] as string)
                ) {
                  breadcrumb.data[key] = (breadcrumb.data[key] as string).replace(
                    emailPattern,
                    '[EMAIL_REDACTED]'
                  );
                }
              }
            }
            if (breadcrumb.message && emailPattern.test(breadcrumb.message)) {
              breadcrumb.message = breadcrumb.message.replace(emailPattern, '[EMAIL_REDACTED]');
            }
          }
        }
      }

      return event;
    },

    // Integrations: empty at init. Replay added via addIntegration() after
    // CONSENT_GIVEN (see below). The error-capture path uses Sentry's built-in
    // default integrations automatically.
    integrations: [],
  });

  // Consent-driven Sentry Replay activation.
  //
  // Subscriptions live for the document lifetime — this module is not a React
  // component and there is no unmount. This is correct here; applicationEventBus
  // is a module singleton. The pattern mirrors the inline GA4 bootstrap's
  // un-removed listener documented in apps/web/src/app/layout.tsx (Phase 3 L12).
  if (typeof window !== 'undefined') {
    let replayActive = false;

    const enableReplay = () => {
      if (replayActive) return;
      const client = Sentry.getClient();
      if (!client) return;
      client.addIntegration(
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        })
      );
      replayActive = true;
    };

    const stopReplay = () => {
      if (!replayActive) return;
      const replay = Sentry.getReplay();
      if (replay && typeof replay.stop === 'function') {
        // Fire-and-forget — replay.stop() returns a Promise that flushes
        // the final segment. We don't await because the listener can be sync.
        void replay.stop();
      }
      replayActive = false;
    };

    // Honor existing consent on cold start (user accepted on a prior visit).
    // hasAnalyticsConsent() is SSR-safe (guarded by typeof window check) and
    // returns false if storage is unavailable.
    if (hasAnalyticsConsent()) {
      enableReplay();
    }

    // Subscribe to runtime consent events via ApplicationEventBus.
    // (NOT the cookie-consent-changed DOM event — that channel is for the
    // pre-hydration GA4 inline bootstrap only; React/module consumers use
    // the bus per consentUtils.ts docstring + PostHogProvider precedent.)
    applicationEventBus.on<ConsentEventPayload>(ApplicationEventType.CONSENT_GIVEN, (payload) => {
      // Accept 'analytics' or 'all'; explicitly reject 'marketing' alone.
      // Filter on type, not on current dispatchConsentEvent emit behaviour —
      // future marketing-consent feature must not silently activate Replay.
      if (payload.consentType === 'analytics' || payload.consentType === 'all') {
        enableReplay();
      }
    });

    applicationEventBus.on<ConsentEventPayload>(ApplicationEventType.CONSENT_WITHDRAWN, () => {
      stopReplay();
    });
  }
}

/**
 * Captures client-side route transitions for Sentry performance monitoring.
 * Required by @sentry/nextjs v10+ for App Router navigation instrumentation.
 */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
