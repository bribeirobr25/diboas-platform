'use client';

import { useEffect } from 'react';

/**
 * Error boundary for the investor-room route group (P7). The room is outside
 * `(landing)`, so it needs its own boundary; a render/gating failure stays
 * contained here and never falls through to a public surface.
 */
export default function InvestorRoomError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced to Sentry via the global onRequestError / instrumentation.
    console.error('[investor-room] render error', error);
  }, [error]);

  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-text-heading)' }}>
          Something went wrong
        </h1>
        <p style={{ color: 'var(--color-text-body)', margin: 'var(--spacing-sm) 0' }}>
          This page could not be loaded. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-on-dark)',
            backgroundColor: 'var(--color-brand-primary)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
