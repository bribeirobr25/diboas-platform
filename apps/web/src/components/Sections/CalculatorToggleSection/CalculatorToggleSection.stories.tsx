/**
 * CalculatorToggleSection Storybook Stories
 *
 * Demonstrates the tabbed calculator that switches between cashflow and treasury variants.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { CalculatorToggleSection } from './CalculatorToggleSection';
import type { CalculatorFactoryConfig } from '@/config/calculatorFactory';

const meta: Meta<typeof CalculatorToggleSection> = {
  title: 'Sections/CalculatorToggleSection',
  component: CalculatorToggleSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# CalculatorToggleSection

Tab-based switcher between **Cashflow** and **Treasury** calculator variants.
Uses WAI-ARIA tablist/tab/tabpanel pattern with unique IDs via \`useId()\`.
        `,
      },
    },
  },
  argTypes: {
    enableAnalytics: {
      control: 'boolean',
      description: 'Enable analytics tracking',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CalculatorToggleSection>;

const CASHFLOW_CONFIG: CalculatorFactoryConfig = {
  variant: 'cashflow',
  content: {
    header: 'How much could you save?',
    transitionHook: 'Your payment fees are eating your margins.',
    todayTitle: 'Today',
    tomorrowTitle: 'Tomorrow with diBoaS',
    fields: { field1: 'Monthly revenue', field2: 'Current processing fee' },
    periodToggle: { month: '1 month', sixMonths: '6 months', year: '1 year' },
    results: {
      step1Label: 'You lose to fees',
      savingsLabel: 'You save with diBoaS',
      step2Label: 'Grow your savings',
      scenarios: { conservative: 'Conservative (4%)', historical: 'Historical (7%)', optimistic: 'Optimistic (10%)' },
    },
    sliderLabel: 'Expected return',
    customRateTemplate: 'At {rate}%: {amount}',
    cta: 'Start saving now',
    ctaHref: '#waitlist',
    disclaimer: 'Projections based on historical DeFi yields.',
  },
  defaults: { en: { field1: 50000, field2: 2.5 }, de: { field1: 40000, field2: 2.0 }, es: { field1: 40000, field2: 2.0 }, 'pt-BR': { field1: 100000, field2: 3.0 } },
  seo: { ariaLabel: 'Payment savings calculator' },
  analytics: { trackingPrefix: 'calculator_cashflow', enabled: false },
};

const TREASURY_CONFIG: CalculatorFactoryConfig = {
  variant: 'treasury',
  content: {
    header: 'What could your idle cash earn?',
    transitionHook: 'Your treasury is sitting still.',
    todayTitle: 'Today',
    tomorrowTitle: 'Tomorrow with diBoaS',
    fields: { field1: 'Cash reserves', field2: 'Current bank rate' },
    periodToggle: { month: '1 month', sixMonths: '6 months', year: '1 year' },
    results: {
      step1Label: 'Bank gives you',
      step2Label: 'diBoaS gives you',
      scenarios: { conservative: 'Conservative (4%)', historical: 'Historical (7%)', optimistic: 'Optimistic (10%)' },
    },
    sliderLabel: 'Expected return',
    customRateTemplate: 'At {rate}%: {amount}',
    cta: 'Grow your treasury',
    ctaHref: '#waitlist',
    disclaimer: 'Projections based on historical DeFi yields.',
  },
  defaults: { en: { field1: 500000, field2: 0.5 }, de: { field1: 400000, field2: 0.3 }, es: { field1: 400000, field2: 0.3 }, 'pt-BR': { field1: 1000000, field2: 1.0 } },
  seo: { ariaLabel: 'Treasury growth calculator' },
  analytics: { trackingPrefix: 'calculator_treasury', enabled: false },
};

/**
 * Default — starts on cashflow tab
 */
export const Default: Story = {
  args: {
    cashflowConfig: CASHFLOW_CONFIG,
    treasuryConfig: TREASURY_CONFIG,
    enableAnalytics: false,
  },
};

/**
 * Mobile Optimized
 */
export const MobileOptimized: Story = {
  args: {
    cashflowConfig: CASHFLOW_CONFIG,
    treasuryConfig: TREASURY_CONFIG,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Dark Theme
 */
export const DarkTheme: Story = {
  args: {
    cashflowConfig: CASHFLOW_CONFIG,
    treasuryConfig: TREASURY_CONFIG,
  },
  decorators: [
    (Story) => (
      <div data-theme="dark" style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-800, #1f2937)' }}>
        <Story />
      </div>
    ),
  ],
};
