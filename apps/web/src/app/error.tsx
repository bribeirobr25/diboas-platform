'use client';

/**
 * Route Error Boundary
 *
 * This component handles errors at the route level.
 * It catches errors that occur during rendering of page components.
 *
 * Error Handling & System Recovery: Route-level error boundary
 * Monitoring & Observability: Sentry error reporting
 * User Experience: Graceful error UI with recovery options
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Report error to Sentry
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'route',
        digest: error.digest,
      },
      level: 'error',
    });
  }, [error]);

  return (
    <div
      style={{
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          maxWidth: '500px',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: 'var(--error-bg-light, #fef2f2)',
          border: '1px solid var(--error-border-light, #fecaca)',
          borderRadius: '0.75rem',
        }}
      >
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: 'var(--error-text-primary, #dc2626)',
          }}
        >
          Something went wrong
        </h2>
        <p
          style={{
            color: 'var(--error-text-secondary, #374151)',
            marginBottom: '1.5rem',
            lineHeight: '1.6',
          }}
        >
          We encountered an error loading this page. Please try again or return
          to the homepage.
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
              backgroundColor: 'var(--error-button-primary, #3b82f6)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
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
              color: 'var(--error-text-secondary, #374151)',
              border: '1px solid var(--error-border-light, #d1d5db)',
              borderRadius: '0.5rem',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
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
              marginTop: '1.5rem',
              fontSize: '0.75rem',
              color: 'var(--error-text-muted, #6b7280)',
            }}
          >
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
