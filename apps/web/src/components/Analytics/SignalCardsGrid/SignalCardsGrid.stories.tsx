import type { Meta, StoryObj } from '@storybook/nextjs';
import { SignalCardsGrid } from './SignalCardsGrid';
import signals from '@/lib/analytics-sdk/fixtures/signals.json';

const flatGroups = signals.groups.map((g) => ({
  ...g,
  title: g.title.en,
  summary: g.summary.en,
  signals: g.signals.map((s) => ({ ...s, title: s.title.en, summary: s.summary.en })),
}));

const meta = {
  title: 'Market/SignalCardsGrid',
  component: SignalCardsGrid,
  parameters: { layout: 'padded' },
  args: {
    groups: flatGroups as never,
    expandLabel: 'Show signals',
    collapseLabel: 'Hide signals',
    pointsLabel: 'pts',
  },
} satisfies Meta<typeof SignalCardsGrid>;
export default meta;

type Story = StoryObj<typeof meta>;

export const TwoColumn: Story = { args: { columns: 2 } };
export const FourColumn: Story = { args: { columns: 4 } };
export const SingleColumn: Story = { args: { columns: 1 } };
