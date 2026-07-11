/**
 * MoneyJobsCalculator Storybook Stories (tool #11 — NEW_TOOL_PROPOSAL.md §7).
 *
 * The /tools entry point: give every part of a monthly amount a job.
 * State is internal, seeded from `MONEY_JOBS_DEFAULTS` per locale; the
 * essentials input pre-fills from the attested per-locale share and stays
 * user-adjustable. Mode pills switch B2C ("For you") / B2B ("For your
 * business") — decision 6 lets the page pass `initialMode="business"` for
 * `?for=business` arrivals.
 *
 * Stories:
 *   1. Personal — en-locale B2C baseline (three-job split + gate)
 *   2. Business — B2B baseline via initialMode (floor / runway / excess)
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { MoneyJobsCalculator } from './MoneyJobsCalculator';

const meta: Meta<typeof MoneyJobsCalculator> = {
  title: 'Sections/MoneyJobsCalculator',
  component: MoneyJobsCalculator,
  parameters: {
    docs: {
      description: {
        component: `
# MoneyJobsCalculator

Tool #11 — the split-first entry point. Free surface: jobless-money headline,
cost-only inflation line, Floor/Cushion/Working cards, ideal◄►max band.
Email gate (inline, GDPR-explicit) unlocks plan + projections (Conservative
leads per the P2-c ruling). Dignity state (F3) and B2B runway mode
(decision 9) suppress the sell when protection should lead.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MoneyJobsCalculator>;

export const Personal: Story = {};

export const Business: Story = {
  args: { initialMode: 'business' },
};
