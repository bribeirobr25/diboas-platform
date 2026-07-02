'use client';

import styles from './PrintDocButton.module.css';

interface PrintDocButtonProps {
  /** Localized label, e.g. "Download PDF". */
  readonly label: string;
  readonly className?: string;
}

/**
 * PrintDocButton — opens the browser print dialog (→ "Save as PDF").
 *
 * The document already renders in full on the gated page, so printing it is the
 * simplest, safest "download": no generated file to leak past the room gate, and
 * the output is always the current page in the current locale. The `@media print`
 * styles (page CSS) reset the room's dark chrome to a clean ink-on-white document.
 */
export function PrintDocButton({ label, className = '' }: PrintDocButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.button} ${className}`}
      onClick={() => {
        if (typeof window !== 'undefined' && typeof window.print === 'function') window.print();
      }}
    >
      <span>{label}</span>
    </button>
  );
}

PrintDocButton.displayName = 'PrintDocButton';
