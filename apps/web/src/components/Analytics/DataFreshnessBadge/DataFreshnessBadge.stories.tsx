import type { Meta, StoryObj } from '@storybook/nextjs';
import { DataFreshnessBadge } from './DataFreshnessBadge';

const LABELS = {
  FRESH: 'Fresh',
  DELAYED: 'Delayed',
  STALE: 'Stale',
  UNAVAILABLE: 'Unavailable',
};

const meta = {
  title: 'Market/DataFreshnessBadge',
  component: DataFreshnessBadge,
  parameters: { layout: 'centered' },
  args: { source: 'CoinGecko', labels: LABELS },
} satisfies Meta<typeof DataFreshnessBadge>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Fresh: Story = { args: { status: 'FRESH' } };
export const Delayed: Story = {
  args: {
    status: 'DELAYED',
    source: 'FRED:M2SL',
    message: 'Liquidity data reflects the latest available monthly release.',
  },
};
export const Stale: Story = { args: { status: 'STALE', source: 'FRED:DGS10' } };
export const Unavailable: Story = {
  args: { status: 'UNAVAILABLE', source: 'FRED:DXY' },
};
