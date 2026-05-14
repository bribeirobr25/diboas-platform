import type { Meta, StoryObj } from '@storybook/nextjs';
import { CalmSummary } from './CalmSummary';
import constructive from '@/lib/analytics-sdk/fixtures/regime-constructive.json';
import mixed from '@/lib/analytics-sdk/fixtures/regime-mixed.json';

const meta = {
  title: 'Market/CalmSummary',
  component: CalmSummary,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof CalmSummary>;
export default meta;

type Story = StoryObj<typeof meta>;

export const ConstructiveShort: Story = {
  args: { data: constructive.summary.en as never, length: 'short' },
};
export const ConstructiveDetailed: Story = {
  args: { data: constructive.summary.en as never, length: 'detailed' },
};
export const MixedDetailed: Story = {
  args: { data: mixed.summary.en as never, length: 'detailed' },
};
