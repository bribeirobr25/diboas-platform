import type { Meta, StoryObj } from '@storybook/nextjs';
import { RegimeLabel } from './RegimeLabel';
import constructive from '@/lib/analytics-sdk/fixtures/regime-constructive.json';
import veryFavorable from '@/lib/analytics-sdk/fixtures/regime-very-favorable.json';
import mixed from '@/lib/analytics-sdk/fixtures/regime-mixed.json';
import defensive from '@/lib/analytics-sdk/fixtures/regime-defensive.json';
import hostile from '@/lib/analytics-sdk/fixtures/regime-hostile.json';

const meta = {
  title: 'Market/RegimeLabel',
  component: RegimeLabel,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof RegimeLabel>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Constructive: Story = { args: { data: constructive as never } };
export const VeryFavorable: Story = { args: { data: veryFavorable as never } };
export const NeutralMixed: Story = { args: { data: mixed as never } };
export const Defensive: Story = { args: { data: defensive as never } };
export const Hostile: Story = { args: { data: hostile as never } };
