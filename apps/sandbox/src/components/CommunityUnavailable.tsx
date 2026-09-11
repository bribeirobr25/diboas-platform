'use client';

import Link from 'next/link';
import { FormattedMessage } from 'react-intl';
import { LucideIcon } from './LucideIcon';
import styles from './CommunityUnavailable.module.css';

/**
 * Community — the controlled unavailable destination (Shell Spec §9.5 / §23,
 * Product `P-QA5`, Brand copy Legal-approved as `L-QA3`).
 *
 * Community stays in the navigation from the beginning even though public
 * enablement is `WAIT`, and §23 is explicit about what it must NOT be: no fake
 * content, no unexplained dead icon, and it must not be *"silently removed"*.
 * Its preferred shape is the one built here — *"a controlled unavailable
 * destination is usually more informative than a dead icon"* — with the four
 * beats the approved copy supplies: what it is, that access is not open, and a
 * safe way back.
 *
 * ## The implementation condition attached to the approval
 *
 * Legal's condition, verbatim: *"Do not render the explanation alone in a way
 * that could be read as a description of an operational service."* So the
 * explanation NEVER renders by itself — the unavailable title sits above it and
 * the availability line below it, in one block, and the component offers no way
 * to show one without the others. That is why this is a single component with
 * no props rather than a set of slots a caller could use selectively.
 *
 * Every string is the approved wording, transcribed into all four locales with
 * no edits; nothing here is authored.
 */
export function CommunityUnavailable({ locale }: { locale: string }) {
  return (
    <section className={styles.wrap} aria-labelledby="community-title">
      <span className={styles.icon}>
        <LucideIcon name="users" size={26} />
      </span>
      <h1 id="community-title" className={styles.title}>
        <FormattedMessage id="community.title" />
      </h1>
      <p className={styles.explanation}>
        <FormattedMessage id="community.explanation" />
      </p>
      <p className={styles.availability}>
        <FormattedMessage id="community.availability" />
      </p>
      <Link href={`/${locale}`} className={styles.action}>
        <LucideIcon name="arrow-left" size={18} />
        <FormattedMessage id="community.action" />
      </Link>
    </section>
  );
}
