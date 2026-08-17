'use client';

import { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from '@/components/Button';
import { LucideIcon } from '@/components/LucideIcon';
import styles from './boundary.module.css';

/**
 * Page-level error boundary for the gated app group (Principle 7 / R-10): a
 * thrown render/data error in any (app) screen recovers here inside the chrome
 * instead of blanking the app. `reset()` re-renders the segment. Structured
 * error reporting (Sentry) is the deferred Principle-12 seam.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className={styles.wrap} role="alert" aria-labelledby="app-error-title">
      <span className={styles.icon}>
        <LucideIcon name="info" size={26} />
      </span>
      <h1 id="app-error-title" className={styles.title}>
        <FormattedMessage id="error.title" />
      </h1>
      <p className={styles.body}>
        <FormattedMessage id="error.body" />
      </p>
      <Button variant="primary" onClick={reset}>
        <FormattedMessage id="error.retry" />
      </Button>
    </section>
  );
}
