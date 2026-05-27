/**
 * StrategyCard Storybook Stories
 *
 * Demonstrates all visual states of the StrategyCard component:
 * collapsed/expanded, stable/growth variants, optional sections
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { StrategyCard } from './StrategyCard';

const meta: Meta<typeof StrategyCard> = {
  title: 'UI/StrategyCard',
  component: StrategyCard,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    growthExposure: {
      control: { type: 'range', min: 0, max: 100, step: 5 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof StrategyCard>;

const BASE_STATS = [
  { label: 'Loss chance', value: '~0%' },
  { label: 'Typical return', value: '4–5% APY' },
  { label: 'Bumpiness', value: 'None' },
  { label: 'Risk level', value: 'Very Low' },
];

/**
 * Default stable strategy (Safe Harbor) — collapsed by default
 */
export const DefaultStable: Story = {
  args: {
    strategyId: 'safeHarbor',
    name: 'Safe Harbor',
    badge: '100% Stablecoins',
    tagline: 'Your money stays safe while earning more than savings accounts.',
    growthExposure: 0,
    description:
      'Deposits go into regulated lending protocols that only accept over-collateralized loans. Your stablecoins are always backed by more collateral than owed.',
    allocation: '50% Sky SSR + 30% Aave V3 + 20% Compound V3',
    allocationNote: 'Diversified across top-tier lending protocols for maximum safety.',
    commonUseCase: 'Emergency fund. Money you might need anytime, but want earning while it sits.',
    stats: BASE_STATS,
    showMoreLabel: 'More details',
    showLessLabel: 'Less',
  },
};

/**
 * Growth strategy (Steady Progress) — collapsed
 */
export const DefaultGrowth: Story = {
  args: {
    strategyId: 'steadyProgress',
    name: 'Steady Progress',
    badge: '65% Stablecoins / 35% Growth',
    tagline: 'Beat inflation with a touch of upside.',
    growthExposure: 35,
    description:
      'Most of your capital stays in stablecoins earning yield, while a smaller portion captures growth from blue-chip assets.',
    allocation: '40% Sky SSR + 25% Compound V3 + 35% Lido stETH',
    allocationNote: 'Balanced between stability and growth exposure.',
    commonUseCase:
      'Short-term goals (1–3 years). Building toward a specific purchase or milestone.',
    stats: [
      { label: 'Loss chance', value: '~8%' },
      { label: 'Typical return', value: '6–9% APY' },
      { label: 'Bumpiness', value: 'Low' },
      { label: 'Risk level', value: 'Low-Medium' },
    ],
    showMoreLabel: 'More details',
    showLessLabel: 'Less',
  },
};

/**
 * With warning callout (Wealth Accelerator)
 */
export const WithWarning: Story = {
  args: {
    strategyId: 'wealthAccelerator',
    name: 'Wealth Accelerator',
    badge: '30% Stablecoins / 70% Growth',
    tagline: 'Aggressive growth for long-term wealth building.',
    growthExposure: 70,
    description:
      "Heavy growth allocation with volatile asset exposure. Only for money you won't need for 5+ years.",
    description2:
      'This strategy deliberately accepts higher short-term losses for stronger long-term performance.',
    allocation: '20% Aave V3 + 10% Compound V3 + 50% Lido stETH + 20% Rocket Pool rETH',
    allocationNote: 'Growth-heavy with liquid staking and lending.',
    commonUseCase:
      'Long-term wealth building (5+ years). Retirement planning or generational wealth.',
    warning: "Can drop 25–40% in a bad quarter. Only invest money you truly won't need for years.",
    stats: [
      { label: 'Loss chance', value: '~22%' },
      { label: 'Typical return', value: '10–18% APY' },
      { label: 'Bumpiness', value: 'High' },
      { label: 'Risk level', value: 'High' },
    ],
    showMoreLabel: 'More details',
    showLessLabel: 'Less',
  },
};

/**
 * With warning + access requirements (Full Throttle)
 */
export const WithWarningAndAccess: Story = {
  args: {
    strategyId: 'fullThrottle',
    name: 'Full Throttle',
    badge: '15% Stablecoins / 85% Growth',
    tagline: 'Maximum growth. Maximum risk. For experienced investors only.',
    growthExposure: 85,
    description:
      'Nearly all capital in volatile growth assets. This is the highest-risk, highest-potential-reward strategy available.',
    description2: 'Requires strong conviction and emotional discipline through severe drawdowns.',
    allocation: '10% Aave V3 + 5% Sky SSR + 55% Lido stETH + 30% Rocket Pool rETH',
    allocationNote: 'Concentrated growth exposure with minimal stablecoin buffer.',
    commonUseCase: 'Experienced crypto investors who understand and accept extreme volatility.',
    warning: 'Can drop 40–60% in a severe crash. Only for money you can afford to lose entirely.',
    accessRequirements:
      'Requires passing a risk assessment questionnaire and minimum balance of EUR 5,000.',
    stats: [
      { label: 'Loss chance', value: '~30%' },
      { label: 'Typical return', value: '12–25% APY' },
      { label: 'Bumpiness', value: 'Very High' },
      { label: 'Risk level', value: 'Very High' },
    ],
    showMoreLabel: 'More details',
    showLessLabel: 'Less',
  },
};

/**
 * With description2 + note (Stable Growth)
 */
export const WithDescription2: Story = {
  args: {
    strategyId: 'stableGrowth',
    name: 'Stable Growth',
    badge: '70% Stablecoins / 30% Growth',
    tagline: 'Beat inflation while keeping most of your money safe.',
    growthExposure: 30,
    description:
      'A conservative mix. Most capital in stablecoins earning yield, with a small growth allocation.',
    description2:
      "Designed for people who want more than savings accounts but aren't ready for full crypto exposure.",
    allocation: '40% Sky SSR + 30% Aave V3 + 30% Lido stETH',
    allocationNote: 'Majority stablecoin with measured growth exposure.',
    commonUseCase: 'Beating inflation while maintaining high capital preservation.',
    note: 'Past performance across 44 months of data. Growth component adds variability.',
    stats: [
      { label: 'Loss chance', value: '~5%' },
      { label: 'Typical return', value: '5–8% APY' },
      { label: 'Bumpiness', value: 'Low' },
      { label: 'Risk level', value: 'Low' },
    ],
    showMoreLabel: 'More details',
    showLessLabel: 'Less',
  },
};

/**
 * Mobile viewport (390px)
 */
export const MobileOptimized: Story = {
  args: {
    ...DefaultStable.args,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Storybook dark theme decorator test
 */
export const StorybookThemeTest: Story = {
  args: {
    ...WithWarning.args,
  },
  decorators: [
    (Story) => (
      <div style={{ background: '#1a1a2e', padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
};
