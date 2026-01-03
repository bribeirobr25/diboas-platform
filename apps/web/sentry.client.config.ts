/**
 * Sentry Client Configuration
 *
 * This file configures the initialization of Sentry on the client.
 * The config you add here will be used whenever a user loads a page in the browser.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment and release tracking
    environment: process.env.NODE_ENV,

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
      if (process.env.NODE_ENV === 'production' && event.user) {
        delete event.user.email;
        delete event.user.username;
        delete event.user.ip_address;
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
