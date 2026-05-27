'use client';

/**
 * Landing Route Group Error Boundary
 *
 * Thin wrapper around the shared RouteGroupError component.
 */

import { RouteGroupError } from '@/components/ErrorBoundary/RouteGroupError';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LandingError({ error, reset }: ErrorProps) {
  return <RouteGroupError error={error} reset={reset} errorBoundaryName="landing-route-group" />;
}
