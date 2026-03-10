/**
 * CurrencyInput Storybook Stories
 *
 * Demonstrates the currency input with linked slider across currencies and states.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { CurrencyInput } from './CurrencyInput';

const meta: Meta<typeof CurrencyInput> = {
  title: 'UI/CurrencyInput',
  component: CurrencyInput,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    currency: {
      control: 'select',
      options: ['USD', 'EUR', 'BRL', 'GBP'],
      description: 'Currency code',
    },
    min: {
      control: 'number',
      description: 'Minimum value',
    },
    max: {
      control: 'number',
      description: 'Maximum value',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CurrencyInput>;

/**
 * Default — USD
 */
export const Default: Story = {
  args: {
    value: 10000,
    onChange: () => {},
    label: 'Investment amount',
    currency: 'USD',
    min: 0,
    max: 100000,
  },
};

/**
 * EUR currency
 */
export const Euro: Story = {
  args: {
    value: 5000,
    onChange: () => {},
    label: 'Investitionsbetrag',
    currency: 'EUR',
    min: 0,
    max: 50000,
  },
};

/**
 * BRL currency
 */
export const BRL: Story = {
  args: {
    value: 25000,
    onChange: () => {},
    label: 'Valor do investimento',
    currency: 'BRL',
    min: 0,
    max: 500000,
  },
};

/**
 * With custom slider max
 */
export const CustomSliderMax: Story = {
  args: {
    value: 1000,
    onChange: () => {},
    label: 'Monthly contribution',
    currency: 'USD',
    min: 0,
    max: 100000,
    sliderMax: 10000,
    step: 100,
  },
};

/**
 * Disabled
 */
export const Disabled: Story = {
  args: {
    value: 5000,
    onChange: () => {},
    label: 'Locked amount',
    currency: 'USD',
    disabled: true,
  },
};

/**
 * All currencies comparison
 */
export const AllCurrencies: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '300px' }}>
      {(['USD', 'EUR', 'BRL', 'GBP'] as const).map((currency) => (
        <CurrencyInput
          key={currency}
          value={10000}
          onChange={() => {}}
          label={`Amount (${currency})`}
          currency={currency}
          min={0}
          max={100000}
        />
      ))}
    </div>
  ),
};
