/**
 * WaitlistSection Storybook Stories
 *
 * Demonstrates the waitlist signup section with A/B variant rendering.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { WaitlistSection } from './index';

const meta: Meta<typeof WaitlistSection> = {
  title: 'Sections/WaitlistSection',
  component: WaitlistSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# WaitlistSection

Waitlist signup section that conditionally renders Version A or B based on
waitlist stats. Includes email input, GDPR consent, benefits list, and
social proof indicators.
        `,
      },
    },
  },
  argTypes: {
    enableAnalytics: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof WaitlistSection>;

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
      headline: 'Join the Movement',
      subheadline: 'Be among the first to experience the future of finance.',
      backgroundColor: '#f0f9ff',
      belowCta: 'No credit card required.',
    },
    enableAnalytics: false,
  },
};

/**
 * Hidden benefits
 */
export const HiddenBenefits: Story = {
  args: {
    config: {
      hideBenefits: true,
      hideNoSpam: true,
    },
  },
};

/**
 * Mobile Optimized
 */
export const MobileOptimized: Story = {
  args: {},
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
