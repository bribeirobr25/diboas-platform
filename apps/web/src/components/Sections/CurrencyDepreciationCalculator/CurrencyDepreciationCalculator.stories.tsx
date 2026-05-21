/**
 * CurrencyDepreciationCalculator Storybook Stories (Phase 3B PR-3B, 2026-05-18).
 *
 * Tier-2 tool with two modes (Phase D.2):
 *   - Forward: compares cash / bank / digital-dollar over N years for the
 *     selected non-USD currency, accounting for projected depreciation.
 *   - Retrospective: shows actual 2010→2026 depreciation using historical CAGR.
 *
 * Component takes no props; state seeded from defaults + `useLocale()` + internal
 * `mode` + `currency` state. The Currency select is the Phase 1 Select primitive.
 *
 * Stories per plan §4.5 — 3 stories:
 *   1. Default — en, USD currency (shows USD-holder disclaimer)
 *   2. Retrospective — reviewer clicks "Since 2010" tab
 *   3. NonUSDLocale — pt-BR with BRL preselected
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { CurrencyDepreciationCalculator } from './CurrencyDepreciationCalculator';

const meta: Meta<typeof CurrencyDepreciationCalculator> = {
  title: 'Sections/CurrencyDepreciationCalculator',
  component: CurrencyDepreciationCalculator,
  parameters: {
    docs: {
      description: {
        component: `
# CurrencyDepreciationCalculator

For non-USD currency holders. Forward mode shows projected depreciation against
USD over N years. Retrospective mode (Phase D.2) shows the actual 2010→2026
depreciation history (e.g., BRL −67.6%, EUR −21% per Phase A research).
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CurrencyDepreciationCalculator>;

/**
 * Default — en, USD selected. Shows the "USD holders → depreciation defaults to 0"
 * disclaimer note. Tool primarily useful for non-USD currencies.
 */
export const Default: Story = {};

/**
 * Retrospective — reviewer clicks "Since 2010" tab. With a non-USD currency,
 * shows the actual historical depreciation pair (anchor start/end).
 */
export const Retrospective: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Reviewer focus: pick BRL or EUR from the Currency select, click "Since 2010" tab. Shows actual 2010→2026 depreciation from Phase A research anchors.',
      },
    },
  },
};

/**
 * Non-USD locale — pt-BR (Brazilian Real). Forward mode shows projected BRL
 * depreciation (~3%/yr) and the digital-dollar hedge comparison.
 */
export const NonUSDLocale: Story = {
  parameters: {
    docs: {
      description: {
        story: 'pt-BR locale — defaults to BRL currency. Reviewer can switch to retrospective for the 67.6% BRL drag since 2010.',
      },
    },
  },
  globals: { locale: 'pt-BR' },
};
