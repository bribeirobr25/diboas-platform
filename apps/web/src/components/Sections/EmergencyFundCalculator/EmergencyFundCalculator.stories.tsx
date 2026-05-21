/**
 * EmergencyFundCalculator Storybook Stories (Phase 3B PR-3B, 2026-05-18).
 *
 * Tier-2 tool that estimates time-to-funded based on monthly expenses, savings
 * rate, and locale-specific inflation/savings APY. Component takes no props —
 * state is internal `useState` seeded from `EMERGENCY_FUND_DEFAULTS` per locale.
 * Locale switcher in the toolbar drives both i18n copy AND the seeded defaults.
 *
 * Stories per plan §4.5 — 3 stories:
 *   1. Default — en-locale baseline ($5,000 monthly expenses)
 *   2. NonUSDLocale — pt-BR baseline (R$ expenses, BCB savings rate)
 *   3. ZeroExpenses — edge: reviewer drives the input to 0 (no rendering math)
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { EmergencyFundCalculator } from './EmergencyFundCalculator';

const meta: Meta<typeof EmergencyFundCalculator> = {
  title: 'Sections/EmergencyFundCalculator',
  component: EmergencyFundCalculator,
  parameters: {
    docs: {
      description: {
        component: `
# EmergencyFundCalculator

Tier-2 calculator for "how many months until my emergency fund is ready?".
Reads locale-specific defaults from \`EMERGENCY_FUND_DEFAULTS\`. Output compares
bank-rate vs digital-dollar (Historical 10%) timelines.

**No props** — state is internal; locale flows via \`useLocale()\` from the
LocaleProvider in the i18n decorator.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmergencyFundCalculator>;

/** Default — en-locale baseline ($5,000 monthly expenses, US savings APY). */
export const Default: Story = {};

/** Non-USD locale — pt-BR (Brazilian Real expenses, BCB savings APY ~6.83%). */
export const NonUSDLocale: Story = {
  parameters: {
    docs: {
      description: {
        story: 'pt-BR locale exercises BRL formatting and the BCB savings-rate comparison.',
      },
    },
  },
  globals: { locale: 'pt-BR' },
};

/**
 * Zero expenses — edge case. Reviewer interaction: clear the monthly-expenses
 * input. Calculator should gracefully handle the zero state (no division-by-zero,
 * no Infinity, results panel hides or shows a friendly empty state).
 */
export const ZeroExpenses: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Edge state — clear the monthly-expenses input to test the zero-state branch. The component should not render NaN/Infinity.',
      },
    },
  },
};
