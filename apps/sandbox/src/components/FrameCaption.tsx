'use client';

import { FormattedMessage } from 'react-intl';
import styles from './FrameCaption.module.css';

/**
 * "diBoaS Sandbox / Practice mode. Play money, real market data." — the quiet
 * two-line caption above the app.
 *
 * It carries the sandbox framing for the WHOLE product (founder 2026-08-21):
 * every screen shows it except the authentication/welcome front door, where
 * the brand is already presented full-size. Because it says the thing once and
 * says it everywhere, the app bar no longer repeats it as a chip.
 *
 * Desktop/tablet only and `aria-hidden`: on a phone the caption would eat the
 * top of a screen that has no gutter to spare, and the framing is already in
 * the accessible copy of the screens themselves.
 */
export function FrameCaption() {
  return (
    <p className={styles.caption} aria-hidden>
      <FormattedMessage id="common.appName" />
      <span className={styles.sub}>
        <FormattedMessage id="common.frameCaption" />
      </span>
    </p>
  );
}
