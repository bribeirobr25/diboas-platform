import type { Meta, StoryObj } from '@storybook/nextjs';
import { ConfidenceBadge } from './ConfidenceBadge';

const LABELS = { HIGH: 'High confidence', MODERATE: 'Moderate confidence', LOW: 'Low confidence' };

const meta = {
  title: 'Market/ConfidenceBadge',
  component: ConfidenceBadge,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ConfidenceBadge>;
export default meta;

type Story = StoryObj<typeof meta>;

export const High: Story = { args: { level: 'HIGH', labels: LABELS } };
export const Moderate: Story = { args: { level: 'MODERATE', labels: LABELS } };
export const Low: Story = { args: { level: 'LOW', labels: LABELS } };
