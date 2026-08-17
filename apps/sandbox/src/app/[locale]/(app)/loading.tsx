import styles from './boundary.module.css';

/**
 * Route-group loading fallback for the gated app (R-15): a calm, tokenized
 * pulse shown while a screen's async work settles. The visual pulse carries the
 * state; the container is a polite status region (no localized string needed —
 * loading.tsx cannot resolve the active locale, and the state is transient).
 */
export default function AppLoading() {
  return (
    <div className={styles.loading} role="status" aria-live="polite" aria-busy="true">
      <span className={styles.pulseWide} aria-hidden />
      <span className={styles.pulse} aria-hidden />
      <span className={styles.pulse} aria-hidden />
    </div>
  );
}
