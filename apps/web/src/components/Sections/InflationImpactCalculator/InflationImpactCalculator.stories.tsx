/**
 * InflationImpactCalculator Storybook Stories (Phase 3B PR-3B, 2026-05-18).
 *
 * Tier-2 tool with two modes:
 *   - Forward: future purchasing power of today-amount given locale inflation
 *   - Retrospective (Phase D.1): purchasing power of a 2010 amount today using
 *     `cumulativeSince2010` from Phase A
 *
 * Component takes no props; state seeded from `INFLATION_IMPACT_DEFAULTS` +
 * `useLocale()` + internal `mode` useState (defaults to 'forward').
 *
 * Stories per plan §4.5 — 4 stories:
 *   1. DefaultForward — en, forward mode, default amount
 *   2. Retrospective2010 — reviewer focus: click "Since 2010" tab
 *   3. NonUSDLocale — pt-BR forward mode (high BRL inflation)
 *   4. NonUSDRetrospective — pt-BR + reviewer clicks Since 2010 tab
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { InflationImpactCalculator } from './InflationImpactCalculator';

const meta: Meta<typeof InflationImpactCalculator> = {
  title: 'Sections/InflationImpactCalculator',
  component: InflationImpactCalculator,
  parameters: {
    docs: {
      description: {
        component: `
# InflationImpactCalculator

Forward mode shows what cash loses to inflation over N years. Retrospective mode
(Phase D.1) shows what a Jan-2010 amount is worth today using cumulative
inflation from Phase A research anchors.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof InflationImpactCalculator>;

/** Default forward mode — en, $1000, 10 years out. */
export const DefaultForward: Story = {};

/**
 * Retrospective2010 — reviewer clicks the "Since 2010" tab. Switches mode
 * to retrospective; output shows purchasing-power decay (e.g., $1000 from 2010
 * is worth $657 today in US per 52.3% cumulative inflation).
 */
export const Retrospective2010: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Reviewer focus: click the "Since 2010" tab to switch to retrospective mode. Output renders cumulative-inflation drag.',
      },
    },
  },
};

/** Non-USD locale — pt-BR forward mode (Brazilian inflation ~4.5%/yr). */
export const NonUSDLocale: Story = {
  parameters: {
    docs: {
      description: {
        story: 'pt-BR exercises BRL formatting; Brazilian 5y-avg inflation drives the forward calculation.',
      },
    },
  },
  globals: { locale: 'pt-BR' },
};

/**
 * Non-USD retrospective — pt-BR + click "Since 2010" tab. Surfaces the BRL
 * cumulative inflation since 2010 (~145% per Phase A research).
 */
export const NonUSDRetrospective: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'pt-BR retrospective — reviewer clicks "Since 2010" tab. Shows ~145% BRL cumulative inflation since 2010.',
      },
    },
  },
  globals: { locale: 'pt-BR' },
};
