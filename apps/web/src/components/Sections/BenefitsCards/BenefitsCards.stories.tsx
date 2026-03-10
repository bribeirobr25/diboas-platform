/**
 * BenefitsCards Storybook Stories
 *
 * Demonstrates the benefits cards factory component with various configurations.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { BenefitsCardsSection } from './index';
import type { BenefitsCardsConfig } from './types';

const meta: Meta<typeof BenefitsCardsSection> = {
  title: 'Sections/BenefitsCards',
  component: BenefitsCardsSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# BenefitsCards Component Factory

Grid of benefit/feature cards with icon, title, and description.
Uses the Component Factory Pattern with translation-key-driven content.
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default'],
      description: 'Card layout variant',
    },
    enableAnalytics: {
      control: 'boolean',
      description: 'Enable analytics tracking',
    },
    priority: {
      control: 'boolean',
      description: 'Priority loading for above-the-fold',
    },
  },
};

export default meta;
type Story = StoryObj<typeof BenefitsCardsSection>;

const DEFAULT_CONFIG: BenefitsCardsConfig = {
  section: {
    title: 'Why choose diBoaS?',
    description: 'Everything you need in one platform.',
  },
  cards: [
    { id: 'security', icon: '🔒', iconAlt: 'Lock', title: 'Bank-Grade Security', description: 'Your assets are protected with institutional-grade security measures.' },
    { id: 'fees', icon: '💰', iconAlt: 'Money', title: 'Lowest Fees', description: 'Save up to 6× compared to traditional apps.' },
    { id: 'speed', icon: '⚡', iconAlt: 'Lightning', title: 'Instant Transfers', description: 'Send money anywhere in the world, instantly and free.' },
    { id: 'defi', icon: '📈', iconAlt: 'Chart', title: 'DeFi Strategies', description: 'Earn yields on your idle cash with automated strategies.' },
  ],
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'Platform benefits',
  },
  analytics: {
    sectionId: 'benefits_cards',
    category: 'engagement',
  },
};

/**
 * Default — 4 benefit cards
 */
export const Default: Story = {
  args: {
    config: DEFAULT_CONFIG,
    variant: 'default',
    enableAnalytics: false,
  },
};

/**
 * Two cards
 */
export const TwoCards: Story = {
  args: {
    config: {
      ...DEFAULT_CONFIG,
      cards: DEFAULT_CONFIG.cards.slice(0, 2),
    },
    variant: 'default',
  },
};

/**
 * With custom background
 */
export const WithBackground: Story = {
  args: {
    config: {
      ...DEFAULT_CONFIG,
      section: {
        ...DEFAULT_CONFIG.section,
        backgroundColor: '#f8fafc',
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
