/**
 * PageHeroSection Storybook Stories
 *
 * Demonstrates the simple page hero with headline and subheadlines.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { PageHeroSection } from './PageHeroSection';

const meta: Meta<typeof PageHeroSection> = {
  title: 'Sections/PageHeroSection',
  component: PageHeroSection,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    align: {
      control: 'select',
      options: ['center', 'left'],
      description: 'Content alignment',
    },
    headline: {
      control: 'text',
    },
    subheadline: {
      control: 'text',
    },
    subheadline2: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PageHeroSection>;

/**
 * Centered (default)
 */
export const Centered: Story = {
  args: {
    headline: 'Security at diBoaS',
    subheadline: 'Your money is protected by institutional-grade security.',
    subheadline2: 'Multi-sig wallets. Over-collateralized protocols. 24/7 monitoring.',
    align: 'center',
  },
};

/**
 * Left aligned
 */
export const LeftAligned: Story = {
  args: {
    headline: 'About diBoaS',
    subheadline: 'The digital bank of autonomous services.',
    align: 'left',
  },
};

/**
 * Headline only
 */
export const HeadlineOnly: Story = {
  args: {
    headline: 'Frequently Asked Questions',
  },
};

/**
 * With all subheadlines
 */
export const FullContent: Story = {
  args: {
    headline: 'Learn How It Works',
    subheadline: 'Banking, investing, and DeFi strategies made simple.',
    subheadline2: 'No experience needed. Start with as little as $10.',
  },
};

/**
 * Mobile Optimized
 */
export const MobileOptimized: Story = {
  args: {
    headline: 'Security at diBoaS',
    subheadline: 'Your money is protected by institutional-grade security.',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
