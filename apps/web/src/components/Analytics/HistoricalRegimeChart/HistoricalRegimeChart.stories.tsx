import type { Meta, StoryObj } from '@storybook/nextjs';
import { HistoricalRegimeChart } from './HistoricalRegimeChart';
import historical from '@/lib/analytics-sdk/fixtures/historical-regimes-1y.json';
import { historicalDateLabels } from '@/lib/market/presentationState';

const meta = {
  title: 'Market/HistoricalRegimeChart',
  component: HistoricalRegimeChart,
  parameters: { layout: 'padded' },
  args: {
    data: historical as never,
    ariaLabel: 'Macro environment score over time',
    tableLabels: { date: 'Date', score: 'Score', regime: 'Regime' },
    regimeLabels: {
      VERY_FAVORABLE: 'Very Favorable',
      CONSTRUCTIVE: 'Constructive',
      NEUTRAL_MIXED: 'Neutral / Mixed',
      DEFENSIVE: 'Defensive',
      HOSTILE: 'Hostile',
    },
    dateLabels: historicalDateLabels(historical.snapshots, 'en'),
  },
} satisfies Meta<typeof HistoricalRegimeChart>;
export default meta;

type Story = StoryObj<typeof meta>;

export const ThreeMonth: Story = { args: { range: '3M' } };
export const SixMonth: Story = { args: { range: '6M' } };
export const OneYear: Story = { args: { range: '1Y' } };
export const ReducedMotion: Story = { args: { range: '1Y', reducedMotion: true } };
