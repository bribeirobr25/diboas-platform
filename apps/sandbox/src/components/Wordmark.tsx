'use client';

import { useIntl } from 'react-intl';
import styles from './Wordmark.module.css';

/**
 * The diBoaS wordmark, theme-aware (on-light / on-dark asset swapped in CSS, so
 * no hydration flash) and rendered as a background so it never ships as raw
 * `<img>`. Shared across the onboarding screens (Welcome, Consent, …) — one
 * source for the brand mark. `size` sets the height; width follows the aspect
 * ratio.
 */
export function Wordmark({ className, size = '2.75rem' }: { className?: string; size?: string }) {
  const intl = useIntl();
  return (
    <span
      className={[styles.wordmark, className].filter(Boolean).join(' ')}
      style={{ height: size }}
      role="img"
      aria-label={intl.formatMessage({ id: 'common.wordmarkAlt' })}
    />
  );
}
