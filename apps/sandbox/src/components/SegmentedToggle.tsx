'use client';

import type { ReactNode } from 'react';
import styles from './SegmentedToggle.module.css';

export type Segment<T extends string> = { id: T; label: ReactNode };

/**
 * SegmentedToggle primitive (Phase B). The "Simple | Detailed" view switcher of
 * the dual-view design language (SANDBOX_DESIGN_LANGUAGE_DUAL_VIEW) — reused by
 * strategy detail, goal detail, and the time machine. Accessible toggle-button
 * group: a labelled group of buttons with aria-pressed marking the active view
 * (a valid pattern for a mutually-exclusive view switch; simpler + more robust
 * than a roving-tabindex tablist for a 2-option control). Controlled.
 */
export function SegmentedToggle<T extends string>({
  segments,
  value,
  onChange,
  ariaLabel,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (next: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className={styles.group} role="group" aria-label={ariaLabel}>
      {segments.map((s) => {
        const active = s.id === value;
        return (
          <button
            key={s.id}
            type="button"
            aria-pressed={active}
            className={`${styles.segment} ${active ? styles.active : ''}`}
            onClick={() => onChange(s.id)}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
