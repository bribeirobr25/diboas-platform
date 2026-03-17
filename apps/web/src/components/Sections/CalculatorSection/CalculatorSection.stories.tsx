/**
 * CalculatorSection Storybook Stories
 *
 * Demonstrates the FutureYouCalculator landing page section wrapper.
 * Shows compound growth comparison for anonymous visitors.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { CalculatorSection } from './index';

const meta: Meta<typeof CalculatorSection> = {
  title: 'Sections/CalculatorSection',
  component: CalculatorSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# CalculatorSection

Landing page section wrapper for the FutureYouCalculator.
Shows compound growth comparison for anonymous visitors with
locale-aware currency formatting and a CTA that scrolls to the waitlist.
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
type Story = StoryObj<typeof CalculatorSection>;

/**
 * Default
 */
export const Default: Story = {
  args: {
    enableAnalytics: false,
  },
};

/**
 * With custom config
 */
export const CustomConfig: Story = {
  args: {
    config: {
      sectionId: 'calculator-section-custom',
      backgroundColor: '#f8fafc',
    },
    enableAnalytics: false,
  },
};

/**
 * Mobile Optimized
 */
export const MobileOptimized: Story = {
  args: {
    enableAnalytics: false,
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
    enableAnalytics: false,
  },
  decorators: [
    (Story) => (
      <div data-theme="dark" style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-800, #1f2937)' }}>
        <Story />
      </div>
    ),
  ],
};
