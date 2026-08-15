'use client';

import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { LucideIcon } from './LucideIcon';
import styles from './NotificationInbox.module.css';

export interface SandboxNotification {
  id: string;
  icon: string;
  title: ReactNode;
  body: string;
  timeAgo: string;
  unread: boolean;
}

/**
 * Notification inbox (B4; mockup 33). The typed notification list (icon · title
 * · body · time · unread dot) with the calm empty state. R1 = in-app inbox only
 * (W-12; push retired PL-1b). The notification SOURCE is deferred: the W-12
 * 12-entry catalog + its `INotificationService` mock are registered
 * (DEFERRED_BACKEND_LEDGER) — until then the inbox is honestly empty (no fake
 * entries), and the row markup is ready for wiring.
 */
export function NotificationInbox({
  notifications = [],
}: {
  notifications?: SandboxNotification[];
}) {
  return (
    <section className={styles.wrap} aria-labelledby="notif-title">
      <h1 id="notif-title" className={styles.title}>
        <FormattedMessage id="notifications.title" />
      </h1>

      {notifications.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <LucideIcon name="bell" size={28} />
          </span>
          <p className={styles.emptyBody}>
            <FormattedMessage id="notifications.empty" />
          </p>
        </div>
      ) : (
        <ul className={styles.list}>
          {notifications.map((n) => (
            <li key={n.id} className={styles.item}>
              <span className={styles.icon}>
                <LucideIcon name={n.icon} size={22} />
              </span>
              <div className={styles.body}>
                <p className={styles.itemTitle}>{n.title}</p>
                <p className={styles.itemBody}>{n.body}</p>
              </div>
              <div className={styles.meta}>
                <span className={styles.time}>{n.timeAgo}</span>
                {n.unread ? <span className={styles.dot} data-unread aria-hidden /> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
