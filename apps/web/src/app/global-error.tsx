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
            backgroundColor: '#0a0a0a',
            color: '#ffffff',
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
                color: '#ef4444',
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                color: '#a1a1aa',
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
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
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
                  color: '#a1a1aa',
                  border: '1px solid #3f3f46',
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
                  color: '#71717a',
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
