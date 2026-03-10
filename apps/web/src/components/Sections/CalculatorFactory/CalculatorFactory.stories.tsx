/**
 * CalculatorFactory Storybook Stories
 *
 * Domain-Driven Design: Stories organized by calculator variant scenarios
 * Service Agnostic Abstraction: Demonstrates dual-variant calculator pattern
 * Performance: Showcases locale-aware currency formatting
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { CalculatorFactory } from './CalculatorFactory';
import type { CalculatorFactoryConfig } from '@/config/calculatorFactory';

const meta: Meta<typeof CalculatorFactory> = {
  title: 'Sections/CalculatorFactory',
  component: CalculatorFactory,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# CalculatorFactory Component

Interactive financial calculator with two variants: **cashflow** (business payment savings)
and **treasury** (idle cash growth). Features locale-aware currency formatting,
period toggles, scenario comparison cards, and an adjustable rate slider.

## Variants
- **Cashflow**: Calculates savings from reduced payment processing fees
- **Treasury**: Projects growth on idle business cash via DeFi strategies
        `,
      },
    },
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    enableAnalytics: {
      control: 'boolean',
      description: 'Enable analytics tracking',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CalculatorFactory>;

const CASHFLOW_CONFIG: CalculatorFactoryConfig = {
  variant: 'cashflow',
  content: {
    header: 'How much could you save?',
    transitionHook: 'Your payment fees are eating your margins. See what you keep with diBoaS.',
    todayTitle: 'Today',
    tomorrowTitle: 'Tomorrow with diBoaS',
    fields: {
      field1: 'Monthly revenue',
      field2: 'Current processing fee',
    },
    periodToggle: {
      month: '1 month',
      sixMonths: '6 months',
      year: '1 year',
    },
    results: {
      step1Label: 'You lose to fees',
      savingsLabel: 'You save with diBoaS',
      step2Label: 'Grow your savings',
      scenarios: {
        conservative: 'Conservative (4%)',
        historical: 'Historical (7%)',
        optimistic: 'Optimistic (10%)',
      },
    },
    sliderLabel: 'Expected return',
    customRateTemplate: 'At {rate}%: {amount}',
    cta: 'Start saving now',
    ctaHref: '#waitlist',
    disclaimer: 'Projections based on historical DeFi yields. Past performance does not guarantee future results.',
  },
  defaults: {
    en: { field1: 50000, field2: 2.5 },
    de: { field1: 40000, field2: 2.0 },
    es: { field1: 40000, field2: 2.0 },
    'pt-BR': { field1: 100000, field2: 3.0 },
  },
  seo: {
    ariaLabel: 'Payment savings calculator',
  },
  analytics: {
    trackingPrefix: 'calculator_cashflow',
    enabled: false,
  },
};

const TREASURY_CONFIG: CalculatorFactoryConfig = {
  variant: 'treasury',
  content: {
    header: 'What could your idle cash earn?',
    transitionHook: 'Your treasury is sitting still. Put it to work.',
    todayTitle: 'Today',
    tomorrowTitle: 'Tomorrow with diBoaS',
    fields: {
      field1: 'Cash reserves',
      field2: 'Current bank rate',
    },
    periodToggle: {
      month: '1 month',
      sixMonths: '6 months',
      year: '1 year',
    },
    results: {
      step1Label: 'Bank gives you',
      step2Label: 'diBoaS gives you',
      scenarios: {
        conservative: 'Conservative (4%)',
        historical: 'Historical (7%)',
        optimistic: 'Optimistic (10%)',
      },
    },
    sliderLabel: 'Expected return',
    customRateTemplate: 'At {rate}%: {amount}',
    cta: 'Grow your treasury',
    ctaHref: '#waitlist',
    disclaimer: 'Projections based on historical DeFi yields. Past performance does not guarantee future results.',
  },
  defaults: {
    en: { field1: 500000, field2: 0.5 },
    de: { field1: 400000, field2: 0.3 },
    es: { field1: 400000, field2: 0.3 },
    'pt-BR': { field1: 1000000, field2: 1.0 },
  },
  seo: {
    ariaLabel: 'Treasury growth calculator',
  },
  analytics: {
    trackingPrefix: 'calculator_treasury',
    enabled: false,
  },
};

/**
 * Cashflow Variant
 *
 * Calculates savings from reduced payment processing fees.
 */
export const Cashflow: Story = {
  args: {
    config: CASHFLOW_CONFIG,
  },
};

/**
 * Treasury Variant
 *
 * Projects growth on idle business cash.
 */
export const Treasury: Story = {
  args: {
    config: TREASURY_CONFIG,
  },
};

/**
 * Mobile — Cashflow
 *
 * Cashflow calculator at mobile viewport width.
 */
export const MobileCashflow: Story = {
  args: {
    config: CASHFLOW_CONFIG,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Mobile — Treasury
 *
 * Treasury calculator at mobile viewport width.
 */
export const MobileTreasury: Story = {
  args: {
    config: TREASURY_CONFIG,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Dark Theme
 *
 * Calculator with dark theme applied.
 */
export const DarkTheme: Story = {
  args: {
    config: CASHFLOW_CONFIG,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  decorators: [
    (Story) => (
      <div data-theme="dark" style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-800, #1f2937)' }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * All Variants Comparison
 *
 * Side-by-side comparison of both calculator variants.
 */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3 style={{ margin: '0 0 1rem 0', padding: '0 1rem' }}>Cashflow Variant</h3>
        <CalculatorFactory config={CASHFLOW_CONFIG} />
      </div>
      <div>
        <h3 style={{ margin: '0 0 1rem 0', padding: '0 1rem' }}>Treasury Variant</h3>
        <CalculatorFactory config={TREASURY_CONFIG} />
      </div>
    </div>
  ),
};
