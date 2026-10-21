'use client';

import { FormattedMessage } from 'react-intl';
import styles from './boundary.module.css';

/**
 * Route-group loading fallback for the gated app (R-15): a calm, tokenized pulse
 * shown while a screen's async work settles, inside a polite status region.
 *
 * The region ANNOUNCES the state (WCAG 4.1.3; lane audit 2026-10-21, R3): it used to
 * hold only `aria-hidden` pulses, so a screen reader heard nothing, on the stated
 * belief that loading.tsx could not resolve the locale. It can: `[locale]/layout.tsx`
 * provides the intl context above this segment, as the sibling `error.tsx` already
 * relies on. The approved `common.loading` string is read, visually hidden.
 */
export default function AppLoading() {
  return (
    <div className={styles.loading} role="status" aria-live="polite" aria-busy="true">
      <span className="srOnly">
        <FormattedMessage id="common.loading" />
      </span>
      <span className={styles.pulseWide} aria-hidden />
      <span className={styles.pulse} aria-hidden />
      <span className={styles.pulse} aria-hidden />
    </div>
  );
}
