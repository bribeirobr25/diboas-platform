import type { Meta, StoryObj } from '@storybook/nextjs';
import { MethodologyLink } from './MethodologyLink';

const meta = {
  title: 'Market/MethodologyLink',
  component: MethodologyLink,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof MethodologyLink>;
export default meta;

type Story = StoryObj<typeof meta>;

export const English: Story = {
  args: { href: 'https://diboas-analytics.com/methodology', children: 'Read the methodology' },
};
export const German: Story = {
  args: { href: 'https://diboas-analytics.com/methodology', children: 'Methodik lesen' },
};
