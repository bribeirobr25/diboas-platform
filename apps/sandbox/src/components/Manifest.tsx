'use client';

import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { BottomSheet } from './BottomSheet';
import styles from './Manifest.module.css';

export interface ManifestRow {
  labelId: string;
  value: ReactNode;
}

/**
 * The plain-language transaction manifest — the "read before you approve"
 * signing rehearsal (UX-44: the cost sits with the action). Renders in the
 * ink-teal BottomSheet (the high-gravity moment); the sheet owns the a11y
 * contract (focus trap, Escape, scroll-lock, return-focus).
 */
export function Manifest({
  titleId,
  titleValues,
  rows,
  onApprove,
  onCancel,
  approving = false,
  ctaId = 'manifest.approve',
  ctaValues,
  reassuranceId,
}: {
  titleId: string;
  titleValues?: Record<string, ReactNode>;
  rows: ManifestRow[];
  onApprove: () => void;
  onCancel: () => void;
  approving?: boolean;
  /** CTA label id + values — carries the all-in figure on the button (UX-52). */
  ctaId?: string;
  ctaValues?: Record<string, ReactNode>;
  /** One-line reassurance answering the top fear, inside the box (UX-53). */
  reassuranceId?: string;
}) {
  return (
    <BottomSheet titleId={titleId} titleValues={titleValues} onClose={onCancel} tone="ink">
      <dl className={styles.rows}>
        {rows.map((row) => (
          <div key={row.labelId} className={styles.row}>
            <dt className={styles.label}>
              <FormattedMessage id={row.labelId} />
            </dt>
            <dd className={styles.value}>{row.value}</dd>
          </div>
        ))}
      </dl>
      {reassuranceId ? (
        <p className={styles.reassurance}>
          <FormattedMessage id={reassuranceId} />
        </p>
      ) : null}
      <p className={styles.footer}>
        <FormattedMessage id="manifest.footer" />
      </p>
      <button type="button" className={styles.approve} onClick={onApprove} disabled={approving}>
        <FormattedMessage id={ctaId} values={ctaValues} />
      </button>
    </BottomSheet>
  );
}
