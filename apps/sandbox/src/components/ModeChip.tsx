'use client';

import { FormattedMessage } from 'react-intl';
import { LucideIcon } from './LucideIcon';
import styles from './ModeChip.module.css';

/**
 * The "Sandbox · play money" mode chip (design-system primitive, slice A1).
 * Mode-confusion is the one real safety risk (moving real money by accident),
 * so the label is ONE lexicon wherever it appears rather than each surface
 * inlining its own badge.
 *
 * Consumers are the two PRE-APP screens — Consent and the Claim ceremony.
 * Inside the app the same duty is carried by the disclaimer line AppChrome
 * renders under every screen (R-4); the bar itself is the mark alone (founder
 * 2026-08-21). Sea-green pill, sentence case, matching the approved mockups;
 * text uses the accessible teal-600 for contrast on the pale tint.
 */
export function ModeChip() {
  return (
    <span className={styles.chip}>
      <LucideIcon name="flask" size={13} className={styles.flask} />
      <FormattedMessage id="common.playBadge" />
    </span>
  );
}
