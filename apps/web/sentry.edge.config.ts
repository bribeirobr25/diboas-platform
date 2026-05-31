/**
 * Sentry Edge Configuration
 *
 * This file configures the initialization of Sentry for edge features (Middleware, Edge Routes).
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment and release tracking
    environment: process.env.NODE_ENV,
    // Fallback aligned with apps/web/package.json#version. In production, the
    // @sentry/nextjs build plugin overrides this with the Vercel commit SHA.
    release: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',

    // Performance Monitoring
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
