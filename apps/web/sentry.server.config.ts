/**
 * Sentry Server Configuration
 *
 * This file configures the initialization of Sentry on the server.
 * The config you add here will be used whenever the server handles a request.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment tracking
    environment: process.env.NODE_ENV,

    // Performance Monitoring
    // Capture 10% of transactions in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Debug mode disabled to reduce log noise
    debug: false,

    // Filter out noisy errors
    beforeSend(event) {
      // Filter out expected errors
      if (event.message?.includes('NEXT_NOT_FOUND')) {
        return null;
      }

      return event;
    },
  });
}
