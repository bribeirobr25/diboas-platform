/**
 * GoalCalculator Storybook Stories
 *
 * Demonstrates the goal-based savings calculator wizard.
 * The wizard starts on the goal selection screen and walks users through
 * choosing a goal, setting amounts, selecting risk tier, and viewing results.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { GoalCalculator } from './index';
import type { GoalCalculatorConfig } from './goalCalculatorTypes';

const meta: Meta<typeof GoalCalculator> = {
  title: 'Sections/GoalCalculator',
  component: GoalCalculator,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# GoalCalculator

Interactive wizard that helps users project savings toward a specific goal
(Christmas fund, emergency fund, or vacation). Features goal selection,
deposit configuration, risk tier selection, and scenario-based results.
        `,
      },
    },
  },
  argTypes: {
    enableAnalytics: {
      control: 'boolean',
      description: 'Enable analytics tracking',
    },
  },
};

export default meta;
type Story = StoryObj<typeof GoalCalculator>;

const DEFAULT_CONFIG: GoalCalculatorConfig = {
  content: {
    header: 'Plan your next goal',
    tabs: {
      christmas: 'Christmas Fund',
      emergency: 'Emergency Fund',
      vacation: 'Vacation Fund',
    },
    fields: {
      christmas: { label: 'Target amount', helper: 'How much do you want to save for Christmas?' },
      emergency: { label: 'Monthly expenses', helper: 'Your average monthly living costs' },
      vacation: { label: 'Trip budget', helper: 'How much do you want for your trip?' },
      initialDeposit: { label: 'Initial deposit', helper: 'How much can you start with?' },
      monthlyDeposit: { label: 'Monthly deposit', helper: 'How much can you add each month?' },
      riskTier: { label: 'Risk level' },
    },
    coverage: {
      label: 'Months of coverage',
      months3: '3 months',
      months4: '4 months',
      months6: '6 months',
    },
    timeline: {
      label: 'Timeline',
      months6: '6 months',
      months9: '9 months',
      months12: '12 months',
      months18: '18 months',
    },
    vacationDate: { label: 'Trip date' },
    tiers: {
      careful: 'Careful',
      moderate: 'Moderate',
      aggressive: 'Aggressive',
    },
    cta: 'Run Simulation',
    result: {
      christmasHeadline: 'Your Christmas Fund projection',
      emergencyHeadline: 'Your Emergency Fund projection',
      vacationHeadline: 'Your Vacation Fund projection',
      planLine: 'Based on your inputs, here is your projection.',
      scenarioGood: 'Good scenario',
      scenarioExpected: 'Expected scenario',
      scenarioBad: 'Bad scenario',
      badCaseLoss: 'Potential loss in bad scenario',
      disclaimer: 'Projections are estimates based on historical DeFi yields. Past performance does not guarantee future results.',
      startSmallerToggle: 'Start with a smaller amount',
      startSmallerPrompt: 'Want to start smaller?',
      startSmallerPartial: 'You can begin with a partial deposit and add more later.',
      primaryCta: 'Join the Waitlist',
      secondaryHow: 'How does it work?',
      secondaryRisks: 'What are the risks?',
      demoLink: 'Try the demo',
    },
    helpers: {
      bigCommitment: 'That is a big commitment. Make sure it fits your budget.',
      oneMonthWarning: 'One month may not be enough time to see meaningful growth.',
      christmasRollover: 'Funds roll over if not used by December.',
      vacationDateMinimum: 'Pick a date at least 3 months out for best results.',
    },
    microcopy: 'All projections are illustrative. diBoaS does not guarantee returns.',
  },
  seo: {
    ariaLabel: 'Goal savings calculator',
  },
  analytics: {
    sectionId: 'goal_calculator',
    category: 'engagement',
  },
};

/**
 * Default — Goal selection screen (Step 1)
 */
export const Default: Story = {
  args: {
    config: DEFAULT_CONFIG,
    enableAnalytics: false,
  },
};

/**
 * Mobile Optimized
 */
export const MobileOptimized: Story = {
  args: {
    config: DEFAULT_CONFIG,
    enableAnalytics: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Dark Theme
 */
export const DarkTheme: Story = {
  args: {
    config: DEFAULT_CONFIG,
    enableAnalytics: false,
  },
  decorators: [
    (Story) => (
      <div data-theme="dark" style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-800, #1f2937)' }}>
        <Story />
      </div>
    ),
  ],
};
