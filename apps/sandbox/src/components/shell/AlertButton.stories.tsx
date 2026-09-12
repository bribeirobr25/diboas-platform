import type { Meta, StoryObj } from '@storybook/react';
import { AlertButton } from './AlertButton';

/**
 * `AlertButton` state evidence (Minimum UI System §10.3, Shell Spec §14).
 *
 * §10.3 closes `no-unread` · `unread-dot` · `unread-count` · `pressed` ·
 * `focus` · `disabled`. `no-unread` and `unread-dot` are below; `unread-count`
 * is served by the dot plus the count in the accessible name (§14.2 allows
 * either form); `pressed` and `focus` are interaction states a reader
 * exercises here directly.
 *
 * **`disabled` has no story, and that is a claim I am making deliberately:**
 * nothing disables the bell in this app — the inbox always opens, even when it
 * is empty. The Screen Family Matrix's **delivery-error** state is a declared
 * spec gap (plan §7.7), routed to Product rather than invented.
 *
 * **The unread states never render in the live app today.** Nothing produces an
 * unread notification — `NotificationInbox` takes its items as a prop and
 * defaults to none, with no producer anywhere. So the live bell shows
 * `no-unread` because that is the truth, and these stories are where the other
 * states are proven ready for the first producer. The unread accessible name is
 * supplied here in English only: §10.3 requires one, and no approved wording
 * exists in the four locales.
 */
const meta = {
  title: 'L2 Shell/AlertButton',
  component: AlertButton,
  parameters: { layout: 'centered' },
  args: { href: '/en/notifications' },
} satisfies Meta<typeof AlertButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The live state: the bell alone (§14.2 — an indicator only when unread exist). */
export const NoUnread: Story = { args: { unreadCount: 0 } };

/** One unread: the conventional red dot, never a novel notification language. */
export const UnreadDot: Story = {
  args: { unreadCount: 1, unreadLabel: 'Notifications, 1 unread' },
};

/**
 * Many unread — and the dot is IDENTICAL, on purpose.
 *
 * §14.2 allows a dot or a small badge count; this is the dot, and the count
 * rides in the accessible name (open the a11y panel: "Notifications, 23
 * unread"). A tiny number on red would need legible contrast in both
 * appearances — an unanswered calibration question — and it would tell a
 * sighted reader something the name already tells everyone.
 */
export const UnreadManyDotUnchanged: Story = {
  args: { unreadCount: 23, unreadLabel: 'Notifications, 23 unread' },
};
