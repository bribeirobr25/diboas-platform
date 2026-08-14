'use client';

import styles from './Toggle.module.css';

/**
 * Toggle primitive (design-system; needed first by the A3 consent screen, reused
 * by Settings). Accessible switch: a real <button role="switch"> with
 * aria-checked (Space/Enter toggle for free), a visible label association via
 * the caller's labelledby, and a >=24px hit area (WCAG 2.5.8). Controlled —
 * the caller owns state (consent state is server-authoritative; this is just
 * the control). Never a bare styled div.
 */
export function Toggle({
  checked,
  onChange,
  labelledBy,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** id of the visible label this switch is described by (a11y). */
  labelledBy: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      className={`${styles.track} ${checked ? styles.on : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.thumb} aria-hidden />
    </button>
  );
}
