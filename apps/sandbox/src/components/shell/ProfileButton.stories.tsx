import type { Meta, StoryObj } from '@storybook/react';
import { ProfileButton } from './ProfileButton';

/**
 * `ProfileButton` state evidence (Minimum UI System §10.4).
 *
 * §10.4 closes exactly three states — `default` · `pressed` · `focus` — and the
 * last two are interaction states a reader exercises here rather than separate
 * stories, so there is one story and that is the honest count.
 *
 * The rules it carries are placement and restraint: top-left on authenticated
 * top-level surfaces (Shell Spec §4.2), which is what keeps Profile out of the
 * five bottom-nav destinations (§11.1); replaced by Back in a focused flow
 * (the header owns that swap); and *"not used as a financial mode switch"* —
 * `SHELL-3`'s refusal, which is why this opens the account area and nothing
 * else.
 */
const meta = {
  title: 'L2 Shell/ProfileButton',
  component: ProfileButton,
  parameters: { layout: 'centered' },
  args: { href: '/en/profile' },
} satisfies Meta<typeof ProfileButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
