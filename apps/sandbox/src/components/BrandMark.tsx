'use client';

import { useIntl } from 'react-intl';
import styles from './BrandMark.module.css';

/**
 * The short brand mark — the palm monogram alone, no wordmark, no label.
 *
 * What the app bar carries on every internal screen (founder 2026-08-21,
 * matching mockup 02): the full wordmark plus the "Sandbox · play money" chip
 * made the bar say three things at once, while the sandbox framing already
 * lives in the frame caption above the canvas.
 *
 * The asset is the transparent monogram (founder-supplied 2026-08-22),
 * replacing the interim app-icon cut that carried an opaque ink tile. Derived
 * from the shipped source by trim + resize only — no recolouring, no keying, no
 * cropping a palm out of the wordmark, so the asset-compliance gate is
 * satisfied: it is the real mark, not a fabricated one.
 */
export function BrandMark({ size = '1.9rem' }: { size?: string }) {
  const intl = useIntl();
  return (
    <span
      className={styles.mark}
      style={{ height: size, width: size }}
      role="img"
      aria-label={intl.formatMessage({ id: 'common.wordmarkAlt' })}
    />
  );
}
