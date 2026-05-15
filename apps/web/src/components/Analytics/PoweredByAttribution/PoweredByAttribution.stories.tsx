import type { Meta, StoryObj } from '@storybook/nextjs';
import { PoweredByAttribution } from './PoweredByAttribution';

const meta = {
  title: 'Market/PoweredByAttribution',
  component: PoweredByAttribution,
  parameters: { layout: 'centered' },
  args: {
    href: 'https://diboas-analytics.com',
    label: 'Powered by',
    productName: 'diBoaS Analytics',
  },
} satisfies Meta<typeof PoweredByAttribution>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
