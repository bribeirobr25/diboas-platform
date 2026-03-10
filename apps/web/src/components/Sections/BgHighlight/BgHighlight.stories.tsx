/**
 * BgHighlight Storybook Stories
 *
 * Demonstrates the background highlight section with image and content overlay.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { BgHighlightSection } from './index';
import type { BgHighlightConfig } from './types';

const meta: Meta<typeof BgHighlightSection> = {
  title: 'Sections/BgHighlight',
  component: BgHighlightSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# BgHighlight Component Factory

Full-width section with background image and content overlay.
Supports CTA button and accessibility labels.
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default'],
      description: 'Layout variant',
    },
    enableAnalytics: {
      control: 'boolean',
      description: 'Enable analytics tracking',
    },
  },
};

export default meta;
type Story = StoryObj<typeof BgHighlightSection>;

const DEFAULT_CONFIG: BgHighlightConfig = {
  backgroundImage: {
    src: '/images/hero-bg.webp',
    alt: 'Financial dashboard background',
  },
  content: {
    title: 'The Future of Finance',
    description: 'Banking, investing, and DeFi strategies — all in one platform.',
    ctaText: 'Join the Waitlist',
    ctaHref: '#waitlist',
  },
  seo: {
    ariaLabel: 'Highlight section',
  },
  analytics: {
    sectionId: 'bg_highlight',
    category: 'engagement',
  },
};

/**
 * Default
 */
export const Default: Story = {
  args: {
    config: DEFAULT_CONFIG,
    variant: 'default',
  },
};

/**
 * Without CTA
 */
export const WithoutCTA: Story = {
  args: {
    config: {
      ...DEFAULT_CONFIG,
      content: {
        title: 'Built for Everyone',
        description: 'From first-time savers to experienced investors.',
      },
    },
  },
};

/**
 * Mobile Optimized
 */
export const MobileOptimized: Story = {
  args: {
    config: DEFAULT_CONFIG,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
