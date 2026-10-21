'use client';

import { useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from '@/components/Button';
import { reportError } from '@/lib/monitoring/reportError';
import styles from './boundary.module.css';

/**
 * Page-level error boundary for the gated app group (Principle 7 / R-10): a
 * thrown render/data error in any (app) screen recovers here inside the chrome
 * instead of blanking the app. `reset()` re-renders the segment. Structured
 * `5.206`: it now reports through the single `reportError` sink instead of a
 * bare `console.error`, so a crash on this LIVE public app leaves a structured
 * record. The EXTERNAL sink stays deferred behind the CLO question `Logger.ts`
 * raises — see `reportError.ts`.
 */
export default function AppError({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  /** Next ≥ 16.3: re-FETCHES and re-renders. `reset` only re-renders the same
      children, so after a server-render error it usually fails again. */
  retry?: () => void;
}) {
  /**
   * ⛑ R-4 · ONE-SHOT EFFECT, GUARDED BY A REF — NOT BY LUCK.
   *
   * `next.config.mjs` sets `reactStrictMode: true`, so in development React
   * runs this effect, tears it down, and runs it AGAIN. Without the ref every
   * crash was reported TWICE, and a sink that duplicates is a sink you stop
   * trusting — "did it happen twice, or is the reporter broken?" is exactly the
   * question an error record exists to answer.
   *
   * Keyed on the error IDENTITY, so a genuinely NEW error still reports. The
   * repository already carries this pattern for the same reason
   * (`useSettleToNow`'s module-level lock).
   */
  const reported = useRef<unknown>(null);
  useEffect(() => {
    if (reported.current === error) return;
    reported.current = error;
    reportError('app', error);
  }, [error]);

  return (
    <section className={styles.wrap} role="alert" aria-labelledby="app-error-title">
      <h1 id="app-error-title" className={styles.title}>
        <FormattedMessage id="error.title" />
      </h1>
      <p className={styles.body}>
        <FormattedMessage id="error.body" />
      </p>
      <Button variant="primary" onClick={retry ?? reset}>
        <FormattedMessage id="error.retry" />
      </Button>
    </section>
  );
}
