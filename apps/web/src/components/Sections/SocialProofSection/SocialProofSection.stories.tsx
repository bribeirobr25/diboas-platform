/**
 * SocialProofSection Storybook Stories
 *
 * Demonstrates the social proof stats section.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { SocialProofSection } from './SocialProofSection';

const meta: Meta<typeof SocialProofSection> = {
  title: 'Sections/SocialProofSection',
  component: SocialProofSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# SocialProofSection

Displays waitlist statistics (signups, referrals, etc.) as social proof.
Uses \`useWaitlistStats\` hook for live data and sessionStorage caching.
        `,
      },
    },
  },
  argTypes: {
    namespace: {
      control: 'text',
      description: 'Translation namespace for stat labels',
    },
    backgroundColor: {
      control: 'color',
      description: 'Custom background color',
    },
    enableAnalytics: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SocialProofSection>;

/**
 * Default
 */
export const Default: Story = {
  args: {
    enableAnalytics: false,
  },
};

/**
 * With custom namespace
 */
export const B2BNamespace: Story = {
  args: {
    namespace: 'landing-b2b.socialProof',
    enableAnalytics: false,
  },
};

/**
 * With custom background
 */
export const CustomBackground: Story = {
  args: {
    backgroundColor: '#f0f9ff',
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
