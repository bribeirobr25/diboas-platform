/**
 * FeeTable Storybook Stories
 *
 * Demonstrates the responsive fee comparison table.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { FeeTable } from './FeeTable';
import type { FeeTableConfig } from '@/config/feeTable';

const meta: Meta<typeof FeeTable> = {
  title: 'Sections/FeeTable',
  component: FeeTable,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# FeeTable Component

Responsive fee comparison table showing diBoaS vs competitor pricing.
Renders as a table on desktop and stacked cards on mobile.
Highlights free actions with green styling.
        `,
      },
    },
  },
  argTypes: {
    enableAnalytics: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FeeTable>;

const DEFAULT_CONFIG: FeeTableConfig = {
  content: {
    title: 'Your money. Your rules. No surprises.',
    subtitle: 'See exactly what you pay. Here\'s everything — no fine print.',
    disclaimer: 'Projections based on publicly available competitor pricing as of February 2026.',
    example: 'Buying $100 of assets is free with diBoaS. Selling costs $0.39. Elsewhere, each trade costs $1.50–$2.50.',
    headers: {
      action: 'What you do',
      diboas: 'With diBoaS',
      competitors: 'Typical apps',
      difference: 'The difference',
    },
    rows: [
      { id: 'account', action: 'Keep your account', diboas: 'Free forever', competitors: '$12–25/month', difference: 'You save $150+/year', isFree: true },
      { id: 'add', action: 'Add money', diboas: '0.48%', competitors: '1–3%', difference: '2–6× cheaper' },
      { id: 'send', action: 'Send to anyone', diboas: 'FREE, instant, worldwide', competitors: 'Free locally, $5–50 internationally', difference: 'Send globally, instantly, free', isFree: true },
      { id: 'buy', action: 'Buy Stocks, ETFs, Crypto, Gold*', diboas: 'FREE', competitors: '1.5–2.5% + spreads', difference: 'You keep everything', isFree: true },
      { id: 'sell', action: 'Sell investments', diboas: '0.39%', competitors: '1.5–2.5% + spreads', difference: '4–6× cheaper' },
      { id: 'swap', action: 'Swap transactions', diboas: 'FREE', competitors: '0.5–2%', difference: 'You keep everything', isFree: true },
      { id: 'strategy-start', action: 'Grow with strategies', diboas: 'Free to start, 0.39% when you stop', competitors: 'Not available', difference: 'Earn while you sleep' },
      { id: 'cashout', action: 'Cash out', diboas: '0.48% — Instant', competitors: '1–3% + delays', difference: '2–6× cheaper' },
    ],
    footerLine: 'No monthly fees. No minimum balance. No hidden spreads. No surprises.',
  },
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'Fee comparison table',
  },
  analytics: {
    sectionId: 'fee_table',
    category: 'pricing',
  },
} as const;

/**
 * Default — full fee table
 */
export const Default: Story = {
  args: {
    config: DEFAULT_CONFIG,
    enableAnalytics: false,
  },
};

/**
 * Mobile — stacked cards layout
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
 * Tablet layout
 */
export const TabletLayout: Story = {
  args: {
    config: DEFAULT_CONFIG,
  },
  parameters: {
    viewport: { defaultViewport: 'tablet' },
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
