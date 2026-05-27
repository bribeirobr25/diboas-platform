/**
 * TwoWorldsSection Storybook Stories
 *
 * Demonstrates the two-card comparison section.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { TwoWorldsSection } from './TwoWorldsSection';
import type { TwoWorldsSectionConfig } from '@/config/twoWorldsSection';

const meta: Meta<typeof TwoWorldsSection> = {
  title: 'Sections/TwoWorldsSection',
  component: TwoWorldsSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# TwoWorldsSection

Side-by-side comparison of two concepts (e.g., Personal vs Business,
Traditional vs DeFi) with CTA buttons and optional images.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TwoWorldsSection>;

const DEFAULT_CONFIG: TwoWorldsSectionConfig = {
  content: {
    header: 'One platform. Two worlds.',
    cardA: {
      headline: 'For You',
      body: 'Save, invest, and grow your personal wealth with zero monthly fees and instant global transfers.',
      cta: 'Personal Banking',
      ctaHref: '#personal',
    },
    cardB: {
      headline: 'For Your Business',
      body: 'Cut payment processing fees, earn yields on idle cash, and streamline treasury management.',
      cta: 'Business Solutions',
      ctaHref: '#business',
    },
  },
  seo: {
    ariaLabel: 'Personal and business solutions',
  },
  analytics: {
    sectionId: 'two_worlds',
    category: 'navigation',
  },
} as const;

/**
 * Default
 */
export const Default: Story = {
  args: {
    config: DEFAULT_CONFIG,
  },
};

/**
 * Mobile — stacked cards
 */
export const MobileOptimized: Story = {
  args: {
    config: DEFAULT_CONFIG,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

/**
 * Dark Theme
 */
export const DarkTheme: Story = {
  args: {
    config: DEFAULT_CONFIG,
  },
  decorators: [
    (Story) => (
      <div
        data-theme="dark"
        style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-800, #1f2937)' }}
      >
        <Story />
      </div>
    ),
  ],
};
