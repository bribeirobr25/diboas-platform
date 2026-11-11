/**
 * Sentry Server Configuration
 *
 * This file configures the initialization of Sentry on the server.
 * The config you add here will be used whenever the server handles a request.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';
import { scrubSentryEvent } from './src/lib/monitoring/sentryScrub';

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
    // Capture 10% of transactions in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Debug mode disabled to reduce log noise
    debug: false,

    // Filter out noisy errors; scrub personal data and URL tokens (5.862).
    beforeSend(event) {
      // Filter out expected errors
      if (event.message?.includes('NEXT_NOT_FOUND')) {
        return null;
      }

      return scrubSentryEvent(event);
    },
    beforeSendTransaction: (event) => scrubSentryEvent(event),

    // Request bodies are never captured (fourteenth audit): the SDK attached them to errors and
    // to sampled transactions by default, and the deletion and unsubscribe bodies carry bearer
    // tokens. The scrubber drops `request.data` too, in case another path sets it.
    integrations: [Sentry.httpIntegration({ maxIncomingRequestBodySize: 'none' })],
  });
}
