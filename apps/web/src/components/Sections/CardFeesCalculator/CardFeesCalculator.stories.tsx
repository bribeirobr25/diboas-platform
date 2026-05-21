/**
 * CardFeesCalculator Storybook Stories (Phase 3B PR-3B, 2026-05-18).
 *
 * Tier-3 B2B tool that projects card-processor fee savings over N years.
 * Component takes no props; state seeded from `CARD_FEES_DEFAULTS` + `useLocale()`.
 * Locale-aware processor-fee rate per Phase 6E: en 2.9% / pt-BR 3.0% / es+de 1.75%
 * (EU Interchange Fee Regulation).
 *
 * Stories per plan §4.5 — 3 stories:
 *   1. Default — en (2.9% US processor fee)
 *   2. HighVolume — reviewer drives volume way up
 *   3. DELocale — de (1.75% EU IFR rate kicks in)
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { CardFeesCalculator } from './CardFeesCalculator';

const meta: Meta<typeof CardFeesCalculator> = {
  title: 'Sections/CardFeesCalculator',
  component: CardFeesCalculator,
  parameters: {
    docs: {
      description: {
        component: `
# CardFeesCalculator

B2B tool. Projects annual card-processor fees vs diBoaS alternative across N
years. Per-locale processor-fee rates baked in: US 2.9% / BR 3.0% / EU 1.75%
(post-IFR). The yearly volume slider drives the projection.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CardFeesCalculator>;

/** Default — en, US 2.9% processor fee. */
export const Default: Story = {};

/**
 * High Volume — reviewer drives the yearly-volume input to a B2B-scale figure
 * (e.g., $5M+/yr). Tests slider cap behavior and large-number formatting.
 */
export const HighVolume: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Reviewer focus: drive yearly volume to $5M+. Exercises slider cap + large-number formatting in the savings projection.',
      },
    },
  },
};

/**
 * DE locale — exercises the EU IFR 1.75% processor rate (lower than US 2.9%).
 * The savings comparison is materially different here than en.
 */
export const DELocale: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'German locale — processor rate is 1.75% post-IFR. Savings vs diBoaS comparison is smaller than en (US 2.9%).',
      },
    },
  },
  globals: { locale: 'de' },
};
