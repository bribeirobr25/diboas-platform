import type { Meta, StoryObj } from '@storybook/nextjs';
import { SignalCard } from './SignalCard';
import signals from '@/lib/analytics-sdk/fixtures/signals.json';
import groupTpl from '../../../../scripts/market-refresh/templates/group-summaries.json';
import signalTpl from '../../../../scripts/market-refresh/templates/signal-sentences.json';

const meta = {
  title: 'Market/SignalCard',
  component: SignalCard,
  parameters: { layout: 'padded' },
  args: {
    expandable: true,
    expandLabel: 'Show signals',
    collapseLabel: 'Hide signals',
    pointsLabel: 'pts',
    unavailableLabel: 'Unavailable',
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

// 2026-10-19: nothing in the group evaluated. The copy is the real template
// wording, filled as the generator fills it.
const zeroOfTwo = (t: string) => t.replace('{points}', '0').replace('{max}', '2');
function institutional(
  status: 'UNAVAILABLE' | 'WEAK',
  state: 'UNAVAILABLE' | 'INACTIVE',
  groupSentence: string,
  signalSentence: string
) {
  const g = flat(demand);
  return {
    ...g,
    status,
    points_awarded: 0,
    summary: zeroOfTwo(groupSentence),
    signals: g.signals.map((sig) => ({
      ...sig,
      state,
      points_awarded: 0,
      summary: signalSentence,
    })),
  };
}

export const Institutional_Unavailable_Suspended: Story = {
  args: {
    data: institutional(
      'UNAVAILABLE',
      'UNAVAILABLE',
      groupTpl.institutional_demand.suspended.en,
      signalTpl['ETF-01'].UNAVAILABLE.variants.suspended.en
    ) as never,
  },
};
export const Institutional_Unavailable_WarmUp: Story = {
  args: {
    data: institutional(
      'UNAVAILABLE',
      'UNAVAILABLE',
      groupTpl.institutional_demand.unavailable.en,
      signalTpl['ETF-01'].UNAVAILABLE.en.replace('{snapshots}', '3').replace('{warmupTarget}', '5')
    ) as never,
  },
};
/** Control: an evaluated 0/2 is a weak read and keeps the bar. */
export const Institutional_Weak_Evaluated: Story = {
  args: {
    data: institutional(
      'WEAK',
      'INACTIVE',
      groupTpl.institutional_demand.weak.en,
      signalTpl['ETF-01'].INACTIVE.en.replace('{positives}', '1')
    ) as never,
  },
};
