/**
 * Button Storybook Stories
 *
 * Demonstrates all button variants, sizes, and states from @diboas/ui.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { Button } from '@diboas/ui';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: `
# Button

Core button component from \`@diboas/ui\` design system.
WCAG 2.1 AA compliant with loading states, analytics tracking, and UTM support.
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'link', 'gradient', 'destructive'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'lg', 'xl', 'icon'],
    },
    loading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

/**
 * Primary (default)
 */
export const Primary: Story = {
  args: {
    children: 'Get Started',
    variant: 'primary',
  },
};

/**
 * Secondary
 */
export const Secondary: Story = {
  args: {
    children: 'Learn More',
    variant: 'secondary',
  },
};

/**
 * Outline
 */
export const Outline: Story = {
  args: {
    children: 'View Details',
    variant: 'outline',
  },
};

/**
 * Ghost
 */
export const Ghost: Story = {
  args: {
    children: 'Cancel',
    variant: 'ghost',
  },
};

/**
 * Link
 */
export const Link: Story = {
  args: {
    children: 'Read more',
    variant: 'link',
  },
};

/**
 * Gradient
 */
export const Gradient: Story = {
  args: {
    children: 'Join Waitlist',
    variant: 'gradient',
  },
};

/**
 * Destructive
 */
export const Destructive: Story = {
  args: {
    children: 'Delete Account',
    variant: 'destructive',
  },
};

/**
 * All sizes
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    children: 'Submit',
    loading: true,
    loadingText: 'Submitting...',
  },
};

/**
 * Disabled
 */
export const Disabled: Story = {
  args: {
    children: 'Unavailable',
    disabled: true,
  },
};

/**
 * With tracking
 */
export const WithTracking: Story = {
  args: {
    children: 'Sign Up',
    variant: 'primary',
    trackingEvent: 'signup_click',
    trackingProps: { location: 'hero' },
    trackable: true,
  },
};
