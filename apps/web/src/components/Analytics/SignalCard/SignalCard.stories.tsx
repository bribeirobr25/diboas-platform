import type { Meta, StoryObj } from '@storybook/nextjs';
import { SignalCard } from './SignalCard';
import signals from '@/lib/analytics-sdk/fixtures/signals.json';

const meta = {
  title: 'Market/SignalCard',
  component: SignalCard,
  parameters: { layout: 'padded' },
  args: {
    expandable: true,
    expandLabel: 'Show signals',
    collapseLabel: 'Hide signals',
    pointsLabel: 'pts',
  },
} satisfies Meta<typeof SignalCard>;
export default meta;

type Story = StoryObj<typeof meta>;

const [btc, macro, demand, rs] = signals.groups;

function flat(group: (typeof signals.groups)[number]) {
  return {
    ...group,
    title: group.title.en,
    summary: group.summary.en,
    signals: group.signals.map((s) => ({ ...s, title: s.title.en, summary: s.summary.en })),
  };
}

export const BTC_Structure_Constructive: Story = { args: { data: flat(btc) as never } };
export const Macro_Mixed: Story = { args: { data: flat(macro) as never } };
export const Institutional_Constructive: Story = { args: { data: flat(demand) as never } };
export const RelativeStrength_Constructive: Story = { args: { data: flat(rs) as never } };
