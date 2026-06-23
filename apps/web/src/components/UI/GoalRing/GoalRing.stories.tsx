/**
 * GoalRing stories — the signature goal device.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { GoalRing } from './GoalRing';

const meta: Meta<typeof GoalRing> = {
  title: 'UI/GoalRing',
  component: GoalRing,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof GoalRing>;

export const Action: Story = {
  args: {
    progress: 0.62,
    size: 180,
    variant: 'action',
    ariaLabel: 'Goal 62% funded',
    label: (
      <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-action-text)' }}>62%</span>
    ),
  },
};

export const Warm: Story = {
  args: {
    progress: 0.4,
    size: 180,
    variant: 'warm',
    ariaLabel: 'Goal 40% funded',
    label: (
      <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-warm-text)' }}>40%</span>
    ),
  },
};
