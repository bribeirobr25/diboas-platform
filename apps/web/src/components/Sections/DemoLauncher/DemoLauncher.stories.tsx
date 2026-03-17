/**
 * DemoLauncher Storybook Stories
 *
 * Demonstrates the demo launch section with a heading, description,
 * primary CTA linking to the interactive demo, and a secondary CTA
 * that opens the PreDream experience.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { DemoLauncher } from './index';

const meta: Meta<typeof DemoLauncher> = {
  title: 'Sections/DemoLauncher',
  component: DemoLauncher,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# DemoLauncher

A full-width section that invites users to explore the interactive demo.
Contains a transition hook, heading, description, and two CTAs:
a primary link to the demo page and a secondary button that opens the
PreDream overlay experience.
        `,
      },
    },
  },
  argTypes: {
    config: {
      control: 'object',
      description: 'Section configuration with content, SEO, and analytics settings',
    },
    enableAnalytics: {
      control: 'boolean',
      description: 'Whether to enable analytics tracking',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DemoLauncher>;

const defaultConfig = {
  content: {
    transitionHook: 'Curious how it actually works?',
    header: 'See diBoaS in Action',
    subtext:
      'Walk through the app yourself. No signup, no fake data — just the real interface with real strategies.',
    ctaPrimary: 'Launch Interactive Demo',
    ctaSecondary: 'Quick Preview',
  },
  seo: {
    headingLevel: 'h2' as const,
    ariaLabel: 'Interactive demo section',
  },
  analytics: {
    sectionId: 'demo-section-b2c',
    category: 'landing-b2c',
  },
} as const;

/**
 * Default — full demo launcher with transition hook and both CTAs
 */
export const Default: Story = {
  args: {
    config: defaultConfig,
    enableAnalytics: false,
  },
};

/**
 * Without transition hook — no leading question above the heading
 */
export const WithoutTransitionHook: Story = {
  args: {
    config: {
      ...defaultConfig,
      content: {
        ...defaultConfig.content,
        transitionHook: undefined,
      },
    },
    enableAnalytics: false,
  },
};

/**
 * Mobile viewport
 */
export const Mobile: Story = {
  args: {
    config: defaultConfig,
    enableAnalytics: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
