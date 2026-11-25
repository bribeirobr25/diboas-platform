'use client';

/**
 * Landing Route Group Error Boundary
 *
 * Thin wrapper around the shared RouteGroupError component.
 */

import { RouteGroupError } from '@/components/ErrorBoundary/RouteGroupError';
import { CookieSettingsButton } from '@/components/CookieConsent/CookieSettingsButton';
import styles from './error.module.css';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LandingError({ error, reset }: ErrorProps) {
  return (
    <>
      <RouteGroupError error={error} reset={reset} errorBoundaryName="landing-route-group" />
      <p className={styles.cookieSettings}>
        <CookieSettingsButton className={styles.cookieSettingsButton} />
      </p>
    </>
  );
}
