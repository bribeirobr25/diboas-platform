import type { Meta, StoryObj } from '@storybook/nextjs';
import { RegimeScore } from './RegimeScore';
import constructive from '@/lib/analytics-sdk/fixtures/regime-constructive.json';
import veryFavorable from '@/lib/analytics-sdk/fixtures/regime-very-favorable.json';
import mixed from '@/lib/analytics-sdk/fixtures/regime-mixed.json';
import defensive from '@/lib/analytics-sdk/fixtures/regime-defensive.json';
import hostile from '@/lib/analytics-sdk/fixtures/regime-hostile.json';

const meta = {
  title: 'Market/RegimeScore',
  component: RegimeScore,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof RegimeScore>;
export default meta;

type Story = StoryObj<typeof meta>;

const ARIA = 'Current macro environment score';

export const Constructive: Story = {
  args: { data: constructive as never, ariaLabel: ARIA },
};
export const VeryFavorable: Story = {
  args: { data: veryFavorable as never, ariaLabel: ARIA },
};
export const NeutralMixed: Story = {
  args: { data: mixed as never, ariaLabel: ARIA },
};
export const Defensive: Story = {
  args: { data: defensive as never, ariaLabel: ARIA },
};
export const Hostile: Story = {
  args: { data: hostile as never, ariaLabel: ARIA },
};
