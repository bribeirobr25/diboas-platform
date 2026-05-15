import type { Meta, StoryObj } from '@storybook/nextjs';
import { ProductDisclaimer } from './ProductDisclaimer';
import disclaimer from '@/lib/analytics-sdk/fixtures/product-disclaimer.json';

const meta = {
  title: 'Market/ProductDisclaimer',
  component: ProductDisclaimer,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ProductDisclaimer>;
export default meta;

type Story = StoryObj<typeof meta>;

export const English: Story = { args: { text: disclaimer.text.en } };
export const Portuguese: Story = { args: { text: disclaimer.text['pt-BR'] } };
export const Spanish: Story = { args: { text: disclaimer.text.es } };
export const German: Story = { args: { text: disclaimer.text.de } };
