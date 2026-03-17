/**
 * MidPageCTA Storybook Stories
 *
 * Demonstrates the mid-page call-to-action banner with heading and CTA link.
 * Supports B2C and B2B messaging variants.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { MidPageCTA } from './index';

const meta: Meta<typeof MidPageCTA> = {
  title: 'Sections/MidPageCTA',
  component: MidPageCTA,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# MidPageCTA

A full-width call-to-action banner with a heading and CTA link.
Used to break up long pages and drive users toward the waitlist.
Supports B2C (personal) and B2B (business) messaging via i18n translation prefixes.
        `,
      },
    },
  },
  argTypes: {
    translationPrefix: {
      control: 'text',
      description: 'i18n translation prefix (e.g., "landing-b2c.midPageCta")',
    },
    href: {
      control: 'text',
      description: 'CTA link destination',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible label for the section',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MidPageCTA>;

/**
 * Default — B2C personal banking variant
 */
export const Default: Story = {
  args: {
    translationPrefix: 'landing-b2c.midPageCta',
    href: '#waitlist',
    ariaLabel: 'Call to action',
  },
};

/**
 * B2B — Business-focused messaging
 */
export const B2B: Story = {
  args: {
    translationPrefix: 'landing-b2b.midPageCta',
    href: '#waitlist',
    ariaLabel: 'Business call to action',
  },
};

/**
 * Mobile Optimized
 */
export const MobileOptimized: Story = {
  args: {
    translationPrefix: 'landing-b2c.midPageCta',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
