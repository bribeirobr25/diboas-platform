/**
 * MinimalNavigation Storybook Stories
 *
 * Demonstrates the minimal navigation bar for landing pages.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import MinimalNavigation from './MinimalNavigation';

const meta: Meta<typeof MinimalNavigation> = {
  title: 'Layout/MinimalNavigation',
  component: MinimalNavigation,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# MinimalNavigation

Simplified navigation for landing pages with logo, nav links,
language switcher, CTA button, and responsive hamburger menu.
No props — uses internal configuration.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MinimalNavigation>;

/**
 * Default desktop view
 */
export const Default: Story = {};

/**
 * Mobile view with hamburger menu
 */
export const MobileView: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

/**
 * Tablet view
 */
export const TabletView: Story = {
  parameters: {
    viewport: { defaultViewport: 'ipad' },
  },
};
