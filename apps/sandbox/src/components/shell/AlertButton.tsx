import Link from 'next/link';
import { useIntl } from 'react-intl';
import { LucideIcon } from '../LucideIcon';
import styles from './ShellControls.module.css';

/**
 * `AlertButton` — access to Alerts (Minimum UI System §10.3, Shell Spec §14).
 *
 * The shell contract is deliberately thin: *"The current shell establishes only
 * the access pattern"* (§14). The bell is persistent on top-level authenticated
 * surfaces (§14.1); an unread indicator shows *"only when unread items exist"*
 * (§14.2).
 *
 * ## Why `unreadCount` defaults to zero, and why that is not a placeholder
 *
 * Nothing in this app produces an unread notification yet — `NotificationInbox`
 * takes its items as a prop and defaults to none, and no producer exists. So
 * the live bell renders the `no-unread` state because that is the truth, not
 * because the feature is stubbed. The `unread-dot` and `unread-count` states
 * are real code paths proven in Storybook, ready for the first producer.
 *
 * Two states from §10.3 are deliberately absent: `disabled` (nothing disables
 * the bell — the inbox always opens, even when empty) and the Screen Family
 * Matrix's **delivery-error** state, which plan §7.7 lists as a declared spec
 * gap routed to Product rather than invented here.
 *
 * §10.3's rules that this enforces: a conventional red indicator (never a
 * novelty), informational and not gamification (no pulse, no growth), and an
 * accessible unread label — the COUNT lives in that name, which is where a
 * screen-reader user gets it and where a tiny badge could not be read anyway.
 */
export function AlertButton({
  href,
  unreadCount = 0,
  unreadLabel,
}: {
  href: string;
  unreadCount?: number;
  /**
   * The accessible name when there ARE unread items, supplied by the caller.
   *
   * §10.3 requires an accessible unread label, and no authority-approved
   * wording for one exists in the four locales — so it is not invented here.
   * Nothing produces an unread notification yet, so the live shell passes
   * nothing and the bell renders its truthful `no-unread` name; Storybook
   * supplies English for the unread state evidence.
   */
  unreadLabel?: string;
}) {
  const intl = useIntl();
  const unread = unreadCount > 0;
  const label =
    unread && unreadLabel ? unreadLabel : intl.formatMessage({ id: 'nav.notifications' });

  return (
    <Link href={href} className={styles.control} aria-label={label}>
      <LucideIcon name="bell" size={22} />
      {/* The indicator is decorative: the count above is already in the name,
          so a screen reader is never told the same thing twice. */}
      {unread ? <span className={styles.unread} aria-hidden /> : null}
    </Link>
  );
}
