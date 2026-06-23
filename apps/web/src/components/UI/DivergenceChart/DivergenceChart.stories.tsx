/**
 * DivergenceChart stories — the "data as hero" primitive.
 * Sample values only; in product every figure is market-data-bound at the call site.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { DivergenceChart } from './DivergenceChart';

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

// $1,000 over 12 months at three rates (illustrative).
const monthly = (annualPct: number) =>
  Array.from({ length: 13 }, (_, m) => 1000 * Math.pow(1 + annualPct / 100, m / 12));

const meta: Meta<typeof DivergenceChart> = {
  title: 'UI/DivergenceChart',
  component: DivergenceChart,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof DivergenceChart>;

export const Default: Story = {
  args: {
    ariaLabel:
      'What $1,000 becomes in a year: your bank reaches about $1,004; diBoaS reaches about $1,070.',
    xCaptions: ['Today', '1 year'],
    formatValue: usd,
    series: [
      { id: 'bank', label: 'Your bank', values: monthly(0.38), variant: 'muted' },
      { id: 'diboas', label: 'diBoaS', values: monthly(7), variant: 'primary' },
    ],
  },
  render: (args) => (
    <div style={{ width: 560, maxWidth: '90vw', background: 'var(--surface-paper)', padding: 24 }}>
      <DivergenceChart {...args} />
    </div>
  ),
};
