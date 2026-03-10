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
 * B2B variant — business-specific messaging and counters
 */
export const B2BVariant: Story = {
  args: {
    config: {
      sectionId: 'waitlist-section-b2b',
      backgroundColor: 'var(--section-bg-brand)',
      headline: 'landing-b2b.waitlist.header',
      subheadline: 'landing-b2b.waitlist.description',
      hideBenefits: true,
      hideNoSpam: true,
      namespace: 'landing-b2b.waitlist',
      confirmationNamespace: 'landing-b2b.waitlistSuccess',
      source: 'landing_b2b',
    },
    enableAnalytics: false,
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
