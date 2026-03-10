/**
 * StepGuide Storybook Stories
 *
 * Demonstrates the step-by-step guide section component.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { StepGuideSection } from './index';
import type { StepGuideConfig } from './types';

const meta: Meta<typeof StepGuideSection> = {
  title: 'Sections/StepGuide',
  component: StepGuideSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# StepGuide Component Factory

Numbered step-by-step guide for onboarding flows.
Uses the Component Factory Pattern with translation-key content.
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default'],
    },
    enableAnalytics: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StepGuideSection>;

const DEFAULT_CONFIG: StepGuideConfig = {
  content: {
    title: 'Get started in 3 steps',
    steps: [
      { id: 'signup', number: 1, text: 'Create your free account in under 2 minutes' },
      { id: 'fund', number: 2, text: 'Add funds via bank transfer or card' },
      { id: 'earn', number: 3, text: 'Choose a strategy and start earning' },
    ],
  },
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'Getting started guide',
  },
  analytics: {
    sectionId: 'step_guide',
    category: 'onboarding',
  },
};

/**
 * Default — 3 steps
 */
export const Default: Story = {
  args: {
    config: DEFAULT_CONFIG,
    variant: 'default',
  },
};

/**
 * Four steps
 */
export const FourSteps: Story = {
  args: {
    config: {
      ...DEFAULT_CONFIG,
      content: {
        title: 'How it works',
        steps: [
          { id: 'join', number: 1, text: 'Join the waitlist' },
          { id: 'verify', number: 2, text: 'Verify your identity' },
          { id: 'fund', number: 3, text: 'Fund your account' },
          { id: 'grow', number: 4, text: 'Watch your money grow' },
        ],
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

/**
 * Dark Theme
 */
export const DarkTheme: Story = {
  args: {
    config: DEFAULT_CONFIG,
  },
  decorators: [
    (Story) => (
      <div data-theme="dark" style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-800, #1f2937)' }}>
        <Story />
      </div>
    ),
  ],
};
