'use client';

/**
 * SegmentedControl — visible-options selector for small choice sets (≤5).
 *
 * UX-36 (checklist Part 3 row 7): dropdowns hide choices; where five or fewer
 * options exist, every option is exposed at a glance. Introduced by the
 * F-7/F-8 design-review pass (UX_AUDIT_DESIGN_REVIEWER_F7-F11_2026-07-10 P1-a)
 * to replace the 2–4-option `Select`s in asset-history and inflation-impact.
 * Visual language mirrors the currency-depreciation mode toggle.
 *
 * A11y: toggle-button group — real `<button>`s with `aria-pressed`, wrapped in
 * `role="group"`. Label the group via `ariaLabel` or `ariaLabelledby` (pair
 * with the field's visible `<label id=…>`; segmented buttons are not form
 * controls, so `htmlFor` does not apply).
 */

import styles from './SegmentedControl.module.css';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
  /** Optional tooltip, e.g. why an option is disabled. */
  title?: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  ariaLabelledby?: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  ariaLabelledby,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={`${styles.group} ${className ?? ''}`}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          disabled={opt.disabled}
          title={opt.title}
          className={`${styles.segment} ${value === opt.value ? styles.segmentActive : ''}`}
          onClick={() => {
            if (!opt.disabled && opt.value !== value) onChange(opt.value);
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
