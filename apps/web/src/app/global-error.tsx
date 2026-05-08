'use client';

/**
 * Global Error Boundary
 *
 * This component handles errors at the root level of the application.
 * It's a required file in Next.js App Router for handling errors that
 * occur in the root layout.
 *
 * Error Handling & System Recovery: Application-level error boundary
 * Monitoring & Observability: Sentry error reporting
 * User Experience: Graceful error UI with recovery options
 */

import { useEffect } from 'react';
import { errorReportingService } from '@/lib/errors/ErrorReportingService';

/**
 * Self-documented design tokens for the global error fallback.
 *
 * These values are duplicated inline (rather than read from
 * design-tokens.css) because global-error renders when the global
 * stylesheet may have failed to load. Source of truth:
 * apps/web/src/styles/design-tokens.css.
 *
 * Phase 1.8 (audit/L10, 2026-05-08): added the TOKENS map so future
 * readers know the hex values are not arbitrary — they mirror the
 * design system's neutral-950 / neutral-50 / semantic-error / etc.
 */
const TOKENS = {
  bgPrimary:    '#0a0a0a', // var(--color-neutral-950)
  textPrimary:  '#ffffff', // var(--color-white)
  textMuted:    '#a1a1aa', // var(--color-neutral-400)
  textFaint:    '#71717a', // var(--color-neutral-500)
  errorAccent:  '#ef4444', // var(--color-semantic-error)
  ctaBg:        '#3b82f6', // var(--color-semantic-info)
  borderMuted:  '#3f3f46', // var(--color-neutral-700)
} as const;

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    errorReportingService.captureException(error, {
      tags: {
        errorBoundary: 'global',
        digest: error.digest,
      },
      level: 'fatal',
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: TOKENS.bgPrimary,
            color: TOKENS.textPrimary,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '500px',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: TOKENS.errorAccent,
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                color: TOKENS.textMuted,
                marginBottom: '2rem',
                lineHeight: '1.6',
              }}
            >
              We apologize for the inconvenience. Our team has been notified and
              is working to fix the issue.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={reset}
                style={{
                  backgroundColor: TOKENS.ctaBg,
                  color: TOKENS.textPrimary,
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  backgroundColor: 'transparent',
                  color: TOKENS.textMuted,
                  border: `1px solid ${TOKENS.borderMuted}`,
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Go to homepage
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && error.digest && (
              <p
                style={{
                  marginTop: '2rem',
                  fontSize: '0.75rem',
                  color: TOKENS.textFaint,
                }}
              >
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
