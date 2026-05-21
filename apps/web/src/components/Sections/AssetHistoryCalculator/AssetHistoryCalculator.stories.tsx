/**
 * AssetHistoryCalculator Storybook Stories (Phase 3B PR-3B, 2026-05-18).
 *
 * Phase E retrospective tool — 8 assets × 2 start years × 2 modes = 32 combos.
 * Component takes no props; state seeded from `ASSET_HISTORY_DEFAULTS` per
 * locale (en defaults to BTC / 2016 / Monthly DCA / $100). 3 Select primitives
 * drive asset / startYear / mode (Phase 1 retrofit).
 *
 * Output is confidence-stratified (per audit M6):
 *   - HIGH:   single terminal number ±5%
 *   - MEDIUM: single number with explicit ± uncertainty note
 *   - LOW:    RANGE display ($500M-$1.5B for BTC 2010 DCA) — calm-framing
 *
 * Stories per plan §4.5 — 5 stories:
 *   1. Default — en, BTC 2016 DCA (default state — MEDIUM confidence)
 *   2. BTC2010Range — reviewer picks BTC 2010 DCA → LOW confidence RANGE
 *   3. BTC2016DCA — explicit BTC 2016 DCA = $200K (default; named for clarity)
 *   4. LumpSum — reviewer switches Mode select to Lump Sum
 *   5. NonUSDLocale — pt-BR + reviewer picks Ibovespa (BRL-denominated asset)
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { AssetHistoryCalculator } from './AssetHistoryCalculatorFactory';

const meta: Meta<typeof AssetHistoryCalculator> = {
  title: 'Sections/AssetHistoryCalculator',
  component: AssetHistoryCalculator,
  parameters: {
    docs: {
      description: {
        component: `
# AssetHistoryCalculator

Phase E retrospective tool. Pick asset (8 options) + start year (2010 / 2016) +
mode (Lump sum / Monthly DCA). Output renders one of three confidence states
per audit M6: HIGH ±5%, MEDIUM single-with-note, LOW range-display.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AssetHistoryCalculator>;

/** Default — en, BTC 2016 Monthly DCA ($100/mo over 122 months → $200K, MEDIUM). */
export const Default: Story = {};

/**
 * BTC 2010 DCA → LOW confidence RANGE. Reviewer focus: change Start Year to 2010
 * while keeping Monthly DCA. The output should switch from a single number to
 * a RANGE ($500M–$1.5B per research) with calm-framing language.
 */
export const BTC2010Range: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Reviewer focus: select Start Year=2010, Mode=Monthly DCA. Calculator should render LOW-confidence RANGE display ($500M–$1.5B), NOT a single number — calm-framing per audit M6.',
      },
    },
  },
};

/** BTC 2016 DCA — explicit-name variant of default (MEDIUM confidence, $200K). */
export const BTC2016DCA: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default state by another name — BTC 2016 Monthly DCA. MEDIUM confidence with uncertainty note citing $417 anchor.',
      },
    },
  },
};

/**
 * Lump Sum mode — reviewer switches the Mode Select from Monthly DCA to Lump Sum.
 * Single-deposit terminal calculation (e.g., BTC $100 lump sum 2016 → very different
 * number than $100/mo DCA).
 */
export const LumpSum: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Reviewer focus: switch Mode Select to "Lump sum". Calculator uses the simple start→end ratio (not the DCA terminal table).',
      },
    },
  },
};

/**
 * Non-USD locale — pt-BR + reviewer picks Ibovespa (BRL-denominated asset).
 * Tests the "digital dollar suffix" + BRL formatting per Phase 7 §5.2, plus the
 * locale-specific contribution-amount default.
 */
export const NonUSDLocale: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'pt-BR locale — reviewer picks "Ibovespa (BRL)" from the Asset Select. Output renders R$ formatted with the digital-dollar suffix on diBoaS scenarios per Phase 7.',
      },
    },
  },
  globals: { locale: 'pt-BR' },
};
