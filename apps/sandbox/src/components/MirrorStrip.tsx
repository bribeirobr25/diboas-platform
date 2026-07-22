'use client';

import { FormattedMessage } from 'react-intl';
import { illustrativeMirror } from '@diboas/investing';
import { LOCALE_CURRENCY, LOCALE_MARKET, type SandboxLocale } from '@/i18n/config';
import { useProfile } from '@/hooks/useProfile';
import { useFormatters } from '@/hooks/useFormatters';
import { LucideIcon } from './LucideIcon';
import styles from './MirrorStrip.module.css';

/**
 * The illustrative life-mirror (D-M1): two buckets, Floor + Working, derived
 * from the user's real monthly income — CONTEXT, never advice (Q3). Floor stays
 * in their bank (diBoaS never touches it); Working is what comes to diBoaS.
 * Renders nothing when no income was given (F-A5 — the caller shows its own
 * no-salary state). All figures are monthly and whole-currency (UX-61).
 */
export function MirrorStrip({
  locale,
  onAdjust,
}: {
  locale: SandboxLocale;
  /** When provided (home only), renders the "adjust your costs" affordance (4.3 / 2d). */
  onAdjust?: () => void;
}) {
  const profile = useProfile();
  const { moneyWhole } = useFormatters(LOCALE_CURRENCY[locale]);

  if (profile.netMonthlyIncome == null) return null;
  const mirror = illustrativeMirror(profile.netMonthlyIncome, LOCALE_MARKET[locale], {
    essentials: profile.essentials ?? undefined,
  });
  if (!mirror) return null;

  // The adjust affordance must appear in BOTH states — including the dignity
  // state, or a user who set costs too high has no way to lower them back.
  const adjustButton = onAdjust ? (
    <button type="button" className={styles.adjust} onClick={onAdjust}>
      <LucideIcon name="pencil" size={13} />
      <FormattedMessage id={profile.essentials == null ? 'mirror.adjust' : 'mirror.adjustEdit'} />
    </button>
  ) : null;

  if (mirror.dignityState) {
    return (
      <div className={styles.wrap}>
        <div className={styles.dignity} role="note">
          <FormattedMessage id="mirror.dignity" />
        </div>
        {adjustButton}
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.caption}>
        <FormattedMessage id={mirror.essentialsAssumed ? 'mirror.caption' : 'mirror.captionReal'} />
      </p>
      <div className={styles.buckets}>
        <div className={styles.bucket}>
          <span className={styles.bucketLabel}>
            <LucideIcon name="shield" size={14} />
            <FormattedMessage id="mirror.floorLabel" />
          </span>
          <span className={styles.bucketAmount}>
            {moneyWhole(mirror.floor)}
            <span className={styles.perMonth}>
              <FormattedMessage id="mirror.perMonth" />
            </span>
          </span>
          <span className={styles.bucketNote}>
            <FormattedMessage id="mirror.floorNote" />
          </span>
        </div>
        <div className={styles.bucket} data-emphasis="true">
          <span className={styles.bucketLabel}>
            <LucideIcon name="sprout" size={14} />
            <FormattedMessage id="mirror.workingLabel" />
          </span>
          <span className={styles.bucketAmount}>
            {moneyWhole(mirror.working)}
            <span className={styles.perMonth}>
              <FormattedMessage id="mirror.perMonth" />
            </span>
          </span>
          <span className={styles.bucketNote}>
            <FormattedMessage id="mirror.workingNote" />
          </span>
        </div>
      </div>
      {adjustButton}
    </div>
  );
}
