/**
 * ScenarioCards Storybook Stories
 *
 * Demonstrates real-life scenario cards with background images and cost comparisons.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { ScenarioCards } from './ScenarioCards';
import type { ScenarioCardsConfig } from '@/config/scenarioCards';

const meta: Meta<typeof ScenarioCards> = {
  title: 'Sections/ScenarioCards',
  component: ScenarioCards,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# ScenarioCards

Real-life scenario cards section showing relatable financial situations.
Each card has a background image, title, description, and optional cost comparison.
Used on the B2C landing page.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ScenarioCards>;

const DEFAULT_CONFIG: ScenarioCardsConfig = {
  section: {
    title: 'Real People. Real Moments.',
    transitionHook: 'Your money should work as hard as you do.',
    clarificationLine: 'These are the moments diBoaS was built for.',
    footnote: 'Based on average user scenarios.',
  },
  cards: [
    {
      id: 'freelancer',
      title: 'The freelancer who gets paid late',
      description: 'You finished the project. The invoice is out. But the money won\'t land for 30 days.',
      backgroundImage: '/assets/images/morning-pause.avif',
      imageAlt: 'Freelancer working on laptop',
      costComparison: 'Bank wire: $25 + 3 days. diBoaS: $0 + instant.',
    },
    {
      id: 'parent',
      title: 'The parent saving for college',
      description: 'You set aside $200 every month. In a savings account, it barely grows.',
      backgroundImage: '/assets/images/saved-through-time.avif',
      imageAlt: 'Parent with child',
    },
    {
      id: 'traveler',
      title: 'The traveler who hates FX fees',
      description: 'Every time you swipe abroad, 3% vanishes. On a $5,000 trip, that\'s $150 gone.',
      backgroundImage: '/assets/images/seamless-exchange.avif',
      imageAlt: 'Traveler at airport',
      costComparison: 'Traditional bank: 3% FX markup. diBoaS: real rate.',
    },
  ],
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'Real-life financial scenarios',
  },
  analytics: {
    sectionId: 'scenarios',
    category: 'engagement',
  },
} as const;

/**
 * Default — 3 scenario cards
 */
export const Default: Story = {
  args: {
    config: DEFAULT_CONFIG,
  },
};

/**
 * Single card
 */
export const SingleCard: Story = {
  args: {
    config: {
      ...DEFAULT_CONFIG,
      cards: [DEFAULT_CONFIG.cards[0]],
    },
  },
};

/**
 * Without transition hook
 */
export const WithoutTransitionHook: Story = {
  args: {
    config: {
      ...DEFAULT_CONFIG,
      section: {
        ...DEFAULT_CONFIG.section,
        transitionHook: undefined,
        clarificationLine: undefined,
        footnote: undefined,
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
