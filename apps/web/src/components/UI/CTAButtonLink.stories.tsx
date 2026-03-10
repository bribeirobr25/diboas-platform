/**
 * CTAButtonLink Storybook Stories
 *
 * Demonstrates the CTA button with Link/anchor wrapping behavior.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { CTAButtonLink } from './CTAButtonLink';

const meta: Meta<typeof CTAButtonLink> = {
  title: 'UI/CTAButtonLink',
  component: CTAButtonLink,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'outline'],
      description: 'Button variant from design system',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    target: {
      control: 'select',
      options: ['_self', '_blank'],
      description: 'Link target behavior',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CTAButtonLink>;

/**
 * Primary CTA — internal link
 */
export const Primary: Story = {
  args: {
    href: '#waitlist',
    children: 'Join the Waitlist',
    variant: 'primary',
    size: 'lg',
  },
};

/**
 * Secondary CTA
 */
export const Secondary: Story = {
  args: {
    href: '#learn-more',
    children: 'Learn More',
    variant: 'secondary',
    size: 'lg',
  },
};

/**
 * External link (opens in new tab)
 */
export const ExternalLink: Story = {
  args: {
    href: 'https://example.com',
    children: 'View Documentation',
    target: '_blank',
    variant: 'primary',
    size: 'lg',
  },
};

/**
 * Small size
 */
export const Small: Story = {
  args: {
    href: '#cta',
    children: 'Get Started',
    size: 'sm',
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    href: '#cta',
    children: 'Coming Soon',
    disabled: true,
  },
};

/**
 * With aria-label
 */
export const WithAriaLabel: Story = {
  args: {
    href: '#waitlist',
    children: 'Join Now',
    'aria-label': 'Join the diBoaS waitlist',
  },
};
