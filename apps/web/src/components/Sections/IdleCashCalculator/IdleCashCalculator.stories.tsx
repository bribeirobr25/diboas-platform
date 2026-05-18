/**
 * IdleCashCalculator Storybook Stories (Phase 3B PR-3B, 2026-05-18).
 *
 * Tier-3 B2B tool that projects idle-cash yield comparison (bank vs diBoaS
 * Historical scenario) over N years. Component takes no props; state seeded
 * from `IDLE_CASH_DEFAULTS` + `useLocale()`. For non-USD locales uses
 * `calculateWithCurrencyHedge` so output reflects digital-dollar exposure.
 *
 * Stories per plan §4.5 — 3 stories:
 *   1. Default — en (US bank-rate vs diBoaS hist 10%)
 *   2. NonUSDHedge — pt-BR (BCB bank + currency-hedge math vs digital dollar)
 *   3. LowBalance — reviewer drives amount way down
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { IdleCashCalculator } from './IdleCashCalculator';

const meta: Meta<typeof IdleCashCalculator> = {
  title: 'Sections/IdleCashCalculator',
  component: IdleCashCalculator,
  parameters: {
    docs: {
      description: {
        component: `
# IdleCashCalculator

B2B tool. Compares 3-year yield of business idle cash held at bank vs in
digital dollar at diBoaS Historical (10%). Non-USD locales surface the
currency-hedge framing per Phase 7 §5.2 ("in digital dollar" suffix).
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof IdleCashCalculator>;

/** Default — en, US bank vs diBoaS 10%. */
export const Default: Story = {};

/**
 * Non-USD hedge — pt-BR exercises the currency-hedge math: BCB 6.83% bank rate
 * vs digital-dollar effective APY ((1+0.10)*(1+0.03)-1 ≈ 13.3% in BRL terms).
 * The "in digital dollar" suffix should appear on the diBoaS scenario.
 */
export const NonUSDHedge: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'pt-BR — exercises currency-hedge math. diBoaS scenario shows "em dólar digital" suffix per Phase 7.',
      },
    },
  },
  globals: { locale: 'pt-BR' },
};

/**
 * Low Balance — reviewer drives the idle-cash amount to a low value (e.g., $1k).
 * Tests slider lower-bound + small-number formatting of the savings delta.
 */
export const LowBalance: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Reviewer focus: drive idle-cash input to $1,000. Tests slider lower bound and small-savings-delta formatting.',
      },
    },
  },
};
