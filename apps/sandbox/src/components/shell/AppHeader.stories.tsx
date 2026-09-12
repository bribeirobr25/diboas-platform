import type { Meta, StoryObj } from '@storybook/react';
import { AppHeader } from './AppHeader';

/**
 * `AppHeader` state evidence (Minimum UI System §10.1, Shell Spec §3–§6).
 *
 * The four variants below are the ones §10.1 closes, and each maps onto a shell
 * family, so these stories are also the family model's visual proof:
 *
 *   `top-level` (S1) — Profile · identity · Alerts   (Spec §4.1)
 *   `focused`   (S2) — Back · identity               (Spec §5.1)
 *   `neutral`   (S0) — identity only; no Profile, no Alerts (Spec §3.2)
 *   `system`    (S3) — minimal (Spec §6)
 *
 * Two states from §10.1 are deliberately missing: `scrolled` and
 * `offline/system-context`. The Screen Family Matrix marks the App Header's
 * state coverage as a declared spec gap (plan §7.7), so they are routed to
 * Product rather than invented here — a story for an unspecified state would be
 * a claim that the state is designed.
 *
 * The `unread` variants of the bell are exercised in `AlertButton`'s own
 * stories; nothing in the app produces an unread notification yet.
 */
const meta = {
  title: 'L2 Shell/AppHeader',
  component: AppHeader,
  parameters: { layout: 'padded' },
  args: {
    homeHref: '/en',
    profileHref: '/en/profile',
    alertsHref: '/en/notifications',
  },
} satisfies Meta<typeof AppHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** S1 — a top-level destination: both utilities present. */
export const TopLevel: Story = { args: { variant: 'top-level' } };

/** S1 over Home's coastal band: the bar goes transparent (mockup 02). */
export const TopLevelOverHero: Story = { args: { variant: 'top-level', transparent: true } };

/** S2 — a focused task: Back replaces Profile, and no Alerts competes with it. */
export const Focused: Story = { args: { variant: 'focused' } };

/**
 * S0 — neutral entry (Welcome / Consent / Entry Readiness / Gate). Identity
 * only: *"No Profile or Alerts until the user is meaningfully inside the
 * authenticated app context"* (Spec §3.2), and no financial mode marker at all
 * (§7.3, Product `P-QA4`, Legal `L-QA2`).
 */
export const Neutral: Story = { args: { variant: 'neutral' } };

/** S3 — system / recovery: minimal, navigation may be restricted (Spec §6). */
export const System: Story = { args: { variant: 'system' } };
