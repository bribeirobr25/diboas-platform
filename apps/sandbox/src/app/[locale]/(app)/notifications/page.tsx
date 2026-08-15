import { NotificationInbox } from '@/components/NotificationInbox';

/**
 * Notifications (B4; W-12). In-app inbox inside the app shell. The notification
 * source (the W-12 catalog + INotificationService mock) is deferred, so the
 * inbox is honestly empty for now (DEFERRED_BACKEND_LEDGER).
 */
export default function NotificationsPage() {
  return <NotificationInbox />;
}
