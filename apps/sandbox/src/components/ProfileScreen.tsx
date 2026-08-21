'use client';

import Link from 'next/link';
import { FormattedMessage, useIntl } from 'react-intl';
import type { SandboxLocale } from '@/i18n/config';
import { LucideIcon } from './LucideIcon';
import styles from './ProfileScreen.module.css';

/**
 * Profile (R1; mockup 30). The two identity layers (W-11/W-16): a public
 * @handle for payments and a separate Community nickname for Circles, plus the
 * display name and account rows. The profile DATA + Edit wiring live on the
 * account model (deferred, DEFERRED_BACKEND_LEDGER / D-2), so values show their
 * honest new-user empty state until then; @handle Edit routes to the claim flow.
 */
export function ProfileScreen({ locale }: { locale: SandboxLocale }) {
  const intl = useIntl();
  const notSet = <FormattedMessage id="profile.notSet" />;

  return (
    <section className={styles.wrap} aria-labelledby="profile-title">
      <header className={styles.head}>
        <h1 id="profile-title" className={styles.title}>
          <FormattedMessage id="profile.title" />
        </h1>
        <p className={styles.subtitle}>
          <FormattedMessage id="profile.subtitle" />
        </p>
      </header>

      <div className={styles.avatarWrap}>
        <span className={styles.avatar}>
          <LucideIcon name="user" size={44} />
        </span>
        <button
          type="button"
          className={styles.avatarEdit}
          aria-label={intl.formatMessage({ id: 'profile.editAvatar' })}
          disabled
        >
          <LucideIcon name="pencil" size={15} />
        </button>
      </div>

      <div className={styles.fields}>
        <Field label="profile.displayNameLabel" value={notSet} desc="profile.displayNameDesc" />
        <Field
          label="profile.handleLabel"
          value={notSet}
          desc="profile.handleDesc"
          chip={{ icon: 'globe', text: 'profile.handleChip' }}
          editHref={`/${locale}/handle-claim`}
        />
        <Field
          label="profile.nicknameLabel"
          value={notSet}
          desc="profile.nicknameDesc"
          chip={{ icon: 'users', text: 'profile.nicknameChip' }}
        />
      </div>

      <ul className={styles.rows}>
        <Row icon="mail" title="profile.email" sub="profile.notSet" />
        <Row icon="clock" title="profile.memberSince" sub="profile.notSet" />
        <Row icon="shield-check" title="profile.security" sub="profile.securitySub" />
        <Row icon="wallet" title="profile.payment" sub="profile.paymentSub" />
        {/* Both of these were BUILT and unreachable — nothing in the app linked
            to /settings or /practice-record, so they existed only for someone
            typing the URL. Profile is the account hub, and mockup 30's row list
            is the natural place for them. */}
        <Row
          icon="shield"
          title="profile.privacy"
          sub="profile.privacySub"
          href={`/${locale}/settings`}
        />
        <Row
          icon="list"
          title="profile.practiceRecord"
          sub="profile.practiceRecordSub"
          href={`/${locale}/practice-record`}
        />
      </ul>
    </section>
  );
}

function Field({
  label,
  value,
  desc,
  chip,
  editHref,
}: {
  label: string;
  value: React.ReactNode;
  desc: string;
  chip?: { icon: string; text: string };
  editHref?: string;
}) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldMain}>
        <p className={styles.fieldLabel}>
          <FormattedMessage id={label} />
        </p>
        <p className={styles.fieldValue}>{value}</p>
        {chip ? (
          <span className={styles.chip}>
            <LucideIcon name={chip.icon} size={13} />
            <FormattedMessage id={chip.text} />
          </span>
        ) : null}
        <p className={styles.fieldDesc}>
          <FormattedMessage id={desc} />
        </p>
      </div>
      {editHref ? (
        <Link href={editHref} className={styles.edit}>
          <LucideIcon name="pencil" size={16} />
          <span>
            <FormattedMessage id="profile.edit" />
          </span>
        </Link>
      ) : (
        // Not wired yet (account model, D-2) -> disabled until implemented.
        <button type="button" className={styles.edit} disabled>
          <LucideIcon name="pencil" size={16} />
          <span>
            <FormattedMessage id="profile.edit" />
          </span>
        </button>
      )}
    </div>
  );
}

/**
 * A profile row. `href` makes it a real door; without one it is an
 * informational row that still shows a chevron, matching mockup 30 (Email,
 * Member since, Account & security and Payment info are all display-only
 * until their account-model track lands).
 */
function Row({
  icon,
  title,
  sub,
  href,
}: {
  icon: string;
  title: string;
  sub: string;
  href?: string;
}) {
  const body = (
    <>
      <span className={styles.rowIcon}>
        <LucideIcon name={icon} size={20} />
      </span>
      <span className={styles.rowBody}>
        <span className={styles.rowTitle}>
          <FormattedMessage id={title} />
        </span>
        <span className={styles.rowSub}>
          <FormattedMessage id={sub} />
        </span>
      </span>
      <LucideIcon name="chevron-right" size={18} className={styles.rowChevron} />
    </>
  );
  return (
    <li className={styles.row}>
      {href ? (
        <Link href={href} className={styles.rowLink}>
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  );
}
