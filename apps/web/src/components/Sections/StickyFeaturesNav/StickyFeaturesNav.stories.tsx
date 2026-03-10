/**
 * StickyFeaturesNav Storybook Stories
 *
 * Domain-Driven Design: Stories organized by business scenarios
 * Service Agnostic Abstraction: Demonstrates component factory pattern
 * Performance: Showcases intersection observer and scroll behavior
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { StickyFeaturesNavFactory } from './StickyFeaturesNavFactory';
import { STICKY_FEATURES_NAV_CONFIGS } from '@/config/stickyFeaturesNav';

const meta: Meta<typeof StickyFeaturesNavFactory> = {
  title: 'Sections/StickyFeaturesNav',
  component: StickyFeaturesNavFactory,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# StickyFeaturesNav Component Factory

A sticky navigation section that highlights feature categories as the user scrolls.
Uses intersection observer to track active sections.

## Features
- **Sticky Nav Bar**: Condenses on scroll past threshold
- **Intersection Observer**: Auto-highlights active category
- **Smooth Scrolling**: Click-to-scroll with configurable behavior
- **Analytics**: Tracks nav item clicks and category changes
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default'],
      description: 'Nav variant to display',
    },
    enableAnalytics: {
      control: 'boolean',
      description: 'Enable analytics tracking',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  args: {
    variant: 'default',
    enableAnalytics: false,
  },
};

export default meta;
type Story = StoryObj<typeof StickyFeaturesNavFactory>;

/**
 * Default Sticky Features Nav
 *
 * Full configuration with all 4 feature categories.
 */
export const Default: Story = {
  args: {
    variant: 'default',
    config: STICKY_FEATURES_NAV_CONFIGS.default,
  },
};

/**
 * Custom Scroll Threshold
 *
 * Condenses after a shorter scroll distance.
 */
export const QuickCondense: Story = {
  args: {
    variant: 'default',
    config: {
      ...STICKY_FEATURES_NAV_CONFIGS.default,
      settings: {
        ...STICKY_FEATURES_NAV_CONFIGS.default.settings,
        condenseScrollThreshold: 50,
      },
    },
  },
};

/**
 * With Analytics Enabled
 *
 * Tracks nav interactions. Check browser console for events.
 */
export const WithAnalytics: Story = {
  args: {
    variant: 'default',
    enableAnalytics: true,
    config: STICKY_FEATURES_NAV_CONFIGS.default,
  },
};

/**
 * Mobile Optimized
 *
 * Sticky nav at mobile viewport width.
 */
export const MobileOptimized: Story = {
  args: {
    variant: 'default',
    config: STICKY_FEATURES_NAV_CONFIGS.default,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Tablet Layout
 *
 * Sticky nav at tablet viewport width.
 */
export const TabletLayout: Story = {
  args: {
    variant: 'default',
    config: STICKY_FEATURES_NAV_CONFIGS.default,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

/**
 * Dark Theme
 *
 * Sticky features nav with dark theme applied.
 */
export const DarkTheme: Story = {
  args: {
    variant: 'default',
    config: STICKY_FEATURES_NAV_CONFIGS.default,
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
