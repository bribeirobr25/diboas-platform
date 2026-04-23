/**
 * Client Instrumentation
 *
 * Next.js 16 convention: this file is auto-loaded on the client.
 * Replaces the legacy sentry.client.config.ts for Turbopack compatibility.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment and release tracking
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

    // Performance Monitoring
    // Capture 10% of transactions in production, 100% in development
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay (captures user interactions for debugging)
    // Capture 10% of sessions in production
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    // Capture 100% of sessions with errors
    replaysOnErrorSampleRate: 1.0,

    // Debug mode disabled to reduce log noise
    debug: false,

    // Filter out noisy errors
    beforeSend(event) {
      // Filter out hydration errors (common in Next.js, usually not actionable)
      if (event.message?.includes('Hydration')) {
        return null;
      }

      // Filter out browser extension errors
      if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
        frame => frame.filename?.includes('extension')
      )) {
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
            } else if (typeof event.extra[key] === 'string' && emailPattern.test(event.extra[key] as string)) {
              event.extra[key] = (event.extra[key] as string).replace(emailPattern, '[EMAIL_REDACTED]');
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
                } else if (typeof breadcrumb.data[key] === 'string' && emailPattern.test(breadcrumb.data[key] as string)) {
                  breadcrumb.data[key] = (breadcrumb.data[key] as string).replace(emailPattern, '[EMAIL_REDACTED]');
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

    // Integrations
    integrations: [
      Sentry.replayIntegration({
        // Mask all text content for privacy
        maskAllText: true,
        // Block all media (images, videos) for privacy
        blockAllMedia: true,
      }),
    ],
  });
}

/**
 * Captures client-side route transitions for Sentry performance monitoring.
 * Required by @sentry/nextjs v10+ for App Router navigation instrumentation.
 */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
