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
 * INTERIM ASSET (founder-approved 2026-08-21: "use the other diBoaS logo for
 * now"). This is the real shipped monogram, but it is the app-icon cut — the
 * palm sits on an opaque ink tile rather than on transparency, so it reads as
 * a small app icon rather than the free-standing mark mockup 02 draws. It is
 * used as-is deliberately: cropping the palm out of the wordmark, or keying
 * the tile away, would be a fabricated brand asset, which the
 * asset-compliance gate forbids. Swapping in a transparent mark later is a
 * one-line change to the stylesheet.
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
