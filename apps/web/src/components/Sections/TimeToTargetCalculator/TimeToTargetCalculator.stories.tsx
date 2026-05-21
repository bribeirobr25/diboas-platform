/**
 * TimeToTargetCalculator Storybook Stories (Phase 3B PR-3B, 2026-05-18).
 *
 * Tier-2 tool that estimates years-to-target across 4 yield scenarios (bank,
 * conservative 7%, historical 10%, optimistic 14%). Component takes no props;
 * state seeded from `TIME_TO_TARGET_DEFAULTS` + `useLocale()`.
 *
 * Stories per plan §4.5 — 3 stories:
 *   1. Default — en baseline ($50k goal, $250/mo, monthly cadence)
 *   2. NonBankScenario — reviewer focus: scenario card comparison vs bank
 *   3. GoalUnreachable — edge: drive contribution way below growth needed
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { TimeToTargetCalculator } from './TimeToTargetCalculator';

const meta: Meta<typeof TimeToTargetCalculator> = {
  title: 'Sections/TimeToTargetCalculator',
  component: TimeToTargetCalculator,
  parameters: {
    docs: {
      description: {
        component: `
# TimeToTargetCalculator

"When will I reach \\$X?" Output spans bank / conservative / historical / optimistic
scenarios. Cadence selector is the Phase 1 Select primitive (7 values).
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TimeToTargetCalculator>;

/** Default — en, $50k goal, $250/mo monthly. */
export const Default: Story = {};

/**
 * NonBankScenario focus — reviewer compares Historical (10%) vs Your Bank scenario.
 * The 4-card grid shows side-by-side timelines.
 */
export const NonBankScenario: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Default state; reviewer focus: scenario-card grid (Your Bank / Conservative / Historical / Optimistic) and how the timelines diverge.',
      },
    },
  },
};

/**
 * Goal-Unreachable edge — reviewer interaction: set goal to $10M with $50/mo
 * contribution. Bank scenario will be effectively unreachable; component should
 * show a graceful "infinite years" or capped fallback (e.g., "40+ years").
 */
export const GoalUnreachable: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Edge — drive goal=$10M, contribution=$50/mo. Bank-rate path is effectively unreachable; component should render a capped or "infinite" fallback gracefully.',
      },
    },
  },
};
